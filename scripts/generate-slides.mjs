#!/usr/bin/env node
// Converts every .pptx in public/pptx into per-slide AVIF images under
// public/slides/<slug>/, and writes a static manifest to
// data/presentations.json.
//
// Requires `soffice` (LibreOffice) and `pdftoppm`/`pdfinfo` (poppler-utils)
// on PATH, plus the `sharp` package (used to re-encode PNG -> AVIF).
// Run manually whenever a .pptx in public/pptx/ changes:
//   npm run generate:slides

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdir, mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import sharp from "sharp";
import { presentations } from "../data/presentations.ts";

const execFileAsync = promisify(execFile);

const ROOT = path.resolve(import.meta.dirname, "..");
const PPTX_DIR = path.join(ROOT, "public", "pptx");
const SLIDES_DIR = path.join(ROOT, "public", "slides");
const DATA_DIR = path.join(ROOT, "data");
const RENDER_DPI = 240;
const AVIF_QUALITY = 72;

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

// `pdftoppm -r <dpi>` derives pixel dimensions from the PDF's own page box
// in points, but LibreOffice's pptx->pdf export emits a page box with a
// tiny fractional error (e.g. 960.009pt instead of 960pt). Poppler then
// rounds that up to an extra blank pixel column/row, which renders as a
// stray line down one edge since no slide content extends into it. Reading
// the true page size ourselves and asking pdftoppm to scale to an exact
// rounded pixel size (instead of letting it derive one from the DPI) avoids
// the artifact.
async function getPdfPageSizePt(pdfPath) {
  const { stdout } = await execFileAsync("pdfinfo", [pdfPath]);
  const match = stdout.match(/Page size:\s+([\d.]+)\s*x\s*([\d.]+)\s*pts/);
  if (!match) {
    throw new Error(`Could not read page size from pdfinfo for ${pdfPath}`);
  }
  return { widthPt: Number(match[1]), heightPt: Number(match[2]) };
}

async function convertPdfToPngs(pdfPath, outDir) {
  const { widthPt, heightPt } = await getPdfPageSizePt(pdfPath);
  const widthPx = Math.round((widthPt * RENDER_DPI) / 72);
  const heightPx = Math.round((heightPt * RENDER_DPI) / 72);
  const prefix = path.join(outDir, "slide");
  await execFileAsync("pdftoppm", [
    "-png",
    "-scale-to-x",
    String(widthPx),
    "-scale-to-y",
    String(heightPx),
    pdfPath,
    prefix,
  ]);

  return (await readdir(outDir))
    .filter((f) => f.startsWith("slide-") && f.endsWith(".png"))
    .sort((a, b) => {
      const na = Number(a.match(/slide-(\d+)\.png/)[1]);
      const nb = Number(b.match(/slide-(\d+)\.png/)[1]);
      return na - nb;
    })
    .map((f) => path.join(outDir, f));
}

async function convertDeck(pptxPath, outDir, slug) {
  await mkdir(outDir, { recursive: true });
  const workDir = await mkdtemp(path.join(tmpdir(), `ruang-materiku-${slug}-`));

  try {
    const pdfPath = await convertPptxToPdf(pptxPath, workDir);
    const pngPaths = await convertPdfToPngs(pdfPath, workDir);

    const slides = [];
    for (let i = 0; i < pngPaths.length; i++) {
      const index = i + 1;
      const fileName = `slide-${String(index).padStart(2, "0")}.avif`;
      const outPath = path.join(outDir, fileName);
      const info = await sharp(pngPaths[i])
        .avif({ quality: AVIF_QUALITY })
        .toFile(outPath);
      slides.push({
        index,
        src: `/slides/${slug}/${fileName}`,
        width: info.width,
        height: info.height,
      });
    }
    return slides;
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}

async function main() {
  const manifest = [];

  for (const { slug, title, description, pptxFile } of presentations) {
    console.log(`Converting ${pptxFile} -> ${slug}`);
    const pptxPath = path.join(PPTX_DIR, pptxFile);
    const outDir = path.join(SLIDES_DIR, slug);
    await rm(outDir, { recursive: true, force: true });
    const slides = await convertDeck(pptxPath, outDir, slug);

    manifest.push({
      slug,
      title,
      description,
      slideCount: slides.length,
      slides,
    });

    console.log(`  -> ${slides.length} slides written to public/slides/${slug}/`);
  }

  await mkdir(DATA_DIR, { recursive: true });
  const manifestPath = path.join(DATA_DIR, "presentations.json");
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + "\n", "utf8");
  console.log(`\nManifest written to data/presentations.json (${manifest.length} decks)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
