/** Defaults mirror the current hardcoded site content. */

const branding = {
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

const seo = {
  title: "Sawy Academy — Mohamed El Sawy",
  description:
    "Architecture portfolio, academic courses, and studio resources by Prof. Mohamed El Sawy, Cairo.",
};

const navigation = {
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
};

const footer = {
  links: [
    { id: "portfolio", label: "Portfolio", href: "/portfolio" },
    { id: "researches", label: "Researches", href: "/researches" },
    { id: "courses", label: "Courses", href: "/courses" },
    { id: "products", label: "Products", href: "/products" },
    { id: "contact", label: "Contact", href: "/contact" },
  ],
};

const pageHeaders = {
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
    description: "Review line items before submitting payment for verification.",
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
};

const contactPage = {
  intro:
    "Whether you are seeking design consultation, research partnership, or wish to discuss enrollment at Sawy Academy — I welcome thoughtful correspondence.",
};

const homeSections = [
  {
    id: "hero",
    type: "hero",
    enabled: true,
    order: 1,
    content: {
      tagline: branding.tagline,
      headline: "Designing spaces that teach us how to inhabit the world.",
      body: `${branding.professorTitle} — ${branding.role} at ${branding.institution}, and founder of ${branding.name}. Practice, pedagogy, and research in Cairo.`,
      primaryCtaLabel: "View portfolio",
      primaryCtaHref: "/portfolio",
      secondaryCtaLabel: "Browse courses",
      secondaryCtaHref: "/courses",
      heroImageUrl: "",
      floorPlanLabel: "Floor plan",
      jumpLinks: [
        { href: "#portfolio", label: "Portfolio" },
        { href: "#courses", label: "Courses" },
        { href: "#products", label: "Products" },
        { href: "#researches", label: "Research" },
        { href: "#contact", label: "Contact" },
      ],
    },
  },
  {
    id: "philosophy",
    type: "philosophy",
    enabled: true,
    order: 2,
    content: {
      roomLabel: "ROOM 01 — PHILOSOPHY",
      roomNumber: "01",
      quote:
        "Architecture is the thoughtful making of space. We teach proportion, material honesty, and the discipline of the grid.",
      attribution: branding.professor,
    },
  },
  {
    id: "portfolio",
    type: "portfolio",
    enabled: true,
    order: 3,
    content: {
      roomLabel: "ROOM 02 — PORTFOLIO",
      roomNumber: "02",
      eyebrow: "Work",
      title: "Portfolio",
      href: "/portfolio",
      linkLabel: "All projects",
      thresholdLabel: "Drawing set A — Featured",
      featuredLimit: 3,
    },
  },
  {
    id: "courses",
    type: "courses",
    enabled: true,
    order: 4,
    content: {
      roomLabel: "ROOM 03 — COURSES",
      roomNumber: "03",
      eyebrow: "Education",
      title: "Courses",
      href: "/courses",
      linkLabel: "Full curriculum",
      thresholdLabel: "Programme index",
      featuredLimit: 0,
    },
  },
  {
    id: "products",
    type: "products",
    enabled: true,
    order: 5,
    content: {
      roomLabel: "ROOM 04 — PRODUCTS",
      roomNumber: "04",
      eyebrow: "Studio shop",
      title: "Products",
      href: "/products",
      linkLabel: "Full catalogue",
      thresholdLabel: "Stock list — Featured",
      featuredLimit: 4,
    },
  },
  {
    id: "research",
    type: "research",
    enabled: true,
    order: 6,
    content: {
      roomLabel: "ROOM 05 — RESEARCH",
      roomNumber: "05",
      eyebrow: "Scholarship",
      title: "Research",
      href: "/researches",
      linkLabel: "All publications",
      thresholdLabel: "Bibliography — Recent",
      featuredLimit: 3,
    },
  },
  {
    id: "contact",
    type: "contact",
    enabled: true,
    order: 7,
    content: {
      roomLabel: "ROOM 06 — CONTACT",
      roomNumber: "06",
      eyebrow: "Correspondence",
      title: "Contact",
      href: "/contact",
      linkLabel: "Send a message",
      body: "Write for commissions, collaboration, studio visits, or course enrollment in Cairo.",
      ctaLabel: "Open contact form",
    },
  },
];

module.exports = {
  branding,
  seo,
  navigation,
  footer,
  pageHeaders,
  contactPage,
  homeSections,
};
