interface ScaleBarProps {
  scale?: string;
  className?: string;
}

export function ScaleBar({ scale = "1:100", className = "" }: ScaleBarProps) {
  return (
    <div
      className={`flex items-center gap-3 ${className}`}
      aria-hidden="true"
    >
      <span className="dim-label">Scale {scale}</span>
      <span className="flex-1 max-w-16 h-px bg-hairline relative">
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-px h-2 bg-charcoal-infill/40" />
        <span className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-2 bg-charcoal-infill/40" />
      </span>
    </div>
  );
}
