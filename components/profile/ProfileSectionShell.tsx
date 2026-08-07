import { ThresholdFrame } from "@/components/layout/ThresholdFrame";

interface ProfileSectionShellProps {
  id: string;
  label: string;
  children: React.ReactNode;
  className?: string;
}

/** Anchored section wrapper with scroll margin for the sheet index. */
export function ProfileSectionShell({
  id,
  label,
  children,
  className = "",
}: ProfileSectionShellProps) {
  return (
    <section id={id} className={`scroll-mt-28 lg:scroll-mt-32 ${className}`}>
      <ThresholdFrame label={label} labelAsHeading>
        {children}
      </ThresholdFrame>
    </section>
  );
}
