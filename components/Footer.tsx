"use client";

import Link from "next/link";
import { Wordmark } from "@/components/Wordmark";
import { ScaleBar } from "@/components/decorative/ScaleBar";
import { ThresholdDoorway } from "@/components/layout/ThresholdDoorway";
import { PageContainer } from "@/components/layout/PageContainer";
import { useSiteSettings } from "@/components/cms/SiteContentProvider";
import { SocialLinks } from "@/components/SocialLinks";
import { withFaqFooterLink } from "@/lib/branding";

export function Footer() {
  const { branding, settings } = useSiteSettings();
  const footerLinks = withFaqFooterLink(settings.footer?.links ?? []);

  return (
    <footer className="mt-auto relative z-10">
      <ThresholdDoorway label="SITE FOOTER" />

      <div className="site-footer-contrast section-intimate">
        <PageContainer>
          <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between">
            <div className="shrink-0">
              <Wordmark linked={false} size="sm" tone="light" />
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

            <nav aria-label="Footer" className="min-w-0 w-full max-w-full lg:max-w-[min(100%,42rem)] lg:pt-1 lg:w-auto">
              <ul className="flex max-w-full flex-wrap items-center justify-start gap-x-4 gap-y-3 sm:gap-x-5 lg:justify-end lg:gap-x-6">
                {footerLinks.map((link) => (
                  <li key={link.id || link.href} className="shrink-0">
                    <Link href={link.href} className="action-secondary whitespace-nowrap">
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
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              <SocialLinks branding={branding} tone="on-dark" />
              <Link href="/privacy" className="action-secondary">
                Privacy Policy
              </Link>
              <p className="label-caps text-charcoal-infill">
                {branding.professor} · {branding.address.country}
              </p>
            </div>
          </div>
        </PageContainer>
      </div>
    </footer>
  );
}
