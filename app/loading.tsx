import { GeometricLattice } from "@/components/decorative/GeometricLattice";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-concrete/95 nav-blur">
      <GeometricLattice opacity={0.1} />
      <div className="relative z-10 flex flex-col items-center gap-6">
        <svg
          viewBox="0 0 80 80"
          className="w-14 h-14 loader-star"
          aria-hidden="true"
        >
          <polygon
            className="loader-star-stroke"
            points="40,6 45,24 62,24 49,36 54,54 40,44 26,54 31,36 18,24 35,24"
            fill="none"
            stroke="var(--color-clay)"
            strokeWidth="1"
          />
        </svg>
        <p className="label-caps text-charcoal-muted loader-pulse">Loading</p>
      </div>
    </div>
  );
}
