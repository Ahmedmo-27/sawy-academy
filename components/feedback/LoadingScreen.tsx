import { GeometricLattice } from "@/components/decorative/GeometricLattice";

interface LoadingScreenProps {
  className?: string;
  fading?: boolean;
  label?: string;
}

export function LoadingScreen({
  className = "",
  fading = false,
  label = "Loading Sawy Academy",
}: LoadingScreenProps) {
  return (
    <div
      className={`fixed inset-x-0 top-0 z-[300] flex h-[var(--app-height)] items-center justify-center bg-concrete transition-opacity duration-600 motion-reduce:transition-none ${
        fading ? "pointer-events-none opacity-0" : "opacity-100"
      } ${className}`}
      aria-live="polite"
      aria-busy={!fading}
      aria-label={label}
    >
      <GeometricLattice opacity={0.14} />

      <div className="relative z-10 flex flex-col items-center gap-10 px-6">
        <svg
          viewBox="0 0 120 120"
          className="loader-star h-24 w-24"
          aria-hidden="true"
        >
          <polygon
            className="loader-star-stroke"
            points="60,8 68,32 92,32 74,48 80,72 60,58 40,72 46,48 28,32 52,32"
            fill="none"
            stroke="#8b5a4a"
            strokeWidth="1"
          />
          <polygon
            className="loader-star-stroke loader-star-stroke-delay"
            points="60,20 66,38 84,38 70,50 74,68 60,58 46,68 50,50 36,38 54,38"
            fill="none"
            stroke="#1a1a1a"
            strokeWidth="0.6"
            opacity="0.5"
          />
          <circle
            className="loader-star-stroke loader-star-stroke-delay-2"
            cx="60"
            cy="60"
            r="8"
            fill="none"
            stroke="#8b5a4a"
            strokeWidth="0.6"
          />
        </svg>

        <div className="text-center">
          <p className="mb-2 font-sans text-sm font-medium uppercase tracking-[0.32em] text-charcoal">
            SAWY
          </p>
          <p className="mb-6 font-serif text-lg font-light text-charcoal-muted">
            Academy
          </p>
          <p className="label-caps loader-pulse text-clay">{label}</p>
        </div>

        <div className="pointer-events-none absolute inset-8" aria-hidden="true">
          <span className="absolute left-0 top-0 h-6 w-6 border-l border-t border-charcoal/40" />
          <span className="absolute right-0 top-0 h-6 w-6 border-r border-t border-charcoal/40" />
          <span className="absolute bottom-0 left-0 h-6 w-6 border-b border-l border-charcoal/40" />
          <span className="absolute bottom-0 right-0 h-6 w-6 border-b border-r border-charcoal/40" />
        </div>
      </div>
    </div>
  );
}
