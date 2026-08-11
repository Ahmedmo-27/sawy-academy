import type { BrandingSettings, NavLinkItem, SiteSettings } from "@/lib/api/types";

export const FAQ_FOOTER_LINK: NavLinkItem = {
  id: "faqs",
  label: "FAQs",
  href: "/faqs",
};

function isFaqLink(link: NavLinkItem) {
  return link.href === "/faqs" || link.id === "faqs";
}

/** Keep FAQs out of the public navbar even if stored menus still include it. */
export function withoutFaqNavLink(items: NavLinkItem[] = []): NavLinkItem[] {
  return items.filter((item) => !isFaqLink(item));
}

/** Keep FAQs visible in the public footer even if stored menus predate the page. */
export function withFaqFooterLink(links: NavLinkItem[] = []): NavLinkItem[] {
  if (links.some(isFaqLink)) {
    return links;
  }

  const contactIndex = links.findIndex(
    (link) => link.href === "/contact" || link.id === "contact"
  );
  if (contactIndex === -1) return [...links, FAQ_FOOTER_LINK];
  return [
    ...links.slice(0, contactIndex),
    FAQ_FOOTER_LINK,
    ...links.slice(contactIndex),
  ];
}

/** Static fallback when the CMS API is unreachable. */
export const DEFAULT_BRAND: BrandingSettings = {
  name: "Sawy Academy",
  wordmark: "SAWY",
  wordmarkSuffix: "Academy",
  professor: "Mohamed El Sawy",
  professorTitle: "Prof. Mohamed El Sawy",
  role: "Vice Dean, Faculty of Engineering",
  institution: "Misr International University (MIU)",
  affiliation:
    "Vice Dean of the Faculty of Engineering at Misr International University (MIU)",
  tagline: "Architecture · Education · Research",
  email: "info@sawyacademy.eg",
  phone: "+20 2 2735 4820",
  mobile: "+20 10 2345 6789",
  address: {
    line1: "12 Hassan Sabry Street",
    line2: "Zamalek, Cairo",
    governorate: "Cairo Governorate",
    country: "Egypt",
    postal: "11211",
  },
  officeHours: "Sun – Thu, 10:00 – 17:00\nBy appointment only",
  established: "Est. 2012",
  footerBlurb: "Architecture & Spatial Design",
  logoUrl: "",
  facebookUrl: "#facebook",
  instagramUrl: "#instagram",
};

/** @deprecated Prefer useSiteSettings().branding — kept for static/SSR fallbacks */
export const BRAND = DEFAULT_BRAND;

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  key: "default",
  branding: DEFAULT_BRAND,
  seo: {
    title: "Sawy Academy — Mohamed El Sawy",
    description:
      "Architecture portfolio, academic courses, and studio resources by Prof. Mohamed El Sawy, Cairo.",
    ogImageUrl: "",
  },
  navigation: {
    items: [
      {
        id: "practice",
        label: "Practice",
        href: "",
        children: [
          { id: "portfolio", label: "Portfolio", href: "/portfolio" },
          { id: "researches", label: "Researches", href: "/researches" },
        ],
      },
      { id: "courses", label: "Courses", href: "/courses" },
      { id: "products", label: "Products", href: "/products" },
      { id: "services", label: "Services", href: "/services" },
      { id: "contact", label: "Contact", href: "/contact" },
    ],
  },
  footer: {
    links: [
      { id: "portfolio", label: "Portfolio", href: "/portfolio" },
      { id: "researches", label: "Researches", href: "/researches" },
      { id: "courses", label: "Courses", href: "/courses" },
      { id: "products", label: "Products", href: "/products" },
      { id: "faqs", label: "FAQs", href: "/faqs" },
      { id: "contact", label: "Contact", href: "/contact" },
      { id: "privacy", label: "Privacy Policy", href: "/privacy" },
    ],
  },
  pageHeaders: {
    portfolio: {
      eyebrow: "Work",
      title: "Portfolio",
      description:
        "Built work, interiors, furniture, and competition entries spanning fifteen years of practice and research.",
    },
    courses: {
      eyebrow: "Education",
      title: "Courses",
      description:
        "Two programme types — a multi-course Architecture Diploma and the leveled Biogeometry course.",
    },
    products: {
      eyebrow: "Studio Shop",
      title: "All Products",
      description:
        "Curated tools, software, and references recommended for architectural practice and study.",
    },
    researches: {
      eyebrow: "Scholarship",
      title: "Researches",
      description:
        "Published papers, conference proceedings, and ongoing investigations by Mohamed El Sawy.",
    },
    services: {
      eyebrow: "Practice",
      title: "Services",
      description:
        "Commission design work or propose research collaboration — each request opens as a new project sheet.",
    },
    faqs: {
      eyebrow: "Guidance",
      title: "FAQs",
      description:
        "Practical answers on enrolment, payments, course access, and visiting the Cairo studio.",
    },
    contact: {
      eyebrow: "Inquiry",
      title: "Contact",
      description:
        "For commissions, academic collaboration, or studio visits in Cairo.",
    },
    cart: {
      eyebrow: "Studio Cart",
      title: "Cart",
      description:
        "Review line items before submitting payment for verification.",
    },
    checkout: {
      eyebrow: "Settlement",
      title: "Checkout",
      description:
        "Confirm the order total and upload InstaPay proof for studio verification.",
    },
    login: {
      eyebrow: "Access",
      title: "Sign in",
      description:
        "Enter the studio register with your academy credentials.",
    },
    signup: {
      eyebrow: "Access",
      title: "Join the studio",
      description:
        "Create a student account to enroll, order materials, and follow studio work.",
    },
    privacy: {
      eyebrow: "Studio Notice",
      title: "Privacy Policy",
      description:
        "How Sawy Academy collects, uses, and protects the information you share with the studio.",
    },
  },
  contactPage: {
    intro:
      "Whether you are seeking design consultation, research partnership, or wish to discuss enrollment at Sawy Academy — I welcome thoughtful correspondence.",
    imageUrl: "",
  },
  sharedAssetUrls: [],
  servicesPage: {
    designImageUrl: "",
    researchImageUrl: "",
    processBriefImageUrl: "",
    processReviewImageUrl: "",
    processDeliveryImageUrl: "",
  },
};
