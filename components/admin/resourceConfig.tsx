import type { ReactNode } from "react";
import {
  assignCourseToGroup,
  createCourseGroup,
  deleteCourseGroup,
  findGroupForCourse,
  getCourseGroup,
  listCourseGroups,
  updateCourseGroup,
  type CourseGroupInput,
} from "@/lib/api/courseGroups";
import {
  createCourse,
  deleteCourse,
  getCourse,
  listCourses,
  updateCourse,
} from "@/lib/api/courses";
import {
  createProduct,
  deleteProduct,
  getProduct,
  listProducts,
  updateProduct,
  type ProductInput,
} from "@/lib/api/products";
import {
  createProject,
  deleteProject,
  getProject,
  listProjects,
  reorderProjects,
  updateProject,
  type ProjectInput,
} from "@/lib/api/portfolio";
import {
  createResearch,
  deleteResearch,
  getResearch,
  listResearch,
  updateResearch,
  type ResearchInput,
} from "@/lib/api/research";
import {
  createUser,
  deleteUser,
  getUser,
  listUsers,
  updateUser,
  type UserInput,
} from "@/lib/api/users";
import type { Course, CourseGroup } from "@/lib/api/types";
import { BRAND } from "@/lib/branding";

export type ResourceKind =
  | "courses"
  | "course-groups"
  | "products"
  | "portfolio"
  | "research"
  | "users";

export type ResourceRecord = Record<string, unknown>;
export type ResourceForm = Record<string, string>;

export interface ResourceField {
  name: string;
  label: string;
  type?: "text" | "email" | "number" | "select" | "textarea" | "upload" | "course-picker";
  required?: boolean;
  options?: Array<{ label: string; value: string }>;
  /** Load select options dynamically before rendering the form */
  optionsLoader?: () => Promise<Array<{ label: string; value: string }>>;
  hint?: string;
}

export interface ResourceConfig {
  kind: ResourceKind;
  title: string;
  eyebrow: string;
  description: string;
  listLabel: string;
  basePath: string;
  idParam: string;
  emptyForm: ResourceForm;
  fields: ResourceField[];
  list: () => Promise<ResourceRecord[]>;
  get: (key: string) => Promise<ResourceRecord>;
  create: (form: ResourceForm) => Promise<ResourceRecord>;
  update: (key: string, form: ResourceForm) => Promise<ResourceRecord>;
  remove: (key: string) => Promise<ResourceRecord>;
  getKey: (record: ResourceRecord) => string;
  getEditHref: (record: ResourceRecord) => string;
  toForm: (record: ResourceRecord) => ResourceForm;
  /** Persist a new list order. Keys match getKey() for each row. */
  reorder?: (orderedKeys: string[]) => Promise<void>;
  listColumns: Array<{
    key: string;
    header: string;
    value: (record: ResourceRecord) => ReactNode;
    sortValue?: (record: ResourceRecord) => string | number;
    className?: string;
  }>;
}

function asRecord<T extends object>(record: T) {
  return record as ResourceRecord;
}

function text(record: ResourceRecord, key: string) {
  return String(record[key] ?? "");
}

function productPayload(form: ResourceForm): ProductInput {
  return {
    id: form.id,
    name: form.name,
    description: form.description,
    price: form.price,
    category: form.category,
    image: form.image,
  };
}

function projectPayload(form: ResourceForm): ProjectInput {
  return {
    id: form.id,
    title: form.title,
    category: form.category as ProjectInput["category"],
    year: form.year,
    image: form.image,
    aspect: form.aspect ? (form.aspect as ProjectInput["aspect"]) : undefined,
  };
}

function researchPayload(form: ResourceForm): ResearchInput {
  return {
    id: form.id,
    title: form.title,
    year: form.year,
    category: form.category as ResearchInput["category"],
    venue: form.venue,
    abstract: form.abstract,
    collaborators: form.collaborators,
  };
}

function courseGroupPayload(form: ResourceForm): CourseGroupInput {
  return {
    title: form.title,
    subtitle: form.subtitle,
    type: form.type as CourseGroup["type"],
    bundlePrice: form.bundlePrice || undefined,
    courses: form.courseIds
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  };
}

function userPayload(form: ResourceForm): UserInput {
  return {
    id: form.id,
    name: form.name,
    email: form.email,
    role: form.role || "student",
  };
}

async function loadGroupOptions() {
  try {
    const groups = await listCourseGroups();
    return groups.map((group) => ({
      label: `${group.title} (${group.type})`,
      value: group._id ?? group.id ?? "",
    })).filter((option) => option.value);
  } catch {
    return [];
  }
}

async function enrichCoursesWithGroups(courses: Course[]) {
  let groups: CourseGroup[] = [];
  try {
    groups = await listCourseGroups();
  } catch {
    groups = [];
  }

  return courses.map((course) => {
    const group = findGroupForCourse(groups, course);
    return {
      ...course,
      groupId: group?._id ?? group?.id ?? "",
      groupTitle: group?.title ?? "Unassigned",
      groupType: group?.type,
    };
  });
}

async function saveCourseWithGroup(form: ResourceForm, slug?: string) {
  const payload = {
    id: form.id,
    title: form.title,
    description: form.description,
    level: form.level,
    instructor: BRAND.professorTitle,
    price: form.price,
    relatedProductIds: form.relatedProductIds
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  };

  const saved = slug
    ? await updateCourse(slug, payload)
    : await createCourse(payload);

  try {
    await assignCourseToGroup(
      saved._id ?? saved.id,
      form.groupId || undefined,
      saved._id
    );
  } catch {
    // Group write endpoints may not exist yet; course itself still saved.
  }

  const enriched = (await enrichCoursesWithGroups([saved]))[0];
  return enriched;
}

export const resourceConfigs: Record<ResourceKind, ResourceConfig> = {
  courses: {
    kind: "courses",
    title: "Courses",
    eyebrow: "Courses",
    description:
      "Add and edit courses. You can assign a programme group now, or leave it unassigned and set it later.",
    listLabel: "courses",
    basePath: "/admin/courses",
    idParam: "slug",
    emptyForm: {
      id: "",
      title: "",
      description: "",
      level: "",
      price: "",
      groupId: "",
      relatedProductIds: "",
    },
    fields: [
      { name: "id", label: "Course code", required: true, hint: "A short unique code, e.g. d1" },
      { name: "title", label: "Course name", required: true },
      {
        name: "groupId",
        label: "Programme group",
        type: "select",
        optionsLoader: loadGroupOptions,
        hint: "Optional. Leave blank if this course is not part of a diploma or track yet.",
      },
      {
        name: "description",
        label: "Description",
        type: "textarea",
        required: true,
      },
      { name: "level", label: "Level", required: true },
      {
        name: "price",
        label: "Price",
        required: true,
        hint: "Include currency, e.g. EGP 18,500",
      },
      {
        name: "relatedProductIds",
        label: "Related product codes",
        hint: "Optional. Separate multiple codes with commas.",
      },
    ],
    list: async () =>
      (await enrichCoursesWithGroups(await listCourses())).map(asRecord),
    get: async (key) => {
      const course = await getCourse(key);
      return asRecord((await enrichCoursesWithGroups([course]))[0]);
    },
    create: async (form) => asRecord(await saveCourseWithGroup(form)),
    update: async (key, form) =>
      asRecord(await saveCourseWithGroup(form, key)),
    remove: async (key) => asRecord(await deleteCourse(key)),
    getKey: (record) => text(record, "slug"),
    getEditHref: (record) => `/admin/courses/${text(record, "slug")}/edit`,
    toForm: (record) => {
      const course = record as unknown as Course;
      return {
        id: course.id ?? "",
        title: course.title ?? "",
        description: course.description ?? "",
        level: course.level ?? "",
        price: course.price ?? "",
        groupId: course.groupId ?? "",
        relatedProductIds: (course.relatedProductIds ?? [])
          .map((value) => (typeof value === "string" ? value : value.id))
          .join(", "),
      };
    },
    listColumns: [
      {
        key: "groupTitle",
        header: "Programme group",
        className: "min-w-[10rem]",
        value: (record) => (
          <span>
            <span className="block text-charcoal">{text(record, "groupTitle")}</span>
            {text(record, "groupType") && (
              <span className="label-caps mt-1 block text-clay">
                {text(record, "groupType")}
              </span>
            )}
          </span>
        ),
        sortValue: (record) => text(record, "groupTitle"),
      },
      {
        key: "title",
        header: "Course",
        value: (record) => text(record, "title"),
        sortValue: (record) => text(record, "title"),
      },
      {
        key: "level",
        header: "Level",
        value: (record) => text(record, "level"),
        sortValue: (record) => text(record, "level"),
      },
      {
        key: "price",
        header: "Price",
        value: (record) => text(record, "price"),
        sortValue: (record) => text(record, "price"),
      },
    ],
  },
  "course-groups": {
    kind: "course-groups",
    title: "Course Groups",
    eyebrow: "Programmes",
    description:
      "Programme groups (like a diploma) that contain several courses.",
    listLabel: "programme groups",
    basePath: "/admin/course-groups",
    idParam: "id",
    emptyForm: {
      title: "",
      subtitle: "",
      type: "",
      bundlePrice: "",
      courseIds: "",
    },
    fields: [
      { name: "title", label: "Group name", required: true },
      {
        name: "subtitle",
        label: "Short description",
        required: true,
      },
      {
        name: "type",
        label: "Type",
        type: "select",
        required: true,
        options: [
          { label: "Diploma", value: "diploma" },
          { label: "Leveled track", value: "leveled" },
        ],
      },
      {
        name: "bundlePrice",
        label: "Bundle price",
        hint: "Optional total price if students buy the whole group",
      },
      {
        name: "courseIds",
        label: "Courses in this group",
        type: "course-picker",
      },
    ],
    list: async () => (await listCourseGroups()).map(asRecord),
    get: async (key) => asRecord(await getCourseGroup(key)),
    create: async (form) =>
      asRecord(await createCourseGroup(courseGroupPayload(form))),
    update: async (key, form) =>
      asRecord(await updateCourseGroup(key, courseGroupPayload(form))),
    remove: async (key) => asRecord(await deleteCourseGroup(key)),
    getKey: (record) => {
      const id = text(record, "_id") || text(record, "id");
      return id;
    },
    getEditHref: (record) => {
      const id = text(record, "_id") || text(record, "id");
      return `/admin/course-groups/${encodeURIComponent(id)}/edit`;
    },
    toForm: (record) => {
      const group = record as unknown as CourseGroup;
      return {
        title: group.title ?? "",
        subtitle: group.subtitle ?? "",
        type: group.type ?? "",
        bundlePrice: group.bundlePrice ?? "",
        courseIds: (group.courses ?? [])
          .map((course) =>
            typeof course === "string" ? course : course._id ?? course.id
          )
          .filter(Boolean)
          .join(", "),
      };
    },
    listColumns: [
      {
        key: "title",
        header: "Group",
        value: (record) => text(record, "title"),
        sortValue: (record) => text(record, "title"),
      },
      {
        key: "type",
        header: "Type",
        value: (record) =>
          text(record, "type") === "diploma" ? "Diploma" : "Leveled track",
        sortValue: (record) => text(record, "type"),
      },
      {
        key: "courses",
        header: "Courses",
        value: (record) => {
          const courses = record.courses;
          const count = Array.isArray(courses) ? courses.length : 0;
          return count === 1 ? "1 course" : `${count} courses`;
        },
        sortValue: (record) =>
          Array.isArray(record.courses) ? record.courses.length : 0,
      },
      {
        key: "bundlePrice",
        header: "Bundle price",
        value: (record) => text(record, "bundlePrice") || "—",
        sortValue: (record) => text(record, "bundlePrice"),
      },
    ],
  },
  products: {
    kind: "products",
    title: "Products",
    eyebrow: "Shop items",
    description: "Products students can buy — tools, materials, and resources.",
    listLabel: "products",
    basePath: "/admin/products",
    idParam: "id",
    emptyForm: {
      id: "",
      name: "",
      description: "",
      price: "",
      category: "",
      image: "",
    },
    fields: [
      { name: "id", label: "ID", required: true },
      { name: "name", label: "Name", required: true },
      {
        name: "description",
        label: "Description",
        type: "textarea",
        required: true,
      },
      {
        name: "price",
        label: "Price",
        required: true,
        hint: "Include currency, e.g. EGP 42,000",
      },
      { name: "category", label: "Category", required: true },
      { name: "image", label: "Image", type: "upload", required: true },
    ],
    list: async () => (await listProducts()).map(asRecord),
    get: async (key) => asRecord(await getProduct(key)),
    create: async (form) => asRecord(await createProduct(productPayload(form))),
    update: async (key, form) =>
      asRecord(await updateProduct(key, productPayload(form))),
    remove: async (key) => asRecord(await deleteProduct(key)),
    getKey: (record) => text(record, "id"),
    getEditHref: (record) => `/admin/products/${text(record, "id")}/edit`,
    toForm: (record) => ({
      id: text(record, "id"),
      name: text(record, "name"),
      description: text(record, "description"),
      price: text(record, "price"),
      category: text(record, "category"),
      image: text(record, "image"),
    }),
    listColumns: [
      {
        key: "id",
        header: "ID",
        value: (record) => text(record, "id"),
        sortValue: (record) => text(record, "id"),
      },
      {
        key: "name",
        header: "Name",
        value: (record) => text(record, "name"),
        sortValue: (record) => text(record, "name"),
      },
      {
        key: "category",
        header: "Category",
        value: (record) => text(record, "category"),
        sortValue: (record) => text(record, "category"),
      },
      {
        key: "price",
        header: "Price",
        value: (record) => text(record, "price"),
        sortValue: (record) => text(record, "price"),
      },
    ],
  },
  portfolio: {
    kind: "portfolio",
    title: "Portfolio",
    eyebrow: "Projects",
    description:
      "Architecture projects shown on the public portfolio page. Drag the grip handle to change display order.",
    listLabel: "projects",
    basePath: "/admin/portfolio",
    idParam: "slug",
    emptyForm: {
      id: "",
      title: "",
      category: "",
      year: "",
      image: "",
      aspect: "",
    },
    fields: [
      { name: "id", label: "ID", required: true },
      { name: "title", label: "Title", required: true },
      {
        name: "category",
        label: "Category",
        type: "select",
        required: true,
        options: ["Buildings", "Interiors", "Furniture", "Competitions"].map(
          (value) => ({ label: value, value })
        ),
      },
      { name: "year", label: "Year", required: true },
      { name: "image", label: "Image", type: "upload", required: true },
      {
        name: "aspect",
        label: "Aspect",
        type: "select",
        options: ["tall", "wide", "square"].map((value) => ({
          label: value,
          value,
        })),
      },
    ],
    list: async () => {
      const projects = await listProjects();
      return projects.map((project, index) =>
        asRecord({
          ...project,
          order: project.order && project.order > 0 ? project.order : index + 1,
        })
      );
    },
    get: async (key) => asRecord(await getProject(key)),
    create: async (form) => asRecord(await createProject(projectPayload(form))),
    update: async (key, form) =>
      asRecord(await updateProject(key, projectPayload(form))),
    remove: async (key) => asRecord(await deleteProject(key)),
    reorder: async (orderedKeys) => {
      await reorderProjects(orderedKeys);
    },
    getKey: (record) => text(record, "slug"),
    getEditHref: (record) => `/admin/portfolio/${text(record, "slug")}/edit`,
    toForm: (record) => ({
      id: text(record, "id"),
      title: text(record, "title"),
      category: text(record, "category"),
      year: text(record, "year"),
      image: text(record, "image"),
      aspect: text(record, "aspect"),
    }),
    listColumns: [
      {
        key: "order",
        header: "#",
        className: "w-16",
        value: (record) =>
          String(Number(record.order) || 0).padStart(2, "0"),
        sortValue: (record) => Number(record.order) || 0,
      },
      {
        key: "sheetRef",
        header: "Sheet",
        value: (record) => text(record, "sheetRef"),
        sortValue: (record) => text(record, "sheetRef"),
      },
      {
        key: "title",
        header: "Title",
        value: (record) => text(record, "title"),
        sortValue: (record) => text(record, "title"),
      },
      {
        key: "category",
        header: "Category",
        value: (record) => text(record, "category"),
        sortValue: (record) => text(record, "category"),
      },
      {
        key: "year",
        header: "Year",
        value: (record) => text(record, "year"),
        sortValue: (record) => text(record, "year"),
      },
    ],
  },
  research: {
    kind: "research",
    title: "Research",
    eyebrow: "Research",
    description: "Published papers, conferences, books, and ongoing research.",
    listLabel: "research entries",
    basePath: "/admin/research",
    idParam: "slug",
    emptyForm: {
      id: "",
      title: "",
      year: "",
      category: "",
      venue: "",
      abstract: "",
      collaborators: "",
    },
    fields: [
      { name: "id", label: "ID", required: true },
      { name: "title", label: "Title", required: true },
      { name: "year", label: "Year", required: true },
      {
        name: "category",
        label: "Category",
        type: "select",
        required: true,
        options: ["Published", "Conference", "Ongoing", "Book"].map(
          (value) => ({ label: value, value })
        ),
      },
      { name: "venue", label: "Venue", required: true },
      {
        name: "abstract",
        label: "Abstract",
        type: "textarea",
        required: true,
      },
      { name: "collaborators", label: "Collaborators" },
    ],
    list: async () => (await listResearch()).map(asRecord),
    get: async (key) => asRecord(await getResearch(key)),
    create: async (form) =>
      asRecord(await createResearch(researchPayload(form))),
    update: async (key, form) =>
      asRecord(await updateResearch(key, researchPayload(form))),
    remove: async (key) => asRecord(await deleteResearch(key)),
    getKey: (record) => text(record, "slug"),
    getEditHref: (record) => `/admin/research/${text(record, "slug")}/edit`,
    toForm: (record) => ({
      id: text(record, "id"),
      title: text(record, "title"),
      year: text(record, "year"),
      category: text(record, "category"),
      venue: text(record, "venue"),
      abstract: text(record, "abstract"),
      collaborators: text(record, "collaborators"),
    }),
    listColumns: [
      {
        key: "title",
        header: "Title",
        value: (record) => text(record, "title"),
        sortValue: (record) => text(record, "title"),
      },
      {
        key: "category",
        header: "Category",
        value: (record) => text(record, "category"),
        sortValue: (record) => text(record, "category"),
      },
      {
        key: "venue",
        header: "Venue",
        value: (record) => text(record, "venue"),
        sortValue: (record) => text(record, "venue"),
      },
      {
        key: "year",
        header: "Year",
        value: (record) => text(record, "year"),
        sortValue: (record) => text(record, "year"),
      },
    ],
  },
  users: {
    kind: "users",
    title: "Users",
    eyebrow: "Students",
    description: "People who have registered on the site.",
    listLabel: "students",
    basePath: "/admin/users",
    idParam: "id",
    emptyForm: {
      id: "",
      name: "",
      email: "",
      role: "student",
    },
    fields: [
      { name: "id", label: "ID", required: true },
      { name: "name", label: "Name", required: true },
      { name: "email", label: "Email", type: "email", required: true },
      {
        name: "role",
        label: "Role",
        type: "select",
        required: true,
        options: [
          { label: "Student", value: "student" },
          { label: "Admin", value: "admin" },
        ],
      },
    ],
    list: async () => (await listUsers()).map(asRecord),
    get: async (key) => asRecord(await getUser(key)),
    create: async (form) => asRecord(await createUser(userPayload(form))),
    update: async (key, form) =>
      asRecord(await updateUser(key, userPayload(form))),
    remove: async (key) => asRecord(await deleteUser(key)),
    getKey: (record) => text(record, "_id") || text(record, "id"),
    getEditHref: (record) =>
      `/admin/users/${text(record, "_id") || text(record, "id")}/edit`,
    toForm: (record) => ({
      id: text(record, "id"),
      name: text(record, "name"),
      email: text(record, "email"),
      role: text(record, "role") || "student",
    }),
    listColumns: [
      {
        key: "name",
        header: "Name",
        value: (record) => text(record, "name"),
        sortValue: (record) => text(record, "name"),
      },
      {
        key: "email",
        header: "Email",
        value: (record) => text(record, "email"),
        sortValue: (record) => text(record, "email"),
      },
      {
        key: "role",
        header: "Role",
        value: (record) => text(record, "role") || "student",
        sortValue: (record) => text(record, "role"),
      },
      {
        key: "createdAt",
        header: "Registered",
        value: (record) => text(record, "createdAt") || "Not recorded",
        sortValue: (record) => text(record, "createdAt"),
      },
    ],
  },
};
