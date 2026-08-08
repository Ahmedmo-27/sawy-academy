import Link from "next/link";
import { ImageFrame } from "@/components/decorative/ImageFrame";
import { BlueprintMorphImage } from "@/components/animation/BlueprintMorphImage";

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
  aspectClass = "aspect-[4/3] sm:aspect-[4/5]",
  index,
}: ProjectCardProps) {
  return (
    <Link
      href={href}
      className="group block h-full min-w-0 max-w-full overflow-hidden bg-concrete focus-visible:outline-offset-4"
    >
      <div className="overflow-hidden bg-concrete-dark">
        <ImageFrame
          className={`${aspectClass} transition-transform duration-700 ease-out group-hover:scale-[1.025]`}
        >
          <BlueprintMorphImage
            src={image}
            alt={title}
            sizes="(max-width: 768px) 100vw, 50vw"
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-charcoal/35 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            aria-hidden="true"
          />
        </ImageFrame>
      </div>

      <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 border-t border-hairline py-4 sm:gap-4">
        <span className="dim-label pt-1">
          {typeof index === "number"
            ? String(index + 1).padStart(2, "0")
            : sheetRef}
        </span>
        <div className="min-w-0">
          <h2 className="break-words font-serif text-lg leading-tight text-charcoal transition-colors group-hover:text-clay sm:text-xl">
            {title}
          </h2>
          <p className="label-caps mt-2">
            {category} · {year}
          </p>
        </div>
        <span
          className="pt-0.5 text-xl font-light text-charcoal transition-transform duration-300 group-hover:translate-x-1 group-hover:text-clay"
          aria-hidden="true"
        >
          ↗
        </span>
      </div>
    </Link>
  );
}
