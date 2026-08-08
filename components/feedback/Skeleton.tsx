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
      className={`skeleton-block block ${className}`}
      role={decorative ? undefined : "status"}
      aria-label={decorative ? undefined : label}
      aria-hidden={decorative || undefined}
    />
  );
}

export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-px bg-hairline sm:grid-cols-2 lg:grid-cols-3" aria-label="Loading items">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="bg-concrete p-4" aria-hidden="true">
          <Skeleton className="aspect-[4/5] w-full" />
          <Skeleton className="mt-5 h-3 w-20" />
          <Skeleton className="mt-3 h-6 w-3/4" />
          <Skeleton className="mt-3 h-3 w-full" />
        </div>
      ))}
      <span className="sr-only">Loading items</span>
    </div>
  );
}
