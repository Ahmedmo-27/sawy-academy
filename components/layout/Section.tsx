import { PageContainer } from "./PageContainer";

type SectionRhythm = "atrium" | "standard" | "intimate" | "compressed";

const rhythmClass: Record<SectionRhythm, string> = {
  atrium: "section-atrium",
  standard: "section-standard",
  intimate: "section-intimate",
  compressed: "section-compressed",
};

interface SectionProps {
  children: React.ReactNode;
  rhythm?: SectionRhythm;
  className?: string;
  contained?: boolean;
  id?: string;
}

export function Section({
  children,
  rhythm = "standard",
  className = "",
  contained = true,
  id,
}: SectionProps) {
  const inner = contained ? (
    <PageContainer>{children}</PageContainer>
  ) : (
    children
  );

  return (
    <section id={id} className={`${rhythmClass[rhythm]} ${className}`}>
      {inner}
    </section>
  );
}
