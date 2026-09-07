# Sawy Academy — Dashboard Documentation (Admin & Student)

This document provides complete architectural and operational documentation for both the **Admin Dashboard** (`/admin`) and the **Student Dashboard** (`/dashboard`) in **Sawy Academy**.

---

## 1. System Overview & UI/UX Principles

The dashboards are built on Next.js 15 App Router, React 19, Tailwind CSS, and Framer Motion, adhering to an **architectural minimalism and precision** aesthetic:
- **Hairline Borders & Geometry**: Monochromatic structure with high contrast, crisp typography, and architectural sheet references (`A-01`, `L-01`).
- **Explicit User Feedback**: Non-destructive workflows, confirmation dialogs (`ConfirmDialog.tsx`), progress indicators, and status badges (`StatusBadge.tsx`).
- **Command Palette Access**: Keyboard-driven navigation via `⌘K` or `Ctrl+K` (`AdminCommandPalette.tsx`).
- **Responsive Layouts**: Accessible mobile-first layouts with expandable desktop sidebars.

---

## 2. Admin Dashboard (`/admin`)

The Admin Dashboard provides full operational control over the academy's curricula, media pipelines, commerce, security anomalies, and public CMS content.

```
/admin
├── /courses                     -> Course list, pricing, syllabus & video pipeline
│   ├── /new                     -> Create course
│   └── /[slug]/edit             -> Edit course, manage lessons & upload media
├── /course-groups               -> Diplomas & leveled track bundles
│   ├── /new                     -> Create diploma/track
│   └── /[id]/edit               -> Edit bundled courses & bundle price
├── /orders                      -> InstaPay verification queue & receipt inspector
│   └── /[id]                    -> Order detail, proof viewer & approval/rejection
├── /services                    -> Architectural & research inquiries queue
│   └── /[id]                    -> Client submission detail & reference images
├── /video-access-flags          -> Anti-leeching security anomaly center
│   └── /[id]                    -> Flag investigation, audit log & session revocation
├── /users                       -> User management, device quota & remote logout
│   ├── /new                     -> Create user
│   └── /[id]/edit               -> Edit role, password & device limit
├── /products                    -> Physical instruments & publication catalog
│   ├── /new                     -> Add product
│   └── /[id]/edit               -> Edit specifications & gallery
├── /portfolio                   -> Architectural projects CMS (A-01 sheet series)
│   ├── /new                     -> Publish project
│   └── /[slug]/edit             -> Edit before/after & gallery
├── /research                    -> Academic research papers, DOIs & citations
│   ├── /new                     -> Publish paper
│   └── /[slug]/edit             -> Edit abstract, authors & figures
├── /faqs                        -> FAQ accordions & sequence order
│   ├── /new                     -> Add question
│   └── /[id]/edit               -> Edit answer
├── /homepage                    -> Modular homepage builder & section reorderer
└── /settings                    -> Studio branding, InstaPay destination & SEO
```

---

### 2.1 Core Architectural Components

#### 2.1.1 Authentication & Protection (`AdminAuthGuard.tsx`)
All `/admin/*` routes are wrapped by `AdminLayout.tsx` and protected by `AdminAuthGuard.tsx`.
- Verifies that the active user possesses `role === "admin"`.
- If unauthenticated or a standard student, redirects immediately to `/login?redirect=/admin`.

#### 2.1.2 Command Palette (`AdminCommandPalette.tsx`)
- Triggered by `Ctrl+K` or `⌘K` from anywhere in the admin area.
- Fuzzy search powered by `fuse.js` indexing all management areas, quick actions, recent courses, pending orders, and security flags.

#### 2.1.3 Generic Resource Engine (`resourceConfig.tsx` & `DataTable.tsx`)
Standard resources (`products`, `faqs`, `users`, `portfolio`, `research`) share a unified, type-safe configuration system:
- **`ResourceListPage.tsx`**: Renders search filters, column sorting, pagination, and quick-edit modals.
- **`ResourceFormPage.tsx`**: Dynamic schema-driven forms with built-in validation, image uploaders (`ImageUploadField.tsx`), multi-image galleries (`ImageGalleryField.tsx`), and course pickers (`CoursePickerField.tsx`).
- **`ConfirmDialog.tsx`**: Modal dialog for dangerous actions (deletions, session revocations).

---

### 2.2 Specialized Admin Modules

#### 2.2.1 Courses & Lessons Manager (`/admin/courses/[slug]/edit`)
- **Course Metadata**: Title, slug, description, instructor, level, price, cover image.
- **`LessonsManager.tsx`**:
  - **Reorder Lessons**: Drag-and-drop or numerical reordering updating sequence orders in MongoDB.
  - **Video Pipeline Integration**:
    - Upload raw video files (up to 2 GiB) with real-time progress.
    - Monitors transcode status (`queued` -> `processing` -> `ready` or `failed`).
    - Displays FFmpeg attempt counts and generated renditions (1080p, 720p, 480p).
    - **Retry Action**: One-click manual requeue for failed transcode jobs.
    - **Remove Video Action**: Asynchronously purges encrypted HLS chunks, source video, and DB asset references from private R2.
  - **Lesson PDF Documents**:
    - Attach lecture PDF notes stored securely in private R2 (`docs/` prefix).
    - Displays version generation index.
    - **Remove Document Action**: Deletes PDF attachment from R2 storage.
  - **Related Materials**: Links physical tools and books from the product catalog.

#### 2.2.2 Course Groups & Diplomas (`/admin/course-groups`)
- Groups individual courses into **Diplomas** (e.g., "Full Architecture Diploma") or **Sequential Tracks** ("Level 01 + Level 02").
- Sets discounted bundle pricing.
- Approving an order containing a diploma automatically enrolls the student into all bundled courses.

#### 2.2.3 Order Verification Queue (`/admin/orders`)
- **Queue Filters**: `pending`, `verified`, `rejected`.
- **Payment Receipt Inspector**:
  - Securely streams the student's InstaPay transfer screenshot directly from private R2 storage (`GET /api/orders/:id/payment-screenshot`).
- **Approval Workflow**:
  - Admin verifies payment amount and bank transaction reference.
  - Clicking **"Approve Order"** updates status to `verified` and triggers immediate auto-enrollment in the database.
- **Rejection Workflow**:
  - Admin provides an explicit reason (e.g., "Amount transferred does not match order total").

#### 2.2.4 Services & Client Inquiries (`/admin/services`)
- Inquiries submitted from public forms:
  - **Architectural Design Commissions**: Project type, location, scope of work, budget range, desired timeline, attached reference images gallery.
  - **Academic Collaboration**: Research topic, institutional affiliation, CV link.
  - **Student Device Access Requests**: Student requests to replace an old laptop or request an additional concurrent device slot.
- **Status Lifecycle**: `pending` -> `in review` -> `accepted` / `rejected`.
- **Internal Admin Notes**: Private studio notes on client negotiations.

#### 2.2.5 Video Security, Queue Metrics & Abuse Center (`/admin/video-access-flags`)
- **Video Queue Diagnostics**: Real-time aggregation of worker states (`queued`, `processing`, `retry_wait`, `failed`, `staleLeases`) via `GET /api/admin/video-queue/status`.
- **Automated Multi-IP Detection**:
  - Flags accounts when video decryption keys are requested from multiple distinct IP addresses within a rolling 15-minute window (anti-account-sharing / anti-leeching).
- **Incident Investigation View**:
  - Shows student identity, device label, detected distinct IP count, and threshold limit.
  - Displays full `HlsKeyAccessLog` audit history for the session with timestamps, client IPs, user agents, and success/denial outcomes.
- **Remediation Actions**:
  - **Revoke All User Sessions**: Instantly logs out the student across all devices.
  - **Remove Device**: Detaches the compromised device.
  - **Update Flag Status**: Mark as `in_review`, `resolved`, or `dismissed` with resolution notes.

#### 2.2.6 Users & Device Limit Control (`/admin/users`)
- Lists all platform users with role badges (`admin` / `student`).
- **Device Limit Setting**: Configure per-student concurrent device limit (1 to 20 devices, default 2).
- **`UserDevicesPanel.tsx`**:
  - View all currently registered devices for any student.
  - See last active timestamps and browser user agents.
  - Remotely delete/detach a device to free up slots for the student.
- **Administrative Password Reset**: Reset student passwords directly.

#### 2.2.7 Architectural Portfolio CMS (`/admin/portfolio`)
- Manages published projects across categories: `Buildings`, `Interiors`, `Furniture`, `Competitions`.
- **Architectural Sheet Reference**: Automatically assigns standardized sheet numbers (`A-01`, `A-02`, etc.).
- **Renovation Before/After**: Uploads before and after photos for interactive comparison sliders on the frontend.
- **High-Resolution Photo Gallery**: Multi-image uploader to Cloudflare R2 `website-assets/portfolio/`.

#### 2.2.8 Academic Research CMS (`/admin/research`)
- Manages scientific publications, books, and conference papers.
- **DOI Normalization**: Cleans and validates DOIs automatically.
- **BibTeX Citations**: Formatted citation strings for academic reference.
- **Keywords & Authors**: Tagging and author management.
- **Figure Attachments**: Scientific diagrams and cover graphics.

#### 2.2.9 Modular Homepage Builder (`/admin/homepage`)
- **`HomepageBuilderPage.tsx`**:
  - Visual layout manager for the landing page (`/`).
  - Reorder sections vertically with live drag/move buttons.
  - Toggle section visibility (`enabled` / `disabled`).
  - Edit section copy, eyebrow titles, hero headlines, CTA button labels, and featured items in place.
  - **Reset to Defaults**: Restores default curated architecture layout.

#### 2.2.10 Site Settings & Studio Branding (`/admin/settings`)
- **`SiteSettingsPage.tsx`**:
  - **Branding & Wordmark**: Dr. Mohamed El Sawy, academic rank, university affiliation, studio tagline.
  - **InstaPay Configuration**: Destination type (`phone` or `bank`), recipient name, phone number / IBAN, and payment guide instructions shown at checkout.
  - **Global SEO**: Site title, meta description, and OpenGraph social share image.
  - **Navigation Builder**: Customize header navigation items, hierarchy, and footer links.
  - **Page Header Overrides**: Customize eyebrow, title, and description for every public route.

---

## 3. Student Dashboard (`/dashboard`)

The Student Dashboard is the central learning portal for enrolled students, providing course access, lesson progress tracking, device management, and profile settings.

```
/dashboard
├── page.tsx                     -> Student Overview (Courses, progress, devices, orders)
└── /profile
    └── page.tsx                 -> Account details, password change & device requests
```

---

### 3.1 Key Student Dashboard Features

#### 3.1.1 Enrolled Courses & Progress Tracker
- **`StudentSummaryCards.tsx`**:
  - Displays high-level stats: Active Courses, Completed Courses, Total Lessons Watched.
- **`ContinueLearningCard.tsx`**:
  - Prominently features the most recently accessed course.
  - Shows progress bar (% completed) and a 1-click shortcut button: **"Continue Lesson: [Lesson Title] →"**.
- **Course Syllabus & Interactive Completion Checklist**:
  - Direct access to enrolled course video lectures and private PDF downloads.
  - **Interactive Lesson Completion Toggle**: Students can check or uncheck lessons as completed directly from the course side-rail (`LessonCourseRail.tsx`), calling `POST /api/enrollments/courses/:courseKey/lessons/:lessonKey/complete` and updating their progress bar in real-time.

#### 3.1.2 Registered Devices & Security Panel
- Displays current device quota status (e.g., *"1 of 2 device slots registered"*).
- Highlights the currently active device (`"Current Device"` badge).
- Lists all registered devices with their labels and last active times.
- **Device Replacement / Slot Increase Button**:
  - If a student buys a new computer or reaches their limit, clicking this opens a pre-filled request to studio administrators.

#### 3.1.3 Orders & Transaction History
- View all past course and product purchases.
- Shows current payment verification status (`Pending Verification`, `Verified`, `Rejected`).
- Displays itemized totals and payment submission timestamps.

#### 3.1.4 Inquiries & Service Requests
- Tracks status of submitted design requests or academic collaborations.
- Shows admin review progress (`In Review`, `Accepted`).

#### 3.1.5 Profile & Password Management (`/dashboard/profile`)
- **Profile Info**: Update name, email, and avatar image.
- **Password Security**: Change password with current password verification.
- **Device Management**: View registered hardware details and request slot adjustments.

#### 3.1.6 Internationalization & Localization (`LanguageToggle.tsx`)
- **English & Arabic (RTL)**: Full bilingual support across student portals, course navigation, and the checkout funnel.
- Dynamically sets document direction (`dir="rtl"` / `dir="ltr"`) and translates UI labels, status messages, and navigation menus.
