# Sawy Academy Platform — Code-Verified Audit

**Date:** August 9, 2026  
**Method:** Current-source inspection; runtime commands returned no usable exit status  
**Scope:** Engineering implementation only; course content, videos, images, copy, and catalogue data are excluded

## Status legend

| Status | Meaning |
|---|---|
| ✅ DONE | Implemented in the current source |
| ⚠️ PARTIAL | Substantial implementation exists, but a required behavior or production step remains |
| ❌ NOT STARTED | No meaningful implementation found |
| ⬜ NOT VERIFIED | Requires a working runtime or deployed-environment check |

## Executive summary

The platform is approximately **72% engineering-complete** against the full
189–200 hour scope. Confidence is medium-high for source implementation and
lower for deployment readiness because the current test/typecheck commands did
not return a usable result.

The largest improvement since the August 6 audit is the protected lesson-video
stack: private R2 upload, queued FFmpeg processing, encrypted adaptive HLS,
short-lived grants, enrollment/device/prerequisite authorization, an in-page
player, moving user watermark, access auditing, and an admin review queue now
exist in source.

The primary launch blockers are:

1. Make checkout pricing server-authoritative.
2. Gate lesson text/API payloads, not only protected video.
3. Add lesson completion, live progress, and persistent playback position.
4. Deploy and smoke-test R2, the media Worker, and the FFmpeg worker.
5. Move payment proofs and other general images off local disk.

---

## 1. Build status tracker

| Area | Status | Current position |
|---|---|---|
| Backend API / MongoDB | ⚠️ PARTIAL | Express/Mongoose APIs and models are substantial. General uploads still use local `public/uploads`. |
| Public frontend | ⚠️ PARTIAL | Main catalogues and flows exist. Paid lesson text remains public and learning progress is incomplete. |
| Admin control panel | ⚠️ PARTIAL | Broad CRUD and operational queues exist. Dashboard lacks pending order/service metrics. |
| Authentication and sessions | ⚠️ PARTIAL | Login, signup, roles, cookie sessions, CSRF, profile and password change exist. Forgot-password/reset is absent. |
| Device verification | ⚠️ PARTIAL | Limit enforcement, session binding, invalidation, per-user limits and admin override exist. Student self-service removal does not. |
| Commerce and orders | ⚠️ PARTIAL | Product/cart/checkout/review/enrollment flow exists. Order pricing trusts client input; physical fulfillment is incomplete. |
| Learning and progress | ⚠️ PARTIAL | Course/lesson UI and enrollment records exist. Completion mutation and persistent resume are absent. |
| Protected video | ⚠️ PARTIAL | Extensive protected R2/HLS source exists; production deployment and real R2/Safari validation remain. |
| Portfolio and research | ✅ DONE | Public listing/detail and admin management are implemented. |
| Services | ⚠️ PARTIAL | Request and admin flows exist. Backend does not require rejection notes. |
| Email and notifications | ❌ NOT STARTED | No transactional provider or sender integration found. |
| Testing and QA | ⚠️ PARTIAL | Unit and E2E files now exist, but key business flows and real infrastructure remain unverified. |
| Deployment | ⚠️ PARTIAL | Environment/proxy safeguards and Worker config exist; deployment manifests, runbooks and proof are incomplete. |

---

## 2. Feature audit

### Accounts and authentication

- [✅ DONE] Public student signup and login.
- [✅ DONE] Student/admin roles and frontend/backend authorization.
- [✅ DONE] Session-backed JWT in an httpOnly cookie.
- [✅ DONE] Logout revokes the server session.
- [✅ DONE] Profile editing and authenticated password change.
- [✅ DONE] CSRF and registered-device checks on authenticated operations.
- [❌ NOT STARTED] Forgot-password and email-based password reset.

Key files: `routes/authRoutes.js`, `controllers/authController.js`,
`routes/userRoutes.js`, `middleware/authMiddleware.js`,
`lib/auth/sessionCookie.js`.

### Courses, lessons and enrollment

- [✅ DONE] API-backed course/group listing and course detail pages.
- [✅ DONE] API-backed lesson pages, previous/next navigation and course rail.
- [✅ DONE] Diploma and leveled course templates.
- [✅ DONE] Course, group and lesson admin CRUD/reordering.
- [✅ DONE] Order approval creates enrollments.
- [✅ DONE] Protected video access requires authentication, a registered device,
  enrollment and leveled prerequisites.
- [⚠️ PARTIAL] Enrollment gating protects the video but not the lesson text,
  summary, product materials or navigation. Public course responses expose the
  lesson payload used by the page.
- [❌ NOT STARTED] No completion mutation endpoint or UI writes
  `Enrollment.completedLessonIds`.
- [❌ NOT STARTED] `LeveledCourseDetail` still consumes
  `stubTrackProgress()`, so public course-level progress is not live.
- [❌ NOT STARTED] Playback time is not stored across page visits or sessions.
  The player only restores time during an in-page manifest refresh.

Key files: `app/courses/[slug]/[lessonSlug]/page.tsx`,
`routes/enrollmentRoutes.js`, `controllers/enrollmentController.js`,
`models/Enrollment.js`, `lib/courseProgress.ts`,
`lib/lessonVideoAccessPolicy.js`.

### Protected lesson video

- [✅ DONE] Admin source-video upload with progress and processing status.
- [✅ DONE] Private R2 source/output storage abstraction.
- [✅ DONE] Mongo-backed processing jobs, leases, retries and status reporting.
- [✅ DONE] FFmpeg/ffprobe adaptive renditions without upscaling.
- [✅ DONE] AES-128 encrypted HLS output and wrapped content keys.
- [✅ DONE] Same-origin manifests and short-lived scoped media/key grants.
- [✅ DONE] Cloudflare media-gateway Worker for private R2 segments.
- [✅ DONE] Enrollment, device, session and prerequisite checks on playback.
- [✅ DONE] HLS.js/native-HLS player with recovery and manifest refresh.
- [✅ DONE] Moving user-identifying watermark and basic download deterrents.
- [✅ DONE] Access auditing, anomaly flags and admin review controls.
- [⚠️ PARTIAL] R2, media gateway and FFmpeg worker are not proven deployed from
  this repository state; Worker configuration includes example values.
- [⬜ NOT VERIFIED] Real R2 playback, revocation behavior and cross-origin
  configuration in production.
- [⬜ NOT VERIFIED] Real Safari/iOS playback and fullscreen behavior.
- [⚠️ PARTIAL] Legacy `videoUrl` remains for migration.

Key files: `controllers/videoUploadController.js`,
`controllers/protectedVideoController.js`,
`lib/videoProcessingQueue.js`, `lib/videoTranscoder.js`,
`components/media/VideoPlayer.tsx`, `workers/media-gateway/src/index.ts`,
`docs/r2-video-hosting.md`.

### Products, cart, checkout and orders

- [✅ DONE] Product listing/detail and admin CRUD.
- [✅ DONE] Product/course cart with authenticated server synchronization.
- [✅ DONE] Checkout and InstaPay payment-proof upload.
- [✅ DONE] Order creation, confirmation and student order history.
- [✅ DONE] Admin order queue, proof viewer, approval and rejection.
- [✅ DONE] Order rejection reason enforced in both UI and backend.
- [✅ DONE] Approval creates course enrollments.
- [⚠️ PARTIAL] **Critical:** the order API accepts client-submitted item prices
  instead of resolving authoritative product/course prices on the server.
- [⚠️ PARTIAL] Payment proof accepts a submitted URL and general uploads use
  local disk without durable ownership/lifecycle guarantees.
- [⚠️ PARTIAL] Physical products lack shipping address, inventory and
  fulfillment/delivery state if physical fulfillment is part of launch scope.

Key files: `components/cart/CheckoutForm.tsx`,
`controllers/orderController.js`, `models/Order.js`,
`controllers/uploadController.js`.

### Portfolio and research

- [✅ DONE] Portfolio listing, filtering, detail, admin CRUD and reordering.
- [✅ DONE] Research catalogue, detail and admin CRUD.
- [⚠️ PARTIAL] Research may link to external publication/PDF URLs, but this is
  not a protected course-material system.

### Course PDFs and materials

- [✅ DONE] Courses can cross-link related shop products.
- [❌ NOT STARTED] No protected course PDF model, upload, enrollment-gated
  download/viewer or Google Drive course-material integration.

Key file: `components/courses/CourseMaterials.tsx`.

### Services and contact

- [✅ DONE] Design, research/collaboration and device-access request forms.
- [✅ DONE] Student request history and admin queue/detail/status controls.
- [⚠️ PARTIAL] Service rejection notes are required by the UI but not by
  `serviceController.updateStatus`; direct API calls can reject without notes.
- [✅ DONE] Contact form validation and inline success state.
- [⚠️ PARTIAL] Contact submission only logs to the console and does not deliver
  to email or a CRM.

### Admin control panel

- [✅ DONE] Management for courses, groups, lessons, products, portfolio,
  research, users, homepage and settings.
- [✅ DONE] Order, service and video-security queues/details.
- [✅ DONE] User device removal and per-user device-limit override.
- [⚠️ PARTIAL] Dashboard metrics only cover catalogue counts; pending
  orders/services and other operational metrics are absent.
- [⚠️ PARTIAL] Lesson editor supports core metadata and protected video upload,
  but omits editable summary/content fields supported by the lesson model/API.

### Device limit

- [✅ DONE] Default two-device enforcement with configurable per-user limits.
- [✅ DONE] Device/session binding and mid-session invalidation.
- [✅ DONE] Profile device list and admin device removal/limit override.
- [✅ DONE] Student device-change requests through the services workflow.
- [⚠️ PARTIAL] No student self-service removal or credential-verified pre-login
  replacement. Current behavior matches the simplified admin-mediated option,
  not the original full self-service scope.

### Email and notifications

- [❌ NOT STARTED] Order status email.
- [❌ NOT STARTED] Service status email.
- [❌ NOT STARTED] Enrollment confirmation email.
- [❌ NOT STARTED] Contact delivery email.
- [❌ NOT STARTED] Password-reset email.

No transactional email dependency or sender module was found in `package.json`.

---

## 3. Testing, deployment and operations

### Automated coverage present

Fourteen test files cover selected shared primitives, protected-video access,
processing, grants, player behavior, device revocation, research UI,
accessibility and media-gateway behavior.

### Coverage still required

- [⬜ NOT VERIFIED] Login/signup/profile against a production API and database.
- [⬜ NOT VERIFIED] Third-device rejection and admin-mediated replacement.
- [⬜ NOT VERIFIED] Cart → checkout → payment approval → enrollment.
- [⬜ NOT VERIFIED] Server-side lesson gating and future completion/progress.
- [⬜ NOT VERIFIED] Admin CRUD and operational queues end to end.
- [⬜ NOT VERIFIED] Real private-R2 upload, transcode and playback.
- [⬜ NOT VERIFIED] Mobile, Safari/iOS and broad accessibility regression.

The existing HLS Playwright test uses routed fixtures; it is useful component
coverage but not proof of a deployed R2/Worker/FFmpeg flow.

### Deployment/operations gaps

- README is effectively empty.
- No Dockerfile, Render manifest or CI workflow was found.
- Generic uploads use local disk.
- Media Worker configuration still needs environment-specific production values.
- FFmpeg worker hosting, scaling, logs and health monitoring need setup.
- R2 lifecycle cleanup, backups, KEK recovery and alerting need operational
  implementation and testing.

---

## 4. Weighted completion estimate

| Workstream | Weight | Completion |
|---|---:|---:|
| Authentication/accounts | 9% | 80% |
| Course catalogue/CRUD | 7% | 90% |
| Gating/progress/resume | 12% | 20% |
| Commerce/orders | 10% | 85% |
| Portfolio/research/services | 9% | 95% |
| Admin panel | 11% | 90% |
| Device controls | 8% | 80% |
| Backend/general storage | 8% | 85% |
| Protected video | 12% | 85% |
| PDFs/materials | 3% | 0% |
| Email/notifications | 3% | 0% |
| Tests/QA | 4% | 55% |
| Deployment/operations | 4% | 35% |

**Weighted total: approximately 72%.**

This estimate excludes missing content/assets. It measures implementation
against the full original scope, including the full device-management version,
protected materials, QA and deployment—not merely the visible page count.

---

## 5. Recommended completion order

### Launch blockers

1. Resolve product/course prices server-side when creating orders.
2. Return gated lesson detail payloads and protect paid lesson text.
3. Add completion mutations, live progress reads and persistent video position.
4. Deploy and smoke-test R2, the media gateway and FFmpeg worker.
5. Move payment/CMS/profile images to durable object storage.

### High priority

6. Add password reset and transactional email.
7. Add protected, enrollment-gated course PDFs/materials.
8. Add real E2E coverage for auth, device limit, checkout, enrollment and video.
9. Implement physical shipping/inventory/fulfillment if products are shipped.
10. Confirm whether full student device self-service remains required.

### Medium priority

11. Require service rejection notes in the backend.
12. Add pending order/service and operational dashboard metrics.
13. Add deployment manifests, CI, runbooks, backups and monitoring.
14. Remove or formally migrate legacy external lesson `videoUrl` data.

---

## 6. Delta from the August 6 audit

Completed or substantially added since the prior report:

- Private R2 lesson-video upload and storage structure.
- FFmpeg processing queue, leases, retries and adaptive renditions.
- Encrypted HLS, wrapped keys and short-lived media grants.
- Cloudflare media-gateway Worker.
- Enrollment/device/prerequisite-protected playback endpoints.
- In-page HLS player, watermark and source/download deterrents.
- Video-access auditing, anomaly flags and admin review.
- Admin lesson-video upload/status/retry UX.
- Expanded unit/E2E coverage around video and device revocation.
- Per-user device limits and admin-mediated device-access requests.

Corrections to the prior report:

- Protected video is no longer “not started”; it is substantially implemented
  but operationally unverified.
- Student device self-removal and pre-login deletion are not present in current
  routes. Device replacement is admin-mediated.
- Video access is gated, but the full lesson payload/page is not.
