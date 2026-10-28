interface SkeletonProps {
  className?: string;
  label?: string;
  decorative?: boolean;
}

export function Skeleton({
  className = "",
  label = "Loading content",
  decorative = false,
}: SkeletonProps) {
  return (
    <span
      className={`skeleton-block relative overflow-hidden block border border-hairline/60 bg-concrete-dark/30 ${className}`}
      role={decorative ? undefined : "status"}
      aria-label={decorative ? undefined : label}
      aria-hidden={decorative || undefined}
    >
      {/* Corner crosshairs for architectural drafting feel */}
      <span
        className="pointer-events-none absolute left-1 top-1 font-mono text-[9px] text-charcoal/25 leading-none select-none"
        aria-hidden="true"
      >
        +
      </span>
      <span
        className="pointer-events-none absolute right-1 bottom-1 font-mono text-[9px] text-charcoal/25 leading-none select-none"
        aria-hidden="true"
      >
        +
      </span>
      {/* Subtle blueprint scan sweep */}
      <span
        className="pointer-events-none absolute inset-0 -translate-x-full animate-[blueprint-scan_2.2s_infinite] bg-gradient-to-r from-transparent via-clay/10 to-transparent"
        aria-hidden="true"
      />
    </span>
  );
}

export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div
      className="grid gap-px bg-hairline sm:grid-cols-2 lg:grid-cols-3"
      aria-label="Loading items"
    >
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className="relative bg-concrete p-5 sm:p-6 border border-hairline/40 flex flex-col justify-between overflow-hidden"
          aria-hidden="true"
        >
          {/* Top Sheet Header metadata */}
          <div className="flex items-center justify-between mb-4 border-b border-hairline/60 pb-2">
            <span className="font-mono text-[10px] text-clay/70 uppercase tracking-widest">
              {`DWG-0${index + 1}`}
            </span>
            <span className="font-mono text-[10px] text-charcoal/40">
              0.00m
            </span>
          </div>

          {/* Blueprint Drawing Viewport with diagonal cross-hairs */}
          <div className="relative aspect-[16/10] w-full border border-hairline bg-concrete-dark/20 overflow-hidden mb-5">
            <svg
              className="absolute inset-0 w-full h-full opacity-20"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <line x1="0" y1="0" x2="100%" y2="100%" stroke="currentColor" strokeWidth="0.5" strokeDasharray="3 3" />
              <line x1="100%" y1="0" x2="0" y2="100%" stroke="currentColor" strokeWidth="0.5" strokeDasharray="3 3" />
            </svg>
            <Skeleton className="w-full h-full" decorative />
          </div>

          {/* Title block info */}
          <div className="space-y-2.5">
            <Skeleton className="h-3 w-24" decorative />
            <Skeleton className="h-5 w-4/5" decorative />
            <Skeleton className="h-3 w-full" decorative />
          </div>
        </div>
      ))}
      <span className="sr-only">Loading items</span>
    </div>
  );
}
