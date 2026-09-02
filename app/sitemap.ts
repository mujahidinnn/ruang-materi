import type { MetadataRoute } from "next";
import { getPresentations } from "@/lib/presentations";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const presentations = getPresentations();

  return [
    {
      url: SITE_URL,
      changeFrequency: "monthly",
      priority: 1,
    },
    ...presentations.map((presentation) => ({
      url: `${SITE_URL}/belajar/${presentation.slug}`,
      changeFrequency: "yearly" as const,
      priority: 0.8,
    })),
  ];
}
