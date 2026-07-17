export interface ApiErrorBody {
  message?: string;
  statusCode?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error?: ApiErrorBody | string | null;
}

export interface TimestampedRecord {
  _id?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Lesson extends TimestampedRecord {
  id: string;
  slug?: string;
  sheetRef: string;
  title: string;
  duration: string;
  order: number;
  summary?: string;
  content?: string;
  videoUrl?: string;
}

export interface Course extends TimestampedRecord {
  id: string;
  slug: string;
  title: string;
  description: string;
  level: string;
  instructor: string;
  price: string;
  lessons?: Lesson[];
  relatedProductIds?: Array<string | Product>;
  /** Resolved client-side from CourseGroup membership */
  groupId?: string;
  groupTitle?: string;
  groupType?: CourseGroupType;
}

export type CourseGroupType = "diploma" | "leveled";

export interface CourseGroup extends TimestampedRecord {
  id?: string;
  /** Public route slug for programme detail pages */
  slug?: string;
  title: string;
  subtitle: string;
  type: CourseGroupType;
  courses?: Array<Course | string>;
  bundlePrice?: string;
  relatedProductIds?: string[];
}

export interface Product extends TimestampedRecord {
  id: string;
  name: string;
  description: string;
  price: string;
  category: string;
  image: string;
}

export type ProjectCategory =
  | "Buildings"
  | "Interiors"
  | "Furniture"
  | "Competitions";

export type ProjectAspect = "tall" | "wide" | "square";

export interface Project extends TimestampedRecord {
  id: string;
  slug: string;
  sheetRef?: string;
  title: string;
  category: ProjectCategory;
  year: string;
  image: string;
  aspect?: ProjectAspect;
  order?: number;
}

export type ResearchCategory =
  | "Published"
  | "Conference"
  | "Ongoing"
  | "Book";

export interface Research extends TimestampedRecord {
  id: string;
  title: string;
  year: string;
  category: ResearchCategory;
  venue: string;
  abstract: string;
  collaborators?: string;
  slug: string;
}

export type OrderStatus = "pending" | "verified" | "rejected";

export interface Order extends TimestampedRecord {
  id: string;
  userName?: string;
  userEmail?: string;
  amount: number | string;
  status: OrderStatus;
  paymentScreenshotUrl?: string;
  instaPayScreenshot?: string;
  submittedAt?: string;
  reason?: string;
  items?: Array<{ title: string; quantity?: number; price?: string }>;
}

export type ServiceStatus = "pending" | "in review" | "accepted" | "rejected";
export type ServiceType =
  | "design"
  | "research participation"
  | "collaboration"
  | string;

export interface ServiceRequest extends TimestampedRecord {
  id: string;
  name: string;
  email: string;
  type: ServiceType;
  status: ServiceStatus;
  message?: string;
  details?: string;
  notes?: string;
}

export interface DesignServicePayload {
  type: "design";
  name: string;
  email: string;
  phone?: string;
  projectType: string;
  projectLocation?: string;
  scopeOfWork: string;
  siteSize?: string;
  budgetRange?: string;
  desiredTimeline?: string;
  referenceImageUrls?: string[];
  additionalNotes?: string;
}

export interface ResearchServicePayload {
  type: "research";
  name: string;
  email: string;
  affiliation?: string;
  interestType: string;
  linkedResearchId?: string;
  linkedResearchTitle?: string;
  researchAreaOrTopic: string;
  backgroundCvLink?: string;
  additionalNotes?: string;
}

export type ServiceSubmissionPayload =
  | DesignServicePayload
  | ResearchServicePayload;

export interface User extends TimestampedRecord {
  id: string;
  name: string;
  email: string;
  role?: string;
  /** Profile photo URL from /api/upload */
  avatarUrl?: string;
  photoUrl?: string;
}

/**
 * Assumed enrollment row from GET /api/enrollments?userId=me.
 * Progress figures are server-computed — do not recalculate on the client.
 */
export interface Enrollment extends TimestampedRecord {
  id: string;
  courseId: string;
  courseSlug: string;
  courseTitle: string;
  /** sheetRef-style course code when the API provides one */
  courseCode?: string;
  completedLessons: number;
  totalLessons: number;
  /** Present when the course is still in progress */
  nextLessonSlug?: string | null;
  /** Explicit completion flag; also inferred when completedLessons >= totalLessons */
  completed?: boolean;
}

export interface DashboardMetric {
  id: string;
  label: string;
  value: number;
  href: string;
  sheetRef: string;
}
