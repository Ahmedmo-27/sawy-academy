# Sawy Academy — Comprehensive REST API Documentation

This document is the complete reference for the **Sawy Academy REST API**, including authentication protocols, security constraints, cryptographic media streaming, request/response structures, rate limits, and status codes.

---

## 1. Global API Architecture & Conventions

### 1.1 Base URLs
- **Local Development**: `http://localhost:5000/api` (Express backend) or `http://localhost:3000/api` (via Next.js rewrite proxy)
- **Production Staging**: `https://sawy-academy.onrender.com/api`
- **Video Media Delivery Gateway**: `https://media.sawyacademy.com/media` (or `VIDEO_MEDIA_BASE_URL`)

### 1.2 Global Headers
| Header | Type | Description |
| :--- | :--- | :--- |
| `Content-Type` | `string` | Typically `application/json` (or `multipart/form-data` for file uploads) |
| `Authorization` | `string` | `Bearer <token>` (optional fallback if HttpOnly cookie is omitted) |
| `X-Device-Id` | `string` | Unique client device UUID header |
| `X-CSRF-Token` | `string` | Synchronizer token for state-modifying requests (`POST`, `PUT`, `PATCH`, `DELETE`) |
| `X-Sawy-Upload-Grant`| `string` | Pre-authenticated intent grant token for direct chunked/large file uploads |

### 1.3 Standard Response Format

#### Success Envelope
```json
{
  "success": true,
  "data": { ... }
}
```

#### Error Envelope
```json
{
  "success": false,
  "data": null,
  "error": {
    "message": "Human readable error description",
    "statusCode": 400,
    "code": "ERROR_CODE_STRING"
  }
}
```

---

## 2. Authentication, Device Management & Security Protocols

### 2.1 Authentication Mechanics
1. **HttpOnly Cookie**: The server issues a secure, HttpOnly, SameSite cookie named `sawy_session` upon login/signup.
2. **Device Binding**: Every user session is strictly bound to a `deviceId`. The `requireDevice` middleware validates that:
   - The `deviceId` in the request matches the session's registered `deviceId`.
   - The device still exists in the user's `Device` collection.
   - If the device was deleted by an admin or replaced, the server returns HTTP 401 with `code: "DEVICE_REMOVED"` and clears the cookie.
3. **Student Device Limiting**: Students are limited to `deviceLimit` concurrent devices (default 2, configurable up to 20). If a student attempts to sign in on a 3rd device without slots, login returns HTTP 409 with `code: "DEVICE_LIMIT_EXCEEDED"` and lists registered devices.

### 2.2 CSRF Protection Protocol
All unsafe HTTP methods (`POST`, `PUT`, `PATCH`, `DELETE`) require a valid CSRF token.
1. Client requests `GET /api/auth/csrf` which sets a signed cookie and returns `{ csrfToken }`.
2. Client includes `X-CSRF-Token: <token>` in subsequent state-modifying requests.
3. Requests carrying a valid `X-Sawy-Upload-Grant` header bypass CSRF verification for large multipart transfers.

### 2.3 Rate Limiting Policies
- **Login / Signup**: 10 attempts per IP / 5 attempts per email per 15-minute window.
- **Video Access Manifest & Keys**: 12 requests per user per 60 seconds.
- **Password Change**: 5 attempts per user per 15 minutes.
- **Order Creation**: 10 requests per user per hour.
- **Service Request**: 10 requests per IP per hour.
- **General Uploads**: 20 uploads per IP per 10 minutes.

---

## 3. Detailed Endpoint Catalog

---

### 3.1 Health Check

#### `GET /api/health`
- **Access**: Public
- **Description**: Verifies API availability.
- **Response**: `200 OK`
```json
{
  "success": true,
  "data": { "status": "ok" }
}
```

---

### 3.2 Authentication (`/api/auth`)

#### `GET /api/auth/csrf`
- **Access**: Public (Rate limited)
- **Description**: Generates a new CSRF token and sets the CSRF cookie.
- **Response**: `200 OK`
```json
{
  "success": true,
  "data": { "csrfToken": "..." }
}
```

#### `POST /api/auth/login`
- **Access**: Public (Rate limited)
- **Body**:
```json
{
  "email": "student@example.com",
  "password": "Password123!",
  "deviceId": "optional-existing-device-uuid",
  "userAgent": "Mozilla/5.0..."
}
```
- **Response**: `200 OK` (Sets `sawy_session` HttpOnly cookie)
```json
{
  "success": true,
  "data": {
    "token": "jwt_token_string",
    "user": {
      "id": "66c0...",
      "name": "John Doe",
      "email": "student@example.com",
      "role": "student"
    },
    "deviceId": "generated-device-uuid"
  }
}
```
- **Errors**: `401 Unauthorized` (Invalid credentials), `409 Conflict` (`DEVICE_LIMIT_EXCEEDED`)

#### `POST /api/auth/signup`
- **Access**: Public (Rate limited)
- **Body**:
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "StrongPassword123!",
  "deviceId": "device-uuid",
  "userAgent": "Mozilla/5.0..."
}
```
- **Response**: `201 Created`

#### `GET /api/auth/me`
- **Access**: Authenticated (`authenticate`, `requireDevice`)
- **Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "66c0...",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "role": "student"
    },
    "deviceId": "device-uuid"
  }
}
```

#### `POST /api/auth/logout`
- **Access**: Optional Authenticated
- **Description**: Invalidates active session from MongoDB and deletes the `sawy_session` cookie.
- **Response**: `200 OK` `{ "success": true, "data": { "ok": true } }`

---

### 3.3 Device Management (`/api/devices` & `/api/admin`)

#### `GET /api/devices/me`
- **Access**: Student / Authenticated
- **Description**: Returns all devices registered to the current authenticated student.
- **Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "devices": [
      {
        "id": "dev-1234",
        "label": "Chrome on Windows 11",
        "lastActiveAt": "2026-08-25T14:30:00.000Z"
      }
    ],
    "currentDeviceId": "dev-1234",
    "deviceLimit": 2
  }
}
```

#### `GET /api/admin/users/:userId/devices`
- **Access**: Admin only
- **Description**: Lists registered devices for any student.

#### `DELETE /api/admin/users/:userId/devices/:deviceId`
- **Access**: Admin only
- **Description**: Removes a registered device and immediately terminates any active sessions on that device.
- **Response**: `200 OK` `{ "success": true, "data": { "ok": true, "device": { ... } } }`

#### `POST /api/admin/users/:userId/revoke-sessions`
- **Access**: Admin only
- **Description**: Revokes all active sessions across all devices for a target user.
- **Response**: `200 OK` `{ "success": true, "data": { "revokedCount": 3 } }`

#### `GET /api/admin/video-queue/status`
- **Access**: Admin only
- **Description**: Returns live video transcoding queue aggregation metrics and count of stale worker leases.
- **Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "queued": 1,
    "processing": 1,
    "retry_wait": 0,
    "completed": 45,
    "failed": 0,
    "staleLeases": 0,
    "total": 47
  }
}
```

---

### 3.4 Security Auditing & Abuse Flags (`/api/admin/video-access-flags`)

#### `GET /api/admin/video-access-flags`
- **Access**: Admin only
- **Query Params**: `status` (`open`, `in_review`, `resolved`, `dismissed`), `userId`, `lessonId`, `page`, `limit`
- **Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "flags": [
      {
        "_id": "66c1...",
        "userId": { "_id": "...", "name": "...", "email": "..." },
        "lessonId": { "_id": "...", "title": "...", "sheetRef": "L-01" },
        "reasonCode": "distinct_ip_threshold",
        "status": "open",
        "distinctIpCount": 4,
        "threshold": 3,
        "windowMinutes": 15,
        "firstDetectedAt": "2026-08-25T10:00:00.000Z",
        "lastDetectedAt": "2026-08-25T10:12:00.000Z",
        "notes": ""
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 1, "totalPages": 1 }
  }
}
```

#### `GET /api/admin/video-access-flags/:flagId`
- **Access**: Admin only
- **Query Params**: `logLimit` (1..100)
- **Response**: Returns populated flag details and recent `HlsKeyAccessLog` audit records.

#### `PATCH /api/admin/video-access-flags/:flagId`
- **Access**: Admin only
- **Body**: `{ "status": "resolved", "notes": "Contacted student; resolved false positive." }`
- **Response**: `200 OK`

---

### 3.5 Courses & Course Groups (`/api/courses`)

#### `GET /api/courses`
- **Access**: Public
- **Query Params**: `includeLessons` (`true`/`false`), `page`, `limit`
- **Response**: `200 OK` (Array of populated courses)

#### `GET /api/courses/groups`
- **Access**: Public
- **Description**: Returns all diplomas and leveled tracks with bundled courses.

#### `POST /api/courses/groups`
- **Access**: Admin only
- **Body**:
```json
{
  "title": "Architectural Design Diploma",
  "subtitle": "Complete foundation to advanced diploma",
  "type": "diploma",
  "bundlePrice": "6,000 EGP",
  "courses": ["course-obj-id-1", "course-obj-id-2"],
  "image": "https://..."
}
```
- **Response**: `201 Created`

#### `PUT /api/courses/groups/:id`
- **Access**: Admin only
- **Description**: Updates course group details.

#### `DELETE /api/courses/groups/:id`
- **Access**: Admin only
- **Description**: Deletes a course group.

#### `GET /api/courses/:slug`
- **Access**: Public
- **Description**: Retrieves full course details and syllabus lessons.

#### `POST /api/courses`
- **Access**: Admin only
- **Body**:
```json
{
  "id": "bio-01",
  "title": "BioGeometry in Architecture",
  "description": "Harmonizing energy qualities in spatial forms...",
  "level": "Level 01",
  "instructor": "Dr. Mohamed El Sawy",
  "price": "2,500 EGP",
  "image": "https://cdn.example.com/website-assets/courses/cover.jpg",
  "relatedProductIds": ["prod-id-1"]
}
```
- **Response**: `201 Created`

#### `PUT /api/courses/:slug`
- **Access**: Admin only
- **Description**: Updates course metadata.

#### `DELETE /api/courses/:slug`
- **Access**: Admin only
- **Description**: Deletes course.

---

### 3.6 Lessons, Protected Video & Document Ingestion (`/api/courses/:slug/lessons`)

#### `GET /api/courses/:slug/lessons`
- **Access**: Public
- **Description**: Lists lessons for a course sorted by `order`.

#### `POST /api/courses/:slug/lessons`
- **Access**: Admin only
- **Body**:
```json
{
  "id": "bio-01-l01",
  "title": "Introduction to Harmonic Proportions",
  "sheetRef": "L-01",
  "duration": "45 min",
  "order": 1,
  "summary": "Core concepts of qualitative physics",
  "content": "# Lecture 1\n\nNotes and syllabus..."
}
```
- **Response**: `201 Created`

#### `PATCH /api/courses/:slug/lessons/reorder`
- **Access**: Admin only
- **Body**: `{ "lessonIds": ["id1", "id2", "id3"] }`
- **Response**: `200 OK`

#### `PUT /api/courses/:slug/lessons/:lessonId`
- **Access**: Admin only
- **Description**: Updates lesson metadata.

#### `DELETE /api/courses/:slug/lessons/:lessonId`
- **Access**: Admin only
- **Description**: Deletes lesson and initiates asynchronous deletion of associated R2 video files and PDF documents.

#### `POST /api/courses/:slug/lessons/:lessonId/video/intent`
- **Access**: Admin only
- **Description**: Issues a short-lived signed grant token for uploading video.
- **Response**: `200 OK` `{ "success": true, "data": { "grant": "...", "expiresAt": "..." } }`

#### `POST /api/courses/:slug/lessons/:lessonId/video`
- **Access**: Upload Grant (`authenticateLessonUploadGrant`)
- **Headers**: `X-Sawy-Upload-Grant: <token>`
- **Content-Type**: `multipart/form-data` (`video`)
- **Description**: Accepts raw video file (up to 2 GiB), encrypts content key, stores source in R2, creates `VideoAsset` and `VideoProcessingJob`.
- **Response**: `202 Accepted`
```json
{
  "success": true,
  "data": {
    "lessonId": "66c2...",
    "assetId": "66c3...",
    "jobId": "66c4...",
    "generation": 1,
    "status": "queued"
  }
}
```

#### `GET /api/courses/:slug/lessons/:lessonId/video/status`
- **Access**: Admin only
- **Description**: Polls video transcode progress, worker attempts, and renditions.

#### `POST /api/courses/:slug/lessons/:lessonId/video/retry`
- **Access**: Admin only
- **Description**: Manually requeues a failed video processing job.
- **Response**: `202 Accepted`

#### `DELETE /api/courses/:slug/lessons/:lessonId/video`
- **Access**: Admin only
- **Description**: Removes all encrypted video assets, source files, and staging folders from private R2, deletes DB asset/job records, and resets the lesson's video availability to `false` and status to `none`.
- **Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "lessonId": "66c2...",
    "videoAvailable": false,
    "status": "none"
  }
}
```

#### `POST /api/courses/:slug/lessons/:lessonId/document/intent`
- **Access**: Admin only
- **Description**: Issues a signed grant token for uploading private PDF documents.

#### `POST /api/courses/:slug/lessons/:lessonId/document`
- **Access**: Upload Grant (`authenticateLessonUploadGrant`)
- **Content-Type**: `multipart/form-data` (`document`)
- **Description**: Uploads private PDF lesson document to R2 `docs/` prefix.
- **Response**: `201 Created`

#### `GET /api/courses/:slug/lessons/:lessonId/document/status`
- **Access**: Admin only
- **Description**: Returns document availability and generation metadata.

#### `DELETE /api/courses/:slug/lessons/:lessonId/document`
- **Access**: Admin only
- **Description**: Deletes the private PDF document object from R2 storage and marks the document asset as removed.
- **Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "lessonId": "66c2...",
    "documentAvailable": false,
    "status": "none"
  }
}
```

---

### 3.7 Video Playback & Document Streaming (`/api/lessons`)

#### `GET /api/lessons/:lessonId/video-access`
- **Access**: Student / Enrolled (`authenticate`, `requireDevice`)
- **Description**: Validates user enrollment and device status; returns watermarked manifest URL.
- **Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "lessonId": "66c2...",
    "signedUrl": "/api/lessons/66c2.../manifest",
    "expiresAt": "2026-08-25T15:30:00.000Z",
    "watermarkText": "student@example.com"
  }
}
```

#### `GET /api/lessons/:lessonId/manifest`
- **Access**: Student / Enrolled
- **Query Params**: `variant` (optional rendition path)
- **Response**: `200 OK` (`Content-Type: application/vnd.apple.mpegurl`)
- **Description**: Dynamically rewrites HLS manifest:
  - Variant lines point to media URLs with signed HMAC media grants.
  - `#EXT-X-KEY` points to `/api/lessons/:lessonId/hls-key?grant=<keyGrant>`.

#### `GET /api/lessons/:lessonId/hls-key`
- **Access**: Student / Enrolled (`authenticate`, `requireDevice`)
- **Query Params**: `grant` (HMAC Key Grant)
- **Headers**: Requires valid `Origin` or `Referer`
- **Response**: `200 OK` (`Content-Type: application/octet-stream`, 16 bytes raw AES-128 key)
- **Description**: Unwraps DEK from database using KEK, logs request to `HlsKeyAccessLog`, runs distinct-IP anomaly check, and returns raw decryption key.

#### `GET /api/media` & `HEAD /api/media`
- **Access**: Signed Grant (`grant` query parameter)
- **Headers**: `Range: bytes=...` supported
- **Description**: Streams encrypted `.ts` or `.m4s` HLS video segment from private R2.

#### `GET /api/lessons/:lessonId/document`
- **Access**: Student / Enrolled (`authenticate`, `requireDevice`)
- **Response**: `200 OK` (`Content-Type: application/pdf`, `Content-Disposition: inline`)
- **Description**: Streams private PDF document directly from private R2 storage.

---

### 3.8 Shopping Cart (`/api/cart`)

#### `GET /api/cart`
- **Access**: Authenticated (`authenticate`, `requireDevice`)
- **Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "course-id",
        "name": "BioGeometry 101",
        "price": "2,500 EGP",
        "kind": "course",
        "quantity": 1
      }
    ],
    "updatedAt": "2026-08-25T12:00:00.000Z"
  }
}
```

#### `PUT /api/cart`
- **Access**: Authenticated
- **Body**: `{ "items": [ ... ] }`
- **Response**: `200 OK`

---

### 3.9 Orders & Checkout Verification (`/api/orders`)

#### `POST /api/orders`
- **Access**: Authenticated (Rate limited)
- **Description**: Submits an order with an InstaPay payment screenshot. **Server Price Authority**: The server validates each submitted item against canonical catalog prices (`Course`, `CourseGroup`, `Product`) via `resolveCanonicalItem`, rejecting tampered prices or unrecognized item IDs.
- **Body**:
```json
{
  "items": [
    {
      "id": "course-slug",
      "name": "BioGeometry 101",
      "kind": "course",
      "quantity": 1
    }
  ],
  "screenshotUrl": "payments/66c0.../1724590000-proof.jpg"
}
```
- **Response**: `201 Created` (Order record with `id: "ORD-YYYYMMDD-XXXX"`)

#### `GET /api/orders`
- **Access**: Authenticated
- **Query Params**: `userId=me` (students) or `status=pending` (admins)
- **Response**: `200 OK` (Array of orders)

#### `GET /api/orders/:id`
- **Access**: Order Owner or Admin
- **Response**: `200 OK`

#### `GET /api/orders/:id/payment-screenshot`
- **Access**: Order Owner or Admin
- **Response**: `200 OK` (Streams payment receipt image from private R2)

#### `PATCH /api/orders/:id/approve`
- **Access**: Admin only
- **Description**: Sets order status to `verified` and automatically generates `Enrollment` records for all courses/diplomas in the order.
- **Response**: `200 OK`

#### `PATCH /api/orders/:id/reject`
- **Access**: Admin only
- **Body**: `{ "reason": "Transfer receipt not legible" }`
- **Response**: `200 OK`

---

### 3.10 Enrollments (`/api/enrollments`)

#### `GET /api/enrollments`
- **Access**: Authenticated
- **Query Params**: `userId=me`
- **Response**: `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "enrollment-id",
      "courseId": "course-id",
      "courseSlug": "biogeometry-architecture",
      "courseTitle": "BioGeometry in Architecture",
      "courseCode": "L-01",
      "completedLessons": 4,
      "totalLessons": 12,
      "completedLessonIds": ["lesson-obj-id-1", "lesson-obj-id-2"],
      "nextLessonSlug": "harmonic-resonance",
      "completed": false
    }
  ]
}
```

#### `GET /api/enrollments/courses/:courseKey`
- **Access**: Authenticated (`authenticate`, `requireDevice`)
- **Description**: Retrieves enrollment and lesson completion record for a specific course by slug or ObjectId.
- **Response**: `200 OK` (Returns single `Enrollment` object or `null` if not enrolled)

#### `POST /api/enrollments/courses/:courseKey/lessons/:lessonKey/complete`
- **Access**: Student / Enrolled
- **Description**: Marks a specific lesson as completed for the authenticated user, adding its `_id` to `completedLessonIds` and recalculating course progress percentage.
- **Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "success": true,
    "enrollment": {
      "id": "enrollment-id",
      "courseSlug": "biogeometry-architecture",
      "completedLessons": 5,
      "totalLessons": 12,
      "completedLessonIds": ["..."],
      "completed": false
    }
  }
}
```

#### `DELETE /api/enrollments/courses/:courseKey/lessons/:lessonKey/complete`
- **Access**: Student / Enrolled
- **Description**: Unmarks a lesson as completed, removing it from `completedLessonIds`.
- **Response**: `200 OK`

---

### 3.11 User Administration (`/api/users`)

#### `GET /api/users/me`
- **Access**: Authenticated
- **Response**: Returns current student profile.

#### `PUT /api/users/me`
- **Access**: Authenticated
- **Body**: `{ "name": "Jane Smith", "email": "jane@example.com", "avatarUrl": "https://..." }`

#### `PUT /api/users/me/password`
- **Access**: Authenticated (Rate limited)
- **Body**: `{ "currentPassword": "...", "newPassword": "..." }`

#### `GET /api/users`
- **Access**: Admin only
- **Response**: Returns all registered platform users.

#### `POST /api/users`
- **Access**: Admin only
- **Body**: `{ "name": "...", "email": "...", "role": "student", "deviceLimit": 3, "password": "..." }`

#### `PUT /api/users/:id`
- **Access**: Admin only
- **Description**: Updates user role, device limit, or password.

#### `DELETE /api/users/:id`
- **Access**: Admin only
- **Description**: Deletes user account.

---

### 3.12 Services & Consultations (`/api/services`)

#### `POST /api/services`
- **Access**: Public / Optional Authenticated (Rate limited)
- **Body**:
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "type": "design",
  "phone": "01000000000",
  "projectType": "Residential Villa",
  "projectLocation": "New Cairo",
  "scopeOfWork": "Full architectural & interior design",
  "referenceImageUrls": ["service-references/guest-Jane-Doe/proof.jpg"]
}
```
- **Response**: `201 Created`

#### `GET /api/services`
- **Access**: Student (`userId=me`) or Admin
- **Response**: `200 OK`

#### `GET /api/services/:id/reference-images/:index`
- **Access**: Request Owner or Admin
- **Description**: Streams private reference image from R2 `service-references/` prefix.

#### `PATCH /api/services/:id`
- **Access**: Admin only
- **Body**: `{ "status": "accepted", "notes": "Scheduled initial meeting." }`

---

### 3.13 Uploads (`/api/upload`)

#### `POST /api/upload`
- **Access**: Context-dependent (Rate limited)
- **Content-Type**: `multipart/form-data` (`file`)
- **Body Fields**:
  - `purpose`: `"website-asset"` | `"payment"` | `"service-reference"` | `"local"`
  - `page`: Target page folder for website assets (e.g., `"courses"`, `"portfolio"`)
  - `guestName`: Required when `purpose="service-reference"` for guest uploads
- **Response**: `201 Created`
```json
{
  "success": true,
  "data": {
    "url": "https://cdn.example.com/website-assets/courses/cover.jpg",
    "objectKey": "website-assets/courses/cover.jpg",
    "storage": "r2-public"
  }
}
```

---

### 3.14 Portfolio CMS (`/api/portfolio`)

#### `GET /api/portfolio`
- **Access**: Public
- **Response**: `200 OK` (Array of architectural projects)

#### `GET /api/portfolio/:slug`
- **Access**: Public

#### `POST /api/portfolio`
- **Access**: Admin only
- **Body**:
```json
{
  "id": "grand-museum",
  "title": "Grand Egyptian Cultural Center",
  "category": "Buildings",
  "year": "2025",
  "image": "https://...",
  "gallery": ["https://..."]
}
```

#### `PUT /api/portfolio/:slug`
- **Access**: Admin only

#### `DELETE /api/portfolio/:slug`
- **Access**: Admin only

#### `PATCH /api/portfolio/reorder`
- **Access**: Admin only

---

### 3.15 Products CMS (`/api/products`)

#### `GET /api/products` & `GET /api/products/:slug`
- **Access**: Public

#### `POST /api/products`, `PUT /api/products/:slug`, `DELETE /api/products/:slug`
- **Access**: Admin only

---

### 3.16 Research CMS (`/api/research`)

#### `GET /api/research` & `GET /api/research/:slug`
- **Access**: Public

#### `POST /api/research`, `PUT /api/research/:slug`, `DELETE /api/research/:slug`
- **Access**: Admin only

---

### 3.17 FAQs (`/api/faqs`)

#### `GET /api/faqs` & `GET /api/faqs/:id`
- **Access**: Public

#### `POST /api/faqs`, `PUT /api/faqs/:id`, `DELETE /api/faqs/:id`, `PATCH /api/faqs/reorder`
- **Access**: Admin only

---

### 3.18 Homepage Builder (`/api/homepage`)

#### `GET /api/homepage`
- **Access**: Public
- **Description**: Returns dynamic section layout and copy for landing page.

#### `PUT /api/homepage`
- **Access**: Admin only
- **Body**: `{ "sections": [ ... ] }`

#### `PATCH /api/homepage/reorder`
- **Access**: Admin only
- **Body**: `{ "sectionIds": ["hero", "philosophy", "courses", "portfolio"] }`

#### `POST /api/homepage/sections` & `PUT /api/homepage/sections/:id` & `DELETE /api/homepage/sections/:id`
- **Access**: Admin only

#### `POST /api/homepage/reset`
- **Access**: Admin only
- **Description**: Resets homepage layout to default seed sections.

---

### 3.19 Site Settings & Branding (`/api/settings`)

#### `GET /api/settings`
- **Access**: Public
- **Description**: Returns branding, typography, InstaPay instructions, SEO, and navigation tree.

#### `PUT /api/settings`
- **Access**: Admin only
- **Body**: `{ "branding": { ... }, "seo": { ... }, "navigation": { ... } }`

#### `POST /api/settings/reset`
- **Access**: Admin only
- **Description**: Restores default studio branding and configuration.
