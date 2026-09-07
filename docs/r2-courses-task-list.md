# Cloudflare R2 Courses Setup — Master Task List

This document tracks all tasks required to complete the full Cloudflare R2 cloud storage setup for Sawy Academy courses, lessons, media assets, documents, and admin lifecycle workflows.

---

## Task 1: Student Lesson PDF / Document Download UI
- [x] **1.1** In `app/courses/[slug]/[lessonSlug]/page.tsx`, add a lesson materials/document section when `lesson.documentAvailable` is true.
- [x] **1.2** Provide an authenticated download button that triggers `/api/lessons/${lesson.id}/document`.
- [x] **1.3** For unauthenticated or unenrolled students, show the document section in a locked state (matching the video player lock UX with CTA to sign in / enroll).
- [x] **1.4** Ensure mobile and desktop responsive layout with proper accessibility labels (`aria-label`, download icon, file type badge).

---

## Task 2: Lesson Deletion Document Cascade Cleanup
- [x] **2.1** In `controllers/lessonController.js` (`remove`), query `DocumentAsset.find({ lessonId: lesson._id })`.
- [x] **2.2** Delete all associated private PDF files from Cloudflare R2 (`docs/{courseId}/{lessonId}/...`).
- [x] **2.3** Delete `DocumentAsset` MongoDB records on lesson deletion.
- [x] **2.4** Ensure error handling and logging when R2 document deletion occurs during lesson deletion.

---

## Task 3: Course Deletion Full Cascade Cleanup
- [x] **3.1** In `controllers/courseController.js` (`remove`), expand the deletion logic to resolve all associated lessons.
- [x] **3.2** Delete all private R2 video assets (`video-assets/{courseId}/...` prefix).
- [x] **3.3** Delete all private R2 document assets (`docs/{courseId}/...` prefix).
- [x] **3.4** Delete public R2 course assets if present (`website-assets/courses/{courseId}/...`).
- [x] **3.5** Cascade delete MongoDB records: `VideoProcessingJob`, `VideoAsset`, `DocumentAsset`, and `Lesson` documents belonging to the course.
- [x] **3.6** Remove course reference from any `CourseGroup.courses` arrays.

---

## Task 4: Admin Standalone Media Removal (Detach/Delete Video & PDF)
- [x] **4.1** Add `DELETE /api/courses/:slug/lessons/:lessonId/video` endpoint to delete an attached video asset and R2 files without deleting the lesson.
- [x] **4.2** Add `DELETE /api/courses/:slug/lessons/:lessonId/document` endpoint to delete an attached document asset and R2 PDF without deleting the lesson.
- [x] **4.3** Update `components/admin/LessonsManager.tsx` with "Remove Video" and "Remove PDF" actions with confirmation dialogs.
- [x] **4.4** Update API client in `lib/api/lessons.ts` with `deleteLessonVideo` and `deleteLessonDocument` helpers.

---

## Task 5: Storage Garbage Collection & Maintenance Script
- [x] **5.1** Create `scripts/r2-prune-orphans.js` to scan and prune:
  - Superseded `VideoAsset` source files and HLS renditions.
  - Superseded `DocumentAsset` PDF files.
  - Stale `video-assets/.../staging/` directories not belonging to active running jobs.
- [x] **5.2** Add npm script `"r2:prune": "node scripts/r2-prune-orphans.js"` to `package.json`.
- [x] **5.3** Support dry-run mode (`--dry-run`) and retention window flags (`--older-than-days=N`).

---

## Task 6: Operational & Queue Health Reporting
- [x] **6.1** Add `GET /api/admin/video-queue/status` (or `videoProcessingQueue.getQueueMetrics()`) to report queue counts (`queued`, `processing`, `retry_wait`, `failed`, `completed`, stale leases).
- [x] **6.2** Include queue status summary in admin API for operational monitoring.

---

## Task 7: Verification & Test Suite
- [x] **7.1** Add unit tests for lesson & course cascade deletion and standalone media removal.
- [x] **7.2** Add unit tests for student lesson document UI rendering and locked states.
- [x] **7.3** Verify existing unit and integration test suite (`npm test`).
