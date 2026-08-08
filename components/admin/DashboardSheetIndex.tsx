import Link from "next/link";
import { ScaleBar } from "@/components/decorative/ScaleBar";
import type { DashboardMetric } from "@/lib/api/types";

interface DashboardSheetIndexProps {
  metrics: DashboardMetric[];
}

export function DashboardSheetIndex({ metrics }: DashboardSheetIndexProps) {
  return (
    <div className="hairline-border bg-concrete p-4 sm:p-6 lg:p-8">
      <ScaleBar scale="1:100" className="mb-4 max-w-[100px] sm:mb-6 sm:max-w-[120px]" />
      <p className="eyebrow mb-4 sm:mb-6 text-charcoal-infill">
        Select an area — {String(metrics.length).padStart(2, "0")} available
      </p>
      <ul>
        {metrics.map((metric, index) => (
          <li key={metric.id}>
            <Link
              href={metric.href}
              className={`group grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-1 px-2 py-4 transition-colors duration-200 hover:bg-concrete-dark/50 focus-visible:bg-concrete-dark/50 sm:grid-cols-12 sm:gap-4 sm:px-3 sm:py-5 ${
                index > 0 ? "hairline-t" : ""
              }`}
            >
              <span className="font-sans text-sm uppercase tracking-[0.16em] tabular-nums text-clay sm:col-span-1 sm:text-base">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="justify-self-end font-sans text-sm tabular-nums text-charcoal sm:col-span-2 sm:col-start-11 sm:row-start-1 sm:justify-self-end sm:text-base md:col-start-11">
                {metric.value} <span className="sr-only">items</span>
              </span>
              <span className="type-title text-base leading-snug text-charcoal group-hover:text-clay sm:col-span-9 sm:col-start-2 sm:row-start-1 sm:text-lg">
                {metric.label} <span aria-hidden="true" className="ml-1">→</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
