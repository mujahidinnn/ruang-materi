# Ruang Materi

Ruang Materi mengubah slide pembelajaran (PowerPoint) menjadi halaman interaktif yang bisa ditelusuri langsung di browser — tanpa mengunduh atau membuka aplikasi tambahan.

## Cara Kerja

1. Taruh file `.pptx` di `public/pptx/`, lalu tambahkan entrinya (slug, title, description, nama file) di `data/presentations.ts`.
2. Jalankan `npm run generate:slides` untuk mengonversi setiap deck menjadi gambar **AVIF** per slide di `public/slides/<slug>/`, sekaligus menulis manifest ke `data/presentations.json`.
3. Halaman `app/belajar/[slug]` membaca manifest tersebut dan menampilkan deck sebagai galeri slide yang bisa dijelajahi.

Konversi memakai `soffice` (LibreOffice) dan `pdftoppm`/`pdfinfo` (poppler-utils) untuk pptx → PNG, lalu `sharp` (Node) untuk re-encode PNG → AVIF (jauh lebih ringan dengan kualitas visual yang tetap tajam). Pastikan binary LibreOffice/poppler tersedia di PATH sebelum menjalankan skrip.

## Menjalankan Secara Lokal

```bash
npm install
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) untuk melihat hasilnya.

## Struktur Proyek

- `app/` — halaman Next.js (App Router), termasuk `app/belajar/[slug]` untuk viewer materi.
- `components/` — komponen UI seperti `PresentationViewer` dan `AnimatedHeroTitle`.
- `data/presentations.ts` — daftar materi (judul, deskripsi, nama file pptx), diedit manual — input untuk skrip generate.
- `data/presentations.json` — manifest hasil generate (judul, deskripsi, daftar slide), dibaca oleh `lib/presentations.ts`. Jangan edit manual.
- `lib/` — util situs (metadata, konfigurasi) dan akses data presentasi.
- `public/pptx/` — file sumber `.pptx`.
- `public/slides/` — hasil render AVIF per slide (dibuat otomatis, jangan edit manual).
- `scripts/generate-slides.mjs` — skrip konversi pptx → slide AVIF + manifest.

## Skrip

| Perintah | Keterangan |
| --- | --- |
| `npm run dev` | Jalankan server pengembangan Next.js |
| `npm run build` | Build untuk produksi |
| `npm run start` | Jalankan build produksi |
| `npm run lint` | Jalankan ESLint |
| `npm run generate:slides` | Konversi ulang semua `.pptx` di `public/pptx/` menjadi slide AVIF + manifest |
