interface ThresholdFrameProps {
  children: React.ReactNode;
  className?: string;
  label?: string;
  /** When true, the frame label is an h2 (for page section landmarks). */
  labelAsHeading?: boolean;
}

/**
 * Corner-bracket threshold marking entry into a distinct content zone.
 * Non-interactive — purely structural framing.
 */
export function ThresholdFrame({
  children,
  className = "",
  label,
  labelAsHeading = false,
}: ThresholdFrameProps) {
  const mark =
    "absolute w-5 h-5 pointer-events-none border-charcoal/35";

  const labelClass = "label-caps mb-4 text-charcoal-infill";

  return (
    <div className={`relative ${className}`}>
      {label &&
        (labelAsHeading ? (
          <h2 className={labelClass}>{label}</h2>
        ) : (
          <p className={labelClass}>{label}</p>
        ))}
      <span className={`${mark} top-0 left-0 border-t border-l`} aria-hidden="true" />
      <span className={`${mark} top-0 right-0 border-t border-r`} aria-hidden="true" />
      <span className={`${mark} bottom-0 left-0 border-b border-l`} aria-hidden="true" />
      <span className={`${mark} bottom-0 right-0 border-b border-r`} aria-hidden="true" />
      {children}
    </div>
  );
}
