"use client";

import { useEffect, useState } from "react";

export const PROFILE_SECTIONS = [
  { id: "identity", label: "Identity" },
  { id: "enrollments", label: "Enrollments" },
  { id: "orders", label: "Orders" },
  { id: "services", label: "Services" },
  { id: "devices", label: "Devices" },
  { id: "account", label: "Account" },
] as const;

export type ProfileSectionId = (typeof PROFILE_SECTIONS)[number]["id"];

interface ProfileSheetNavProps {
  orientation?: "vertical" | "horizontal";
  className?: string;
}

export function ProfileSheetNav({
  orientation = "vertical",
  className = "",
}: ProfileSheetNavProps) {
  const [activeId, setActiveId] = useState<ProfileSectionId>("identity");

  useEffect(() => {
    const elements = PROFILE_SECTIONS.map((section) =>
      document.getElementById(section.id)
    ).filter((node): node is HTMLElement => Boolean(node));

    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (a, b) =>
              a.boundingClientRect.top - b.boundingClientRect.top
          );

        const next = visible[0]?.target.id as ProfileSectionId | undefined;
        if (next) setActiveId(next);
      },
      {
        rootMargin: "-20% 0px -55% 0px",
        threshold: [0, 0.15, 0.4],
      }
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  if (orientation === "horizontal") {
    return (
      <nav
        aria-label="Profile sections"
        className={`-mx-2 overflow-x-auto ${className}`}
      >
        <ul className="flex min-w-max items-end gap-2 border-b border-hairline px-2">
          {PROFILE_SECTIONS.map((section) => {
            const isActive = activeId === section.id;
            return (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className={`relative block px-3 py-3 label-caps transition-colors duration-200 ${
                    isActive
                      ? "text-clay"
                      : "text-charcoal-infill hover:text-charcoal"
                  }`}
                  aria-current={isActive ? "true" : undefined}
                >
                  {section.label}
                  <span
                    aria-hidden="true"
                    className={`absolute inset-x-2 -bottom-px h-px transition-opacity duration-200 ${
                      isActive ? "bg-clay opacity-100" : "opacity-0"
                    }`}
                  />
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
    );
  }

  return (
    <nav aria-label="Profile sections" className={className}>
      <p className="label-caps mb-4 text-charcoal/30">Sheet index</p>
      <ol className="space-y-2">
        {PROFILE_SECTIONS.map((section, index) => {
          const isActive = activeId === section.id;
          return (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                className={`group flex items-baseline gap-3 py-2.5 transition-colors duration-200 ${
                  isActive
                    ? "text-clay"
                    : "text-charcoal-infill hover:text-charcoal"
                }`}
                aria-current={isActive ? "true" : undefined}
              >
                <span className="label-caps tabular-nums text-charcoal/25 group-hover:text-charcoal/40">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="type-infill">{section.label}</span>
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="ml-auto h-px w-6 bg-clay/60"
                  />
                )}
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
