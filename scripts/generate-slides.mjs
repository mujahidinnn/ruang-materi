#!/usr/bin/env node
// Converts every .pptx in public/pptx into per-slide PNGs under public/slides/<slug>/
// and writes a static manifest to data/presentations.json.
//
// Requires `soffice` (LibreOffice) and `pdftoppm` (poppler-utils) on PATH.
// Run manually whenever slides in public/pptx change: `npm run generate:slides`

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const execFileAsync = promisify(execFile);

const ROOT = path.resolve(import.meta.dirname, "..");
const PPTX_DIR = path.join(ROOT, "public", "pptx");
const SLIDES_DIR = path.join(ROOT, "public", "slides");
const DATA_DIR = path.join(ROOT, "data");
const RENDER_DPI = 240;

// Hand-tuned title/description per deck slug. Falls back to filename-derived
// copy for any pptx dropped in without an entry here.
const OVERRIDES = {
  git: {
    title: "Git",
    description:
      "Panduan komprehensif sistem kontrol versi, dari konsep dasar dan alur kerja harian, branching & merging, hingga kolaborasi tim profesional menggunakan repositori remote.",
  },
  "git-dan-github": {
    title: "Git & GitHub",
    description:
      "Belajar version control dari nol sampai kolaborasi tim di GitHub, lewat studi kasus membuat akun hingga mengirim pull request.",
  },
  "git-dan-gitlab": {
    title: "Git & GitLab",
    description:
      "Belajar version control dari konsep dasar Git sampai kolaborasi tim modern, lengkap dengan studi kasus CI/CD di GitLab.",
  },
  html5: {
    title: "HTML5",
    description:
      "Fondasi modern pengembangan web: struktur dokumen, elemen semantik, multimedia, hingga API terbaru di HTML5.",
  },
  "html5-dan-css3": {
    title: "HTML5 dan CSS3",
    description:
      "Fondasi struktur halaman web dan penguasaan styling modern, mulai dari selector dan layout, responsive design, hingga animasi CSS3.",
  },
  "html-css-javascript": {
    title: "HTML CSS JavaScript",
    description:
      "Memahami bagaimana HTML, CSS, dan JavaScript saling terhubung, dirangkai dari alur kerja nyata, studi kasus, dan praktik terbaik.",
  },
  javascript: {
    title: "JavaScript",
    description:
      "Panduan komprehensif JavaScript dari fundamental dan ES6, hingga fitur-fitur terkini, mencakup kontrol alur, objek, dan studi kasus.",
  },
};

// Display order on the site, following the learning path rather than
// filename alphabetical order. Slugs not listed here are appended at the
// end (alphabetically), so a newly dropped-in pptx never goes missing.
const DECK_ORDER = [
  "git",
  "git-dan-github",
  "git-dan-gitlab",
  "html5",
  "html5-dan-css3",
  "html-css-javascript",
  "javascript",
];

function byDeckOrder(a, b) {
  const ia = DECK_ORDER.indexOf(a.slug);
  const ib = DECK_ORDER.indexOf(b.slug);
  if (ia === -1 && ib === -1) return a.slug.localeCompare(b.slug);
  if (ia === -1) return 1;
  if (ib === -1) return -1;
  return ia - ib;
}

function slugify(input) {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function titleize(filename) {
  return filename
    .replace(/\.[^.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Reads width/height straight out of the PNG IHDR chunk, avoiding an image-library dependency.
async function readPngSize(filePath) {
  const buffer = await readFile(filePath);
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  return { width, height };
}

async function convertPptxToPdf(pptxPath, outDir) {
  await execFileAsync("soffice", [
    "--headless",
    "--nologo",
    "--nofirststartwizard",
    "--convert-to",
    "pdf",
    "--outdir",
    outDir,
    pptxPath,
  ]);
  const pdfName = path.basename(pptxPath).replace(/\.pptx$/i, ".pdf");
  return path.join(outDir, pdfName);
}

// `pdftoppm -r <dpi>` derives pixel dimensions from the PDF's own page box in
// points, but LibreOffice's pptx->pdf export emits a page box with a tiny
// fractional error (e.g. 960.009pt instead of 960pt). Poppler then rounds
// that up to an extra pixel column, which renders as a stray white line down
// one edge since no slide content extends into it. Reading the true page
// size ourselves and asking pdftoppm to scale to an exact rounded pixel
// size (instead of letting it derive one from the DPI) avoids the artifact.
async function getPdfPageSizePt(pdfPath) {
  const { stdout } = await execFileAsync("pdfinfo", [pdfPath]);
  const match = stdout.match(/Page size:\s+([\d.]+)\s*x\s*([\d.]+)\s*pts/);
  if (!match) {
    throw new Error(`Could not read page size from pdfinfo for ${pdfPath}`);
  }
  return { widthPt: Number(match[1]), heightPt: Number(match[2]) };
}

async function convertPdfToSlides(pdfPath, outDir, slug) {
  await mkdir(outDir, { recursive: true });
  const prefix = path.join(outDir, "slide");
  const { widthPt, heightPt } = await getPdfPageSizePt(pdfPath);
  const widthPx = Math.round((widthPt * RENDER_DPI) / 72);
  const heightPx = Math.round((heightPt * RENDER_DPI) / 72);
  await execFileAsync("pdftoppm", [
    "-png",
    "-scale-to-x",
    String(widthPx),
    "-scale-to-y",
    String(heightPx),
    pdfPath,
    prefix,
  ]);

  const files = (await readdir(outDir))
    .filter((f) => f.startsWith("slide-") && f.endsWith(".png"))
    .sort((a, b) => {
      const na = Number(a.match(/slide-(\d+)\.png/)[1]);
      const nb = Number(b.match(/slide-(\d+)\.png/)[1]);
      return na - nb;
    });

  const slides = [];
  for (let i = 0; i < files.length; i++) {
    const oldPath = path.join(outDir, files[i]);
    const index = i + 1;
    const paddedName = `slide-${String(index).padStart(2, "0")}.png`;
    const newPath = path.join(outDir, paddedName);
    if (oldPath !== newPath) {
      const { rename } = await import("node:fs/promises");
      await rename(oldPath, newPath);
    }
    const { width, height } = await readPngSize(newPath);
    slides.push({
      index,
      src: `/slides/${slug}/${paddedName}`,
      width,
      height,
    });
  }
  return slides;
}

async function main() {
  const entries = (await readdir(PPTX_DIR)).filter((f) => f.toLowerCase().endsWith(".pptx"));

  if (entries.length === 0) {
    console.error(`No .pptx files found in ${PPTX_DIR}`);
    process.exit(1);
  }

  const workDir = await mkdtemp(path.join(tmpdir(), "ruang-materiku-pptx-"));
  const presentations = [];

  try {
    for (const filename of entries) {
      const slug = slugify(titleize(filename));
      const override = OVERRIDES[slug];
      const title = override?.title ?? titleize(filename);
      console.log(`Converting ${filename} -> ${slug}`);

      const pptxPath = path.join(PPTX_DIR, filename);
      const pdfPath = await convertPptxToPdf(pptxPath, workDir);
      const outDir = path.join(SLIDES_DIR, slug);
      await rm(outDir, { recursive: true, force: true });
      const slides = await convertPdfToSlides(pdfPath, outDir, slug);

      presentations.push({
        slug,
        title,
        description:
          override?.description ??
          `${slides.length} slide materi "${title}". Jelajahi langsung di browser tanpa perlu mengunduh.`,
        slideCount: slides.length,
        slides,
      });

      console.log(`  -> ${slides.length} slides written to public/slides/${slug}/`);
    }

    presentations.sort(byDeckOrder);

    await mkdir(DATA_DIR, { recursive: true });
    const manifestPath = path.join(DATA_DIR, "presentations.json");
    await writeFile(manifestPath, JSON.stringify(presentations, null, 2) + "\n", "utf8");
    console.log(`\nManifest written to data/presentations.json (${presentations.length} decks)`);
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
