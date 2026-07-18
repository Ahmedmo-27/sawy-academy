interface GridColumnsProps {
  className?: string;
}

/** Swiss 12-column module guides — structural, non-interactive */
export function GridColumns({ className = "" }: GridColumnsProps) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 z-0 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      <div className="site-container h-full relative">
        <div className="grid grid-cols-12 gap-0 h-full opacity-[0.35]">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="border-r border-hairline/50 h-full last:border-r-0" />
          ))}
        </div>
      </div>
    </div>
  );
}
