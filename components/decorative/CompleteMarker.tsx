/**
 * Line-art completion mark — two strokes forming a check, matching
 * the site's hairline / charcoal drawing language (not a filled icon).
 */
export function CompleteMarker({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M2.5 8.5 L6.5 12.5 L13.5 3.5"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
    </svg>
  );
}
