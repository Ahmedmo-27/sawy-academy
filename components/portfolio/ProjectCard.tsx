"use client";

import { useThemeSlots } from "@/components/theme/slots";

interface ProjectCardProps {
  title: string;
  category: string;
  year: string;
  image: string;
  sheetRef: string;
  href: string;
  aspectClass?: string;
  index?: number;
}

export function ProjectCard({
  title,
  category,
  year,
  image,
  sheetRef,
  href,
  index,
}: ProjectCardProps) {
  const { Card } = useThemeSlots();
  const caption = [category, year].filter(Boolean).join(" · ");
  const meta =
    typeof index === "number" || !sheetRef ? caption : [sheetRef, caption].filter(Boolean).join(" · ");

  return (
    <Card title={title} meta={meta} image={image} href={href} index={index} />
  );
}
