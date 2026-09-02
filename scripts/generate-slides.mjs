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
};

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

async function convertPdfToSlides(pdfPath, outDir, slug) {
  await mkdir(outDir, { recursive: true });
  const prefix = path.join(outDir, "slide");
  await execFileAsync("pdftoppm", ["-png", "-r", String(RENDER_DPI), pdfPath, prefix]);

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

  const workDir = await mkdtemp(path.join(tmpdir(), "materiku-pptx-"));
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
