interface CourseImagePlaceholderProps {
  kind: "course" | "diploma";
}

export function CourseImagePlaceholder({
  kind,
}: CourseImagePlaceholderProps) {
  const label = kind === "diploma" ? "DIPLOMA" : "COURSE";

  return (
    <div
      className="relative aspect-square max-w-[5.5rem] overflow-hidden hairline-border bg-concrete-dark/40"
      aria-hidden="true"
    >
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 88 88"
        fill="none"
      >
        <path
          d="M16 18h56v52H16zM24 27h40M24 35h24M24 43h40M24 51h18"
          stroke="var(--color-construction-muted)"
          strokeWidth="1"
        />
        <path
          d="M56 35v24M48 59h16M52 55l8-8 4 4"
          stroke="var(--color-clay)"
          strokeWidth="1"
        />
        <path
          d="M12 14v8M8 18h8M76 66v8M72 70h8"
          stroke="var(--color-charcoal-infill)"
          strokeWidth="0.75"
          opacity="0.45"
        />
      </svg>
      <span className="dim-label absolute bottom-2 left-2 text-[0.5rem]">
        {label}
      </span>
    </div>
  );
}
