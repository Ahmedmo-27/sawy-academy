"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Reveal } from "@/components/Reveal";
import { ScaleBar } from "@/components/decorative/ScaleBar";
import { CmsPageHeader } from "@/components/cms/CmsPageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { ThresholdDoorway } from "@/components/layout/ThresholdDoorway";
import { ThresholdFrame } from "@/components/layout/ThresholdFrame";
import { useAuth } from "@/hooks/useAuth";
import { postAuthPath } from "@/lib/auth/postAuthPath";

interface AuthPageShellProps {
  mode: "login" | "signup";
  doorwayLabel: string;
  frameLabel: string;
  children: React.ReactNode;
}

const COPY = {
  login: {
    eyebrow: "Access",
    title: "Sign in",
    description:
      "Enter the studio register with your academy credentials.",
    asideEyebrow: "Studio threshold",
    asideTitle: "Welcome back",
    asideBody:
      "Continue enrollments, orders, and service briefs from your student sheet.",
  },
  signup: {
    eyebrow: "Access",
    title: "Join the studio",
    description:
      "Create a student account to enroll, order materials, and follow studio work.",
    asideEyebrow: "Enrollment",
    asideTitle: "Begin your register",
    asideBody:
      "A student account opens the drawing sets, product bay, and service briefs.",
  },
} as const;

/**
 * Shared composition for login / signup.
 * Redirects already-authenticated visitors to their post-auth destination.
 */
export function AuthPageShell({
  mode,
  doorwayLabel,
  frameLabel,
  children,
}: AuthPageShellProps) {
  const copy = COPY[mode];
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isLoading || !isAuthenticated) return;
    router.replace(postAuthPath(user));
  }, [isAuthenticated, isLoading, router, user]);

  return (
    <>
      <CmsPageHeader
        pageKey={mode}
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
      />

      <ThresholdDoorway label={doorwayLabel} />

      <section className="section-standard">
        <PageContainer>
          <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-14 xl:gap-16">
            <Reveal variant="infill" className="hidden lg:block">
              <aside className="sticky top-[calc(var(--nav-height)+2rem)]">
                <ThresholdFrame label="Academy note">
                  <div className="hairline-border mt-4 bg-concrete/80 p-8">
                    <ScaleBar scale="1:100" className="mb-6 max-w-[100px]" />
                    <p className="eyebrow text-clay mb-3">{copy.asideEyebrow}</p>
                    <p className="type-title font-serif text-2xl italic leading-tight">
                      {copy.asideTitle}
                    </p>
                    <p className="type-infill mt-4 max-w-sm leading-relaxed">
                      {copy.asideBody}
                    </p>
                  </div>
                </ThresholdFrame>
              </aside>
            </Reveal>

            <Reveal variant="infill">
              <div>
                <AuthModeSwitch active={mode} pathname={pathname} />
                <ThresholdFrame label={frameLabel} className="mt-6">
                  {children}
                </ThresholdFrame>
              </div>
            </Reveal>
          </div>
        </PageContainer>
      </section>
    </>
  );
}

function AuthModeSwitch({
  active,
  pathname,
}: {
  active: "login" | "signup";
  pathname: string | null;
}) {
  const modes = [
    { id: "login" as const, href: "/login", label: "Sign in" },
    { id: "signup" as const, href: "/signup", label: "Create account" },
  ];

  return (
    <nav aria-label="Account access" className="border-b border-hairline">
      <ul className="flex">
        {modes.map((mode) => {
          const isActive =
            active === mode.id || pathname === mode.href;
          return (
            <li key={mode.id} className="min-w-0 flex-1">
              <Link
                href={mode.href}
                className={`relative block px-3 py-3 text-center label-caps transition-colors duration-200 ${
                  isActive
                    ? "text-clay"
                    : "text-charcoal-infill hover:text-charcoal"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                {mode.label}
                <span
                  aria-hidden="true"
                  className={`absolute inset-x-4 -bottom-px h-px transition-opacity duration-200 ${
                    isActive ? "bg-clay opacity-100" : "opacity-0"
                  }`}
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
