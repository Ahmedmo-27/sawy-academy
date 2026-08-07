import { MediaFallbackSketch } from "@/components/decorative/MediaFallbackSketch";

interface CourseImagePlaceholderProps {
  kind: "course" | "diploma";
}

export function CourseImagePlaceholder({
  kind,
}: CourseImagePlaceholderProps) {
  const label = kind === "diploma" ? "DIPLOMA" : "COURSE";

  return (
    <div
      className="relative aspect-square max-w-[5.5rem] overflow-hidden hairline-border"
      aria-hidden="true"
    >
      <MediaFallbackSketch kind="course" label={label} />
    </div>
  );
}
