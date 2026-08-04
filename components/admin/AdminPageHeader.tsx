import { ScaleBar } from "@/components/decorative/ScaleBar";

interface AdminPageHeaderProps {
  eyebrow: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  action,
}: AdminPageHeaderProps) {
  return (
    <header className="mb-6 flex flex-col gap-4 sm:mb-8 sm:gap-6 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        <ScaleBar scale="1:100" className="mb-3 max-w-[100px] sm:mb-4 sm:max-w-[120px]" />
        <p className="eyebrow mb-2 sm:mb-3">{eyebrow}</p>
        <h1 className="font-serif font-light text-charcoal text-[1.5rem] leading-tight tracking-[-0.01em] sm:text-[1.75rem] lg:text-[2rem]">
          {title}
        </h1>
        {description && (
          <p className="type-body mt-2 max-w-2xl sm:mt-3">{description}</p>
        )}
      </div>
      {action && (
        <div className="shrink-0 w-full sm:w-auto [&_.admin-btn]:w-full sm:[&_.admin-btn]:w-auto">
          {action}
        </div>
      )}
    </header>
  );
}
