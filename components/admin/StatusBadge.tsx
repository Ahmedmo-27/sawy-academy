interface StatusBadgeProps {
  status: string;
}

function getStatusClass(status: string) {
  const normalized = status.toLowerCase();

  if (normalized === "pending") {
    return "border-clay bg-clay/10 text-clay";
  }

  if (
    normalized === "verified" ||
    normalized === "accepted" ||
    normalized === "in review"
  ) {
    return "border-charcoal/30 bg-concrete-dark text-charcoal";
  }

  if (normalized === "rejected") {
    return "border-clay/50 bg-construction-muted/40 text-charcoal-infill";
  }

  return "border-hairline bg-concrete-dark/60 text-charcoal-infill";
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex min-h-8 items-center border px-3 py-1.5 label-caps ${getStatusClass(
        status
      )}`}
    >
      {status}
    </span>
  );
}
