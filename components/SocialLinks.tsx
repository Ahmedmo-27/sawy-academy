import type { BrandingSettings } from "@/lib/api/types";

type SocialTone = "on-light" | "on-dark";
type SocialVariant = "icons" | "rows";

const PLACEHOLDER = {
  facebook: "#facebook",
  instagram: "#instagram",
} as const;

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      fill="none"
    >
      <path
        d="M14 9h3V6h-3c-2.2 0-4 1.8-4 4v2H8v3h2v7h3v-7h2.6l.4-3H13v-2c0-.6.4-1 1-1Z"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      fill="none"
    >
      <rect
        x="4.5"
        y="4.5"
        width="15"
        height="15"
        rx="4"
        stroke="currentColor"
        strokeWidth="1.25"
      />
      <circle cx="12" cy="12" r="3.25" stroke="currentColor" strokeWidth="1.25" />
      <circle cx="16.4" cy="7.6" r="0.7" fill="currentColor" />
    </svg>
  );
}

function socialItems(branding: Pick<BrandingSettings, "facebookUrl" | "instagramUrl">) {
  return [
    {
      id: "facebook",
      label: "Facebook",
      href: branding.facebookUrl || PLACEHOLDER.facebook,
      Icon: FacebookIcon,
    },
    {
      id: "instagram",
      label: "Instagram",
      href: branding.instagramUrl || PLACEHOLDER.instagram,
      Icon: InstagramIcon,
    },
  ];
}

export function SocialLinks({
  branding,
  tone = "on-light",
  variant = "icons",
  className = "",
}: {
  branding: Pick<BrandingSettings, "facebookUrl" | "instagramUrl">;
  tone?: SocialTone;
  variant?: SocialVariant;
  className?: string;
}) {
  const items = socialItems(branding);
  const isDark = tone === "on-dark";

  if (variant === "rows") {
    return (
      <nav aria-label="Social media" className={className}>
        <ul className="space-y-4">
          {items.map(({ id, label, href, Icon }) => (
            <li key={id}>
              <a
                href={href}
                className="flex items-center justify-between border-b border-hairline pb-3 text-sm text-charcoal transition-colors hover:text-clay"
              >
                <span className="flex items-center gap-3">
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </span>
                <svg
                  aria-hidden="true"
                  viewBox="0 0 20 20"
                  className="h-4 w-4 shrink-0"
                  fill="none"
                >
                  <path
                    d="M5 15 15 5M7 5h8v8"
                    stroke="currentColor"
                    strokeWidth="1.25"
                  />
                </svg>
              </a>
            </li>
          ))}
        </ul>
      </nav>
    );
  }

  return (
    <nav aria-label="Social media" className={className}>
      <ul className="flex items-center gap-2">
        {items.map(({ id, label, href, Icon }) => (
          <li key={id}>
            <a
              href={href}
              aria-label={label}
              className={`inline-flex h-10 w-10 items-center justify-center border transition-colors duration-200 ${
                isDark
                  ? "border-concrete/20 text-concrete hover:border-clay hover:text-clay"
                  : "border-hairline text-charcoal hover:border-clay hover:text-clay"
              }`}
            >
              <Icon className="h-4 w-4" />
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
