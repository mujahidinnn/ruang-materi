import presentations from "@/data/presentations.json";

export type Slide = {
  index: number;
  src: string;
  width: number;
  height: number;
};

export type Presentation = {
  slug: string;
  title: string;
  description: string;
  slideCount: number;
  slides: Slide[];
};

const data = presentations as Presentation[];

export function getPresentations(): Presentation[] {
  return data;
}

export function getPresentation(slug: string): Presentation | undefined {
  return data.find((presentation) => presentation.slug === slug);
}
