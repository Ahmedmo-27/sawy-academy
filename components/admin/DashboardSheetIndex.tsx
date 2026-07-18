import Link from "next/link";
import { ScaleBar } from "@/components/decorative/ScaleBar";
import type { DashboardMetric } from "@/lib/api/types";

interface DashboardSheetIndexProps {
  metrics: DashboardMetric[];
}

export function DashboardSheetIndex({ metrics }: DashboardSheetIndexProps) {
  return (
    <div className="hairline-border bg-concrete p-4 sm:p-6 lg:p-10">
      <ScaleBar scale="1:100" className="mb-4 max-w-[100px] sm:mb-6 sm:max-w-[120px]" />
      <p className="eyebrow mb-4 sm:mb-6 text-charcoal-infill">
        Overview — {String(metrics.length).padStart(2, "0")} sections
      </p>
      <ul>
        {metrics.map((metric, index) => (
          <li key={metric.id}>
            <Link
              href={metric.href}
              className={`group grid grid-cols-[auto_auto_1fr] items-baseline gap-x-3 gap-y-1 py-4 transition-colors duration-200 hover:bg-concrete-dark/40 sm:grid-cols-12 sm:gap-4 sm:py-5 ${
                index > 0 ? "hairline-t" : ""
              }`}
            >
              <span className="font-sans text-sm uppercase tracking-[0.16em] tabular-nums text-clay sm:col-span-1 sm:text-base">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="font-sans text-sm uppercase tracking-[0.14em] tabular-nums text-clay sm:col-span-2 sm:text-base">
                {metric.sheetRef}
              </span>
              <span className="justify-self-end font-sans text-base tabular-nums text-charcoal sm:col-span-2 sm:col-start-11 sm:row-start-1 sm:justify-self-end sm:text-lg md:col-start-11">
                {metric.value}
              </span>
              <span className="col-span-3 type-title text-base leading-snug text-charcoal group-hover:text-charcoal sm:col-span-7 sm:col-start-4 sm:row-start-1 sm:text-lg md:text-xl">
                {metric.label}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
