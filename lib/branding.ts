import type { BrandingSettings, SiteSettings } from "@/lib/api/types";

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
      { id: "contact", label: "Contact", href: "/contact" },
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
      title: "Login",
      description:
        "Sign in to the studio register with your academy credentials.",
    },
    signup: {
      eyebrow: "Access",
      title: "Sign Up",
      description:
        "Create a student account to enroll, order materials, and follow studio work.",
    },
  },
  contactPage: {
    intro:
      "Whether you are seeking design consultation, research partnership, or wish to discuss enrollment at Sawy Academy — I welcome thoughtful correspondence.",
  },
};
