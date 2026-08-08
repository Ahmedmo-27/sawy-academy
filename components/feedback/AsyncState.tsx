import Link from "next/link";

type AsyncStateKind = "empty" | "error";

interface AsyncStateProps {
  kind?: AsyncStateKind;
  eyebrow?: string;
  title: string;
  message: string;
  actionLabel?: string;
  actionHref?: string;
  onRetry?: () => void;
  className?: string;
}

export function AsyncState({
  kind = "empty",
  eyebrow,
  title,
  message,
  actionLabel,
  actionHref,
  onRetry,
  className = "",
}: AsyncStateProps) {
  const label = eyebrow ?? (kind === "error" ? "Unable to load" : "Nothing here yet");

  return (
    <section
      className={`hairline-border relative overflow-hidden bg-concrete-dark/30 p-6 sm:p-8 lg:p-10 ${className}`}
      aria-live={kind === "error" ? "assertive" : "polite"}
      role={kind === "error" ? "alert" : "status"}
    >
      <span className="absolute left-0 top-0 h-px w-16 bg-clay" aria-hidden="true" />
      <p className="eyebrow text-clay">{label}</p>
      <h2 className="type-title mt-3 font-serif font-light">{title}</h2>
      <p className="type-body mt-3 max-w-xl text-charcoal-muted">{message}</p>
      {(onRetry || (actionHref && actionLabel)) && (
        <div className="mt-7 flex flex-wrap gap-5">
          {onRetry && (
            <button type="button" className="action-primary min-h-11" onClick={onRetry}>
              Try again
            </button>
          )}
          {actionHref && actionLabel && (
            <Link href={actionHref} className="action-secondary inline-flex min-h-11 items-center">
              {actionLabel}
            </Link>
          )}
        </div>
      )}
    </section>
  );
}
