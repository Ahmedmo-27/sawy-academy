import Link from "next/link";
import { BRAND } from "@/lib/branding";
import { Wordmark } from "@/components/Wordmark";
import { ScaleBar } from "@/components/decorative/ScaleBar";
import { ThresholdDoorway } from "@/components/layout/ThresholdDoorway";
import { PageContainer } from "@/components/layout/PageContainer";

const footerLinks = [
  { href: "/portfolio", label: "Portfolio" },
  { href: "/researches", label: "Researches" },
  { href: "/courses", label: "Courses" },
  { href: "/products", label: "Products" },
  { href: "/services", label: "Services" },
  { href: "/contact", label: "Contact" },
];

export function Footer() {
  return (
    <footer className="mt-auto relative z-10">
      <ThresholdDoorway label="SITE FOOTER" />

      <div className="section-intimate">
        <PageContainer>
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-10">
            <div>
              <Wordmark linked={false} size="sm" />
              <ScaleBar scale="1:200" className="mt-6 mb-4 max-w-[100px]" />
              <p className="type-title mb-2">{BRAND.professorTitle}</p>
              <p className="type-infill leading-relaxed max-w-xs">
                {BRAND.role}
                <br />
                {BRAND.institution}
                <br />
                {BRAND.address.line2}, {BRAND.address.country}
              </p>
            </div>

            <nav aria-label="Footer">
              <ul className="flex flex-wrap gap-x-8 gap-y-3">
                {footerLinks.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="action-secondary">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <div className="hairline-t mt-12 pt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <p className="label-caps">
              © {new Date().getFullYear()} {BRAND.name}
            </p>
            <p className="label-caps opacity-60">
              {BRAND.professor} · Cairo, Egypt
            </p>
          </div>
        </PageContainer>
      </div>
    </footer>
  );
}
