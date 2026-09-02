import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import AnimatedHeroTitle from "@/components/AnimatedHeroTitle";
import { getPresentations } from "@/lib/presentations";
import { SITE_DESCRIPTION } from "@/lib/site";

export default function Home() {
  const presentations = getPresentations();
  const totalSlides = presentations.reduce((sum, p) => sum + p.slideCount, 0);

  return (
    <>
      <header className="border-b border-zinc-800/80 px-6 py-5 sm:px-10">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <span className="text-sm font-semibold tracking-tight text-zinc-50">
            Materiku
          </span>
          <span className="hidden text-xs tracking-wide text-zinc-500 sm:block">
            Ruang Belajar Interaktif
          </span>
        </div>
      </header>

      <main className="px-6 sm:px-10">
        <div className="mx-auto max-w-5xl">
          <section className="border-b border-zinc-800/80 py-16 sm:py-24">
            <p className="text-xs font-medium tracking-widest text-zinc-500 uppercase">
              {presentations.length} materi · {totalSlides} slide
            </p>
            <AnimatedHeroTitle />
            <p className="mt-6 max-w-xl text-base leading-relaxed text-zinc-400 sm:text-lg">
              {SITE_DESCRIPTION}
            </p>
          </section>

          <section aria-label="Daftar materi belajar" className="py-16 sm:py-24">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8">
              {presentations.map((presentation) => (
                <article
                  key={presentation.slug}
                  className="overflow-hidden rounded-lg border border-zinc-800/80 bg-zinc-950 transition-colors hover:border-zinc-700"
                >
                  <Link
                    href={`/belajar/${presentation.slug}`}
                    className="group flex h-full flex-col"
                  >
                    <div className="relative aspect-video overflow-hidden border-b border-zinc-800/80">
                      <Image
                        src={presentation.slides[0].src}
                        alt={`Sampul materi ${presentation.title}`}
                        fill
                        sizes="(min-width: 640px) 50vw, 100vw"
                        className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.02]"
                      />
                    </div>
                    <div className="flex flex-1 flex-col gap-3 p-6">
                      <div className="flex items-start justify-between gap-4">
                        <h2 className="text-xl font-semibold tracking-tight text-zinc-50">
                          {presentation.title}
                        </h2>
                        <ArrowUpRight
                          className="mt-1 h-5 w-5 shrink-0 text-zinc-600 transition-colors group-hover:text-zinc-50"
                          strokeWidth={1.75}
                        />
                      </div>
                      <p className="flex-1 text-sm leading-relaxed text-zinc-400">
                        {presentation.description}
                      </p>
                      <span className="font-mono text-xs tracking-wide text-zinc-500">
                        {String(presentation.slideCount).padStart(2, "0")} SLIDE
                      </span>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          </section>
        </div>
      </main>

      <footer className="border-t border-zinc-800/80 px-6 py-8 sm:px-10">
        <div className="mx-auto flex max-w-5xl flex-col gap-1 text-xs text-zinc-600 sm:flex-row sm:items-center sm:justify-between">
          <span>
            &copy; {new Date().getFullYear()} Materiku. Seluruh hak cipta
            dilindungi.
          </span>
          <a
            href="https://mujahidin.my.id"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="mujahidin.my.id"
            className="font-[family-name:var(--font-signature)] text-2xl text-zinc-500 transition-colors hover:text-zinc-300"
          >
            Mujahidin
          </a>
        </div>
      </footer>
    </>
  );
}
