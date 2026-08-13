import type { Course, Faq, Lesson, Product, Project, Research, User } from "@/lib/api/types";
import { asCourses } from "@/lib/api/courseGroups";
import type { CourseGroup } from "@/lib/api/types";

export type AdminCommandCategory =
  | "Pages"
  | "Actions"
  | "Courses"
  | "Lessons"
  | "Products"
  | "Portfolio"
  | "Research"
  | "FAQs"
  | "Groups"
  | "Users";

export interface AdminCommandItem {
  id: string;
  href: string;
  label: string;
  description: string;
  category: AdminCommandCategory;
  keywords?: string[];
}

export interface AdminNavSeed {
  href: string;
  label: string;
  description: string;
}

function lessonKey(lesson: Lesson) {
  return lesson._id ?? lesson.id;
}

function normalize(value: string) {
  return value.trim().toLocaleLowerCase();
}

function tokens(query: string) {
  return normalize(query).split(/\s+/).filter(Boolean);
}

/** Static pages + task shortcuts (update course, add lesson, etc.). */
export function getStaticAdminCommands(
  navItems: AdminNavSeed[]
): AdminCommandItem[] {
  const pages: AdminCommandItem[] = navItems.map((item) => ({
    id: `page:${item.href}`,
    href: item.href,
    label: item.label,
    description: item.description,
    category: "Pages",
    keywords: [item.label, item.description, item.href.replace(/^\/admin\/?/, "")],
  }));

  const actions: AdminCommandItem[] = [
    {
      id: "action:add-course",
      href: "/admin/courses/new",
      label: "Add a course",
      description: "Create course details, pricing and media",
      category: "Actions",
      keywords: ["create course", "new course", "add course"],
    },
    {
      id: "action:update-course",
      href: "/admin/courses",
      label: "Update a course",
      description: "Open the courses list to edit a course",
      category: "Actions",
      keywords: [
        "edit course",
        "update course",
        "change course",
        "manage courses",
        "course details",
        "lessons",
      ],
    },
    {
      id: "action:add-lesson",
      href: "/admin/courses",
      label: "Add or edit lessons",
      description: "Open a course, then manage its lessons",
      category: "Actions",
      keywords: [
        "add lesson",
        "update lesson",
        "edit lesson",
        "create lesson",
        "manage lessons",
        "lesson video",
      ],
    },
    {
      id: "action:add-course-group",
      href: "/admin/course-groups/new",
      label: "Add a course group",
      description: "Create a diploma or leveled programme",
      category: "Actions",
      keywords: ["create group", "new group", "programme", "diploma"],
    },
    {
      id: "action:update-course-group",
      href: "/admin/course-groups",
      label: "Update a course group",
      description: "Edit programme groups and course membership",
      category: "Actions",
      keywords: ["edit group", "update group", "manage groups"],
    },
    {
      id: "action:add-product",
      href: "/admin/products/new",
      label: "Add a product",
      description: "Create a shop product",
      category: "Actions",
      keywords: ["create product", "new product", "shop"],
    },
    {
      id: "action:update-product",
      href: "/admin/products",
      label: "Update a product",
      description: "Open products to edit pricing or media",
      category: "Actions",
      keywords: ["edit product", "update product", "change product"],
    },
    {
      id: "action:add-portfolio",
      href: "/admin/portfolio/new",
      label: "Add portfolio work",
      description: "Publish a new project",
      category: "Actions",
      keywords: ["create portfolio", "new project", "add project"],
    },
    {
      id: "action:update-portfolio",
      href: "/admin/portfolio",
      label: "Update portfolio work",
      description: "Edit published projects",
      category: "Actions",
      keywords: ["edit portfolio", "update project", "edit project"],
    },
    {
      id: "action:add-research",
      href: "/admin/research/new",
      label: "Add research",
      description: "Publish an article or publication",
      category: "Actions",
      keywords: ["create research", "new research", "publication"],
    },
    {
      id: "action:update-research",
      href: "/admin/research",
      label: "Update research",
      description: "Edit articles and publications",
      category: "Actions",
      keywords: ["edit research", "update research"],
    },
    {
      id: "action:add-faq",
      href: "/admin/faqs/new",
      label: "Add an FAQ",
      description: "Create a public question and answer",
      category: "Actions",
      keywords: ["create faq", "new faq", "question"],
    },
    {
      id: "action:update-faq",
      href: "/admin/faqs",
      label: "Update FAQs",
      description: "Edit questions and answers",
      category: "Actions",
      keywords: ["edit faq", "update faq"],
    },
    {
      id: "action:update-homepage",
      href: "/admin/homepage",
      label: "Update homepage",
      description: "Arrange and edit homepage sections",
      category: "Actions",
      keywords: ["edit homepage", "home page", "sections", "builder"],
    },
    {
      id: "action:site-settings",
      href: "/admin/settings",
      label: "Update site settings",
      description: "Brand, InstaPay, navigation and pages",
      category: "Actions",
      keywords: [
        "settings",
        "branding",
        "instapay",
        "navigation",
        "logo",
        "contact",
      ],
    },
    {
      id: "action:review-orders",
      href: "/admin/orders",
      label: "Review orders",
      description: "Check payments waiting for action",
      category: "Actions",
      keywords: ["orders", "payments", "checkout", "approve order"],
    },
    {
      id: "action:service-requests",
      href: "/admin/services",
      label: "Review service requests",
      description: "Manage client enquiries",
      category: "Actions",
      keywords: ["services", "enquiries", "requests"],
    },
    {
      id: "action:video-alerts",
      href: "/admin/video-access-flags",
      label: "Review video access alerts",
      description: "Check unusual viewing activity",
      category: "Actions",
      keywords: ["video flags", "access alerts", "security"],
    },
    {
      id: "action:add-user",
      href: "/admin/users/new",
      label: "Add a user",
      description: "Create an account",
      category: "Actions",
      keywords: ["create user", "new user", "account"],
    },
    {
      id: "action:manage-users",
      href: "/admin/users",
      label: "Manage users",
      description: "Accounts and registered devices",
      category: "Actions",
      keywords: ["edit user", "update user", "devices"],
    },
  ];

  return [...pages, ...actions];
}

export function buildCourseCommands(courses: Course[]): AdminCommandItem[] {
  const items: AdminCommandItem[] = [];

  for (const course of courses) {
    const editHref = `/admin/courses/${course.slug}/edit`;
    items.push({
      id: `course:${course.slug}`,
      href: editHref,
      label: course.title,
      description: `Course · ${course.level || course.slug}`,
      category: "Courses",
      keywords: [
        course.title,
        course.slug,
        course.id,
        course.level,
        course.instructor,
        "update course",
        "edit course",
      ].filter(Boolean) as string[],
    });

    for (const lesson of course.lessons ?? []) {
      const key = lessonKey(lesson);
      if (!key) continue;
      items.push({
        id: `lesson:${course.slug}:${key}`,
        href: `${editHref}?lesson=${encodeURIComponent(key)}#lessons`,
        label: lesson.title,
        description: `Lesson in ${course.title}`,
        category: "Lessons",
        keywords: [
          lesson.title,
          lesson.slug,
          lesson.id,
          lesson.sheetRef,
          course.title,
          course.slug,
          "update lesson",
          "edit lesson",
        ].filter(Boolean) as string[],
      });
    }
  }

  return items;
}

export function buildProductCommands(products: Product[]): AdminCommandItem[] {
  return products.map((product) => ({
    id: `product:${product.id}`,
    href: `/admin/products/${product.id}/edit`,
    label: product.name,
    description: `Product · ${product.category || product.id}`,
    category: "Products" as const,
    keywords: [product.name, product.id, product.category, "update product", "edit product"].filter(
      Boolean
    ) as string[],
  }));
}

export function buildPortfolioCommands(projects: Project[]): AdminCommandItem[] {
  return projects.map((project) => ({
    id: `portfolio:${project.slug ?? project.id}`,
    href: `/admin/portfolio/${project.slug ?? project.id}/edit`,
    label: project.title,
    description: `Portfolio · ${project.category || project.year || ""}`,
    category: "Portfolio" as const,
    keywords: [
      project.title,
      project.slug,
      project.id,
      project.category,
      "update portfolio",
      "edit project",
    ].filter(Boolean) as string[],
  }));
}

export function buildResearchCommands(items: Research[]): AdminCommandItem[] {
  return items.map((item) => ({
    id: `research:${item.slug ?? item.id}`,
    href: `/admin/research/${item.slug ?? item.id}/edit`,
    label: item.title,
    description: `Research · ${item.year || item.category || ""}`,
    category: "Research" as const,
    keywords: [
      item.title,
      item.slug,
      item.id,
      item.venue,
      item.category,
      "update research",
      "edit research",
    ].filter(Boolean) as string[],
  }));
}

export function buildFaqCommands(faqs: Faq[]): AdminCommandItem[] {
  return faqs.map((faq) => {
    const key = faq.id || faq._id;
    return {
      id: `faq:${key}`,
      href: `/admin/faqs/${key}/edit`,
      label: faq.question,
      description: `FAQ · ${faq.category || "General"}`,
      category: "FAQs" as const,
      keywords: [faq.question, faq.category, "update faq", "edit faq"].filter(
        Boolean
      ) as string[],
    };
  });
}

export function buildCourseGroupCommands(
  groups: CourseGroup[]
): AdminCommandItem[] {
  return groups.map((group) => {
    const key = group._id ?? group.id;
    const courseTitles = asCourses(group)
      .map((course) => course.title)
      .join(" ");
    return {
      id: `group:${key}`,
      href: `/admin/course-groups/${key}/edit`,
      label: group.title,
      description: `Group · ${group.type}`,
      category: "Groups" as const,
      keywords: [
        group.title,
        group.subtitle,
        group.type,
        courseTitles,
        "update group",
        "edit group",
        "diploma",
      ].filter(Boolean) as string[],
    };
  });
}

export function buildUserCommands(users: User[]): AdminCommandItem[] {
  return users.map((user) => {
    const key = user._id ?? user.id;
    return {
      id: `user:${key}`,
      href: `/admin/users/${key}/edit`,
      label: user.name,
      description: `User · ${user.email}`,
      category: "Users" as const,
      keywords: [user.name, user.email, user.role, "update user", "edit user"].filter(
        Boolean
      ) as string[],
    };
  });
}

function haystack(item: AdminCommandItem) {
  return normalize(
    [item.label, item.description, item.category, ...(item.keywords ?? [])].join(
      " "
    )
  );
}

function scoreItem(item: AdminCommandItem, queryTokens: string[]) {
  if (queryTokens.length === 0) {
    const order: AdminCommandCategory[] = [
      "Actions",
      "Pages",
      "Courses",
      "Lessons",
      "Groups",
      "Products",
      "Portfolio",
      "Research",
      "FAQs",
      "Users",
    ];
    return 1000 - order.indexOf(item.category) * 10;
  }

  const label = normalize(item.label);
  const text = haystack(item);
  let score = 0;

  for (const token of queryTokens) {
    if (label === token) score += 120;
    else if (label.startsWith(token)) score += 80;
    else if (label.includes(token)) score += 50;
    else if (text.includes(token)) score += 20;
    else return -1;
  }

  if (item.category === "Actions") score += 8;
  if (item.category === "Pages") score += 4;
  if (item.category === "Courses" || item.category === "Lessons") score += 6;

  return score;
}

export function filterAdminCommands(
  items: AdminCommandItem[],
  query: string,
  limit = 40
): AdminCommandItem[] {
  const queryTokens = tokens(query);
  return items
    .map((item) => ({ item, score: scoreItem(item, queryTokens) }))
    .filter((entry) => entry.score >= 0)
    .sort((a, b) => b.score - a.score || a.item.label.localeCompare(b.item.label))
    .slice(0, limit)
    .map((entry) => entry.item);
}
