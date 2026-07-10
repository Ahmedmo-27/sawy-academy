import Link from "next/link";
import { ImageFrame } from "@/components/decorative/ImageFrame";
import { ScaleBar } from "@/components/decorative/ScaleBar";
import { BlueprintMorphImage } from "@/components/animation/BlueprintMorphImage";

interface ProjectCardProps {
  title: string;
  category: string;
  year: string;
  image: string;
  sheetRef: string;
  href: string;
  aspectClass?: string;
}

export function ProjectCard({
  title,
  category,
  year,
  image,
  sheetRef,
  href,
  aspectClass = "aspect-[4/5]",
}: ProjectCardProps) {
  return (
    <Link
      href={href}
      className="interactive-card elevation-surface group block bg-concrete h-full"
    >
      <ImageFrame className={aspectClass}>
        <BlueprintMorphImage
          src={image}
          alt={title}
          sizes="(max-width: 768px) 100vw, 33vw"
        />
        <div className="project-overlay absolute inset-0 bg-charcoal/60 flex flex-col justify-end p-6 pointer-events-none">
            <p className="label-caps !text-concrete/90 mb-2">{sheetRef}</p>
            <h3 className="type-title !text-concrete mb-1">{title}</h3>
            <p className="label-caps !text-concrete/80">
              {category} / {year}
            </p>
          </div>
      </ImageFrame>
      <div className="p-6 group-hover:opacity-0 transition-opacity duration-300 hidden lg:block">
        <ScaleBar scale="1:50" className="mb-4" />
        <p className="dim-label mb-2">{sheetRef}</p>
        <h3 className="type-title mb-2">{title}</h3>
        <p className="label-caps">
          {category} / {year}
        </p>
      </div>
      <div className="p-6 lg:hidden">
        <ScaleBar scale="1:50" className="mb-4" />
        <p className="dim-label mb-2">{sheetRef}</p>
        <h3 className="type-title mb-2">{title}</h3>
        <p className="label-caps">
          {category} / {year}
        </p>
      </div>
    </Link>
  );
}
