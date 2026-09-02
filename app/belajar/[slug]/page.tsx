import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PresentationViewer from "@/components/PresentationViewer";
import { getPresentation, getPresentations } from "@/lib/presentations";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export function generateStaticParams() {
  return getPresentations().map((presentation) => ({
    slug: presentation.slug,
  }));
}

export async function generateMetadata(
  props: PageProps<"/belajar/[slug]">
): Promise<Metadata> {
  const { slug } = await props.params;
  const presentation = getPresentation(slug);

  if (!presentation) {
    return {};
  }

  const { title, description, slides } = presentation;
  const url = `${SITE_URL}/belajar/${slug}`;
  const ogImage = slides[0]?.src;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: "article",
      title: `${title} · ${SITE_NAME}`,
      description,
      url,
      siteName: SITE_NAME,
      images: ogImage
        ? [{ url: ogImage, width: slides[0].width, height: slides[0].height }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} · ${SITE_NAME}`,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

export default async function PresentationPage(
  props: PageProps<"/belajar/[slug]">
) {
  const { slug } = await props.params;
  const presentation = getPresentation(slug);

  if (!presentation) {
    notFound();
  }

  return (
    <main>
      <PresentationViewer presentation={presentation} />
    </main>
  );
}
