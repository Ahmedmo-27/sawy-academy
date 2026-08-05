import { GeometricLattice } from "@/components/decorative/GeometricLattice";
import { ProcessProgressBar } from "@/components/feedback/ProcessProgressBar";

interface AdminLoaderProps {
  label?: string;
  stepLabel?: string;
  progress?: number;
}

export function AdminLoader({
  label = "Loading…",
  stepLabel,
  progress,
}: AdminLoaderProps) {
  return (
    <div className="relative min-h-[18rem] overflow-hidden hairline-border bg-concrete-dark/40">
      <GeometricLattice opacity={0.08} />
      <div className="relative z-10 flex min-h-[18rem] flex-col items-center justify-center gap-5 px-6">
        <svg
          viewBox="0 0 80 80"
          className="w-12 h-12 loader-star"
          aria-hidden="true"
        >
          <polygon
            className="loader-star-stroke"
            points="40,6 45,24 62,24 49,36 54,54 40,44 26,54 31,36 18,24 35,24"
            fill="none"
            stroke="#8b5a4a"
            strokeWidth="1"
          />
        </svg>
        <ProcessProgressBar
          label={label}
          stepLabel={stepLabel ?? label}
          progress={progress}
          className="text-center"
        />
      </div>
    </div>
  );
}
