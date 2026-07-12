import { GUTTER, SITE_MAX } from "@/lib/grid";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "header" | "article";
}

export function PageContainer({
  children,
  className = "",
  as: Tag = "div",
}: PageContainerProps) {
  return (
    <Tag className={`mx-auto w-full min-w-0 max-w-full ${SITE_MAX} ${GUTTER} ${className}`}>
      {children}
    </Tag>
  );
}
