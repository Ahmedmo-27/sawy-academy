"use client";

import Link from "next/link";
import { Wordmark } from "@/components/Wordmark";
import { ScaleBar } from "@/components/decorative/ScaleBar";
import { ThresholdDoorway } from "@/components/layout/ThresholdDoorway";
import { PageContainer } from "@/components/layout/PageContainer";
import { useSiteSettings } from "@/components/cms/SiteContentProvider";

export function Footer() {
  const { branding, settings } = useSiteSettings();
  const footerLinks = settings.footer?.links ?? [];

  return (
    <footer className="mt-auto relative z-10">
      <ThresholdDoorway label="SITE FOOTER" />

      <div className="section-intimate">
        <PageContainer>
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-10">
            <div>
              <Wordmark linked={false} size="sm" />
              <ScaleBar scale="1:200" className="mt-6 mb-4 max-w-[100px]" />
              <p className="type-title mb-2">{branding.professorTitle}</p>
              <p className="type-infill leading-relaxed max-w-xs">
                {branding.address.line2}
                <br />
                {branding.address.country}
                <br />
                {branding.footerBlurb || "Architecture & Spatial Design"}
              </p>
            </div>

            <nav aria-label="Footer">
              <ul className="flex flex-wrap gap-x-8 gap-y-3">
                {footerLinks.map((link) => (
                  <li key={link.id || link.href}>
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
              © {new Date().getFullYear()} {branding.name}
            </p>
            <p className="label-caps text-charcoal-infill">
              {branding.professor} · {branding.address.country}
            </p>
          </div>
        </PageContainer>
      </div>
    </footer>
  );
}
