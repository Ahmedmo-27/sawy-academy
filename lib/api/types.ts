export interface ApiErrorBody {
  message?: string;
  statusCode?: number;
  code?: string;
  devices?: Array<{
    id: string;
    label: string;
    lastActiveAt: string;
    createdAt?: string;
  }>;
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
  /** Safe availability flag; the private R2 object key is never returned. */
  videoAvailable?: boolean;
  /** Current state of the asynchronous protected-video processing pipeline. */
  videoProcessingStatus?: "none" | "queued" | "processing" | "ready" | "failed";
  videoProcessingUpdatedAt?: string;
  /** Legacy YouTube location retained only until an explicit migration. */
  videoUrl?: string;
  previewImage?: string;
  /** Safe availability flag; the private R2 docs/ key is never returned. */
  documentAvailable?: boolean;
}

export interface Course extends TimestampedRecord {
  id: string;
  slug: string;
  title: string;
  description: string;
  level: string;
  instructor: string;
  price: string;
  image?: string;
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
  image?: string;
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
  gallery?: string[];
}

export interface Faq extends TimestampedRecord {
  id: string;
  question: string;
  answer: string;
  category?: string;
  published?: boolean;
  order?: number;
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
  gallery?: string[];
  beforeImage?: string;
  afterImage?: string;
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
  authors?: string[];
  publicationDate?: string;
  doi?: string;
  citation?: string;
  pdfUrl?: string;
  externalUrl?: string;
  keywords?: string[];
  image?: string;
  figures?: string[];
  slug: string;
}

export type ResearchSort = "newest" | "oldest" | "title";

export interface ResearchPage {
  items: Research[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
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
  /** Display URLs (proxy for private R2 keys, or legacy /uploads paths). */
  referenceImageUrls?: string[];
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

export interface DeviceAccessServicePayload {
  type: "device-access";
  name: string;
  email: string;
  requestKind: "replace" | "increase";
  reason: string;
  deviceToReplaceId?: string;
  deviceToReplaceLabel?: string;
}

export type ServiceSubmissionPayload =
  | DesignServicePayload
  | ResearchServicePayload
  | DeviceAccessServicePayload;

export interface User extends TimestampedRecord {
  id: string;
  name: string;
  email: string;
  role?: string;
  /** Profile photo URL from /api/upload */
  avatarUrl?: string;
  photoUrl?: string;
  /** Max registered devices for this student account */
  deviceLimit?: number;
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

export interface BrandingSettings {
  name: string;
  wordmark: string;
  wordmarkSuffix?: string;
  professor: string;
  professorTitle: string;
  role: string;
  institution: string;
  affiliation?: string;
  tagline: string;
  email: string;
  phone: string;
  mobile?: string;
  address: {
    line1: string;
    line2: string;
    governorate?: string;
    country: string;
    postal?: string;
  };
  officeHours?: string;
  established?: string;
  footerBlurb?: string;
  logoUrl?: string;
  facebookUrl?: string;
  instagramUrl?: string;
}

export interface SeoSettings {
  title: string;
  description: string;
  ogImageUrl?: string;
}

export interface NavLinkItem {
  id: string;
  label: string;
  href: string;
  children?: NavLinkItem[];
}

export interface PageHeaderContent {
  eyebrow: string;
  title: string;
  description: string;
}

export interface SiteSettings extends TimestampedRecord {
  key?: string;
  branding: BrandingSettings;
  seo: SeoSettings;
  navigation: { items: NavLinkItem[] };
  footer: { links: NavLinkItem[] };
  pageHeaders: Record<string, PageHeaderContent>;
  contactPage: { intro: string; imageUrl?: string };
  sharedAssetUrls?: string[];
  servicesPage?: {
    designImageUrl?: string;
    researchImageUrl?: string;
    processBriefImageUrl?: string;
    processReviewImageUrl?: string;
    processDeliveryImageUrl?: string;
  };
}

export type HomeSectionType =
  | "hero"
  | "philosophy"
  | "portfolio"
  | "courses"
  | "products"
  | "research"
  | "contact"
  | "custom";

export interface HomeSection {
  id: string;
  type: HomeSectionType;
  enabled: boolean;
  order: number;
  content: Record<string, unknown>;
}

export interface HomePageConfig extends TimestampedRecord {
  key?: string;
  sections: HomeSection[];
}

export type VideoAccessFlagStatus =
  | "open"
  | "in_review"
  | "resolved"
  | "dismissed";

export interface VideoAccessFlag extends TimestampedRecord {
  _id: string;
  userId: { _id: string; name: string; email: string };
  deviceId: string;
  lessonId: { _id: string; title: string; slug?: string; sheetRef?: string };
  assetId: string;
  reasonCode: "distinct_ip_threshold";
  status: VideoAccessFlagStatus;
  notes: string;
  distinctIpCount: number;
  threshold: number;
  windowMinutes: number;
  firstDetectedAt: string;
  lastDetectedAt: string;
  reviewedAt?: string;
  reviewedBy?: { _id: string; name: string; email: string };
}

export interface HlsKeyAccessLog {
  _id: string;
  userId: string;
  sessionId: string;
  deviceId: string;
  lessonId?: { _id: string; title: string; slug?: string; sheetRef?: string };
  assetId?: string;
  ip: string;
  userAgent: string;
  outcome: "success" | "denied" | "error";
  reason: string;
  occurredAt: string;
}

export interface VideoAccessFlagDetail {
  flag: VideoAccessFlag;
  logs: HlsKeyAccessLog[];
}
