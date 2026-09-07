# Sawy Academy — Database Documentation & Data Dictionary

This document provides a comprehensive reference for the MongoDB database architecture powering **Sawy Academy**. It covers all **21 Mongoose models**, schema definitions, field types, constraints, default values, compound/TTL indexes, lifecycle pre-hooks, and foreign key relationships.

---

## 1. Database Architectural Overview

The application utilizes **MongoDB** via **Mongoose ORM** (`mongoose@8.19.1`). 

### Core Database Design Principles
1. **Separation of Concerns**: Collections are categorized into 5 distinct domains:
   - **Identity & Device Access Management**: `User`, `Session`, `Device`
   - **LMS & Protected Video/Document Streaming**: `Course`, `CourseGroup`, `Lesson`, `Enrollment`, `VideoAsset`, `VideoProcessingJob`, `DocumentAsset`
   - **Security Auditing & Abuse Prevention**: `VideoAccessFlag`, `HlsKeyAccessLog`
   - **Commerce & Financial Verification**: `Order`, `Cart`, `Product`, `ServiceRequest`
   - **Content Management System (CMS) & Configuration**: `HomePage`, `SiteSettings`, `Project` (Portfolio), `Research`, `Faq`
2. **Strict Sensitive Field Protection**:
   - Critical storage keys (`videoObjectKey`, `documentObjectKey`, `outputPrefix`, `masterPlaylistObjectKey`) and encryption envelopes (`wrappedKey`, `wrapIv`, `authTag`) use `{ select: false }` to prevent unintentional exposure in database serialization.
3. **Automated Lifecycle & TTL Cleanup**:
   - Sessions expire automatically using MongoDB TTL indexes on `expiresAt`.
   - Security audit logs (`HlsKeyAccessLog`) and resolved flags (`VideoAccessFlag`) auto-expire based on configurable retention windows (30-90 days for logs, 180-365 days for flags).
4. **Idempotency & Versioning**:
   - Video and Document assets utilize monotonic generation integers (`generation`) with compound unique constraints (`{ lessonId: 1, generation: 1 }`).

---

## 2. Comprehensive Model Data Dictionary

---

### 2.1 Identity & Access Management

#### 2.1.1 `User`
- **Collection Name**: `users`
- **Purpose**: Accounts for students and platform administrators.
- **Schema & Fields**:

| Field | Type | Required | Default | Description / Constraints |
| :--- | :--- | :---: | :---: | :--- |
| `_id` | `ObjectId` | Auto | Auto | Primary key |
| `name` | `String` | Yes | — | Full name (`trim: true`, min length 2) |
| `email` | `String` | Yes | — | Unique login email (`lowercase: true`, `unique: true`, `trim: true`) |
| `passwordHash` | `String` | Yes | — | Scrypt/Bcrypt salted password hash |
| `role` | `String` | Yes | `"student"` | Enum: `["admin", "student"]` |
| `avatarUrl` | `String` | No | — | Optional profile picture URL |
| `deviceLimit` | `Number` | No | `2` | Max devices allowed for students (`min: 1`, `max: 20`). Admins are unlimited. |
| `createdAt` | `Date` | Auto | `Date.now` | Mongoose timestamp |
| `updatedAt` | `Date` | Auto | `Date.now` | Mongoose timestamp |

- **Indexes**:
  - `email`: Unique Index (`{ email: 1 }`)

---

#### 2.1.2 `Session`
- **Collection Name**: `sessions`
- **Purpose**: Authenticated user sessions bound to a specific physical or browser device.
- **Schema & Fields**:

| Field | Type | Required | Default | Description / Constraints |
| :--- | :--- | :---: | :---: | :--- |
| `_id` | `ObjectId` | Auto | Auto | Primary key |
| `token` | `String` | Yes | — | Unique JWT / Session token string (`unique: true`, `index: true`) |
| `userId` | `ObjectId` | Yes | — | Reference to `User` (`ref: "User"`, `index: true`) |
| `deviceId` | `String` | Yes | — | Identifier of the device bound to this session |
| `lastActiveAt`| `Date` | No | `Date.now` | Last activity timestamp |
| `expiresAt` | `Date` | Yes | — | Session expiration timestamp (TTL index) |
| `createdAt` | `Date` | Auto | `Date.now` | Mongoose timestamp |

- **Indexes**:
  - `token`: Unique Index (`{ token: 1 }`)
  - `userId`: Standard Index (`{ userId: 1 }`)
  - `expiresAt`: TTL Index (`{ expiresAt: 1 }, { expireAfterSeconds: 0 }`)

---

#### 2.1.3 `Device`
- **Collection Name**: `devices`
- **Purpose**: Registered user devices tracking hardware/browser fingerprints and enforcing concurrency limits.
- **Schema & Fields**:

| Field | Type | Required | Default | Description / Constraints |
| :--- | :--- | :---: | :---: | :--- |
| `_id` | `ObjectId` | Auto | Auto | Primary key |
| `userId` | `ObjectId` | Yes | — | Reference to `User` (`ref: "User"`, `index: true`) |
| `deviceId` | `String` | Yes | — | Client-generated or server-assigned UUID string (`index: true`) |
| `label` | `String` | Yes | — | Human-readable name (e.g., "Chrome on Windows 11", "Safari on iPhone") |
| `userAgent` | `String` | No | `""` | Browser User-Agent header string |
| `lastActiveAt`| `Date` | No | `Date.now` | Last time a request was authenticated from this device |
| `createdAt` | `Date` | Auto | `Date.now` | Mongoose timestamp |

- **Indexes**:
  - `userId_1_deviceId_1`: Compound Unique Index (`{ userId: 1, deviceId: 1 }`)

---

### 2.2 LMS & Learning Assets

#### 2.2.1 `Course`
- **Collection Name**: `courses`
- **Purpose**: Educational course catalog containing lessons and related product links.
- **Schema & Fields**:

| Field | Type | Required | Default | Description / Constraints |
| :--- | :--- | :---: | :---: | :--- |
| `_id` | `ObjectId` | Auto | Auto | Primary key |
| `id` | `String` | Yes | — | Business unique string identifier (`unique: true`) |
| `slug` | `String` | Yes | — | URL slug (`unique: true`, auto-generated from `title`) |
| `title` | `String` | Yes | — | Course title |
| `description` | `String` | Yes | — | Detailed course syllabus / summary |
| `level` | `String` | Yes | — | Level name (e.g., "Level 01", "Level 02", "Diploma") |
| `instructor` | `String` | Yes | — | Instructor display name |
| `price` | `String` | Yes | — | Display price formatted string (e.g., `"2,500 EGP"`) |
| `image` | `String` | No | — | Public cover image URL / CDN path |
| `lessons` | `[ObjectId]`| No | `[]` | Ordered array of references to `Lesson` (`ref: "Lesson"`) |
| `relatedProductIds` | `[ObjectId]` | No | `[]` | Recommended materials reference array (`ref: "Product"`) |
| `createdAt` | `Date` | Auto | `Date.now` | Mongoose timestamp |
| `updatedAt` | `Date` | Auto | `Date.now` | Mongoose timestamp |

- **Hooks**:
  - `pre("validate")`: Automatically calculates `slug` via `toSlug(this.title)` if not provided.

---

#### 2.2.2 `CourseGroup`
- **Collection Name**: `coursegroups`
- **Purpose**: Curricula bundling multiple courses into diplomas or sequential levels.
- **Schema & Fields**:

| Field | Type | Required | Default | Description / Constraints |
| :--- | :--- | :---: | :---: | :--- |
| `_id` | `ObjectId` | Auto | Auto | Primary key |
| `title` | `String` | Yes | — | Group title (e.g., "Architecture Diploma 2026") |
| `subtitle` | `String` | Yes | — | Subtitle / description |
| `type` | `String` | Yes | — | Enum: `["diploma", "leveled"]` |
| `image` | `String` | No | — | Cover image URL |
| `courses` | `[ObjectId]`| No | `[]` | Array of references to bundled `Course` models (`ref: "Course"`) |
| `bundlePrice`| `String` | No | — | Discounted bundle price (e.g., `"6,000 EGP"`) |
| `createdAt` | `Date` | Auto | `Date.now` | Mongoose timestamp |
| `updatedAt` | `Date` | Auto | `Date.now` | Mongoose timestamp |

---

#### 2.2.3 `Lesson`
- **Collection Name**: `lessons`
- **Purpose**: Individual lesson modules belonging to a course, linking protected HLS video and PDF documents.
- **Schema & Fields**:

| Field | Type | Required | Default | Description / Constraints |
| :--- | :--- | :---: | :---: | :--- |
| `_id` | `ObjectId` | Auto | Auto | Primary key |
| `id` | `String` | Yes | — | Unique identifier string (`unique: true`) |
| `slug` | `String` | Yes | — | URL slug |
| `title` | `String` | Yes | — | Lesson title |
| `sheetRef` | `String` | Yes | — | Architectural sheet reference identifier (e.g., `"L-01"`, `"S-04"`) |
| `duration` | `String` | Yes | — | Display duration (e.g., `"45 min"`) |
| `order` | `Number` | Yes | — | Display sequence order within the course |
| `summary` | `String` | Yes | — | Brief overview |
| `content` | `String` | Yes | — | Markdown/HTML lecture notes and curriculum text |
| `previewImage` | `String` | No | — | Lesson poster thumbnail |
| `videoAvailable` | `Boolean` | No | `false` | Indicates whether encrypted video is ready for playback |
| `videoAssetId` | `ObjectId` | No | — | Reference to active `VideoAsset` (`ref: "VideoAsset"`, `index: true`) |
| `videoProcessingStatus` | `String` | No | `"none"` | Enum: `["none", "queued", "processing", "ready", "failed"]` |
| `videoProcessingUpdatedAt`| `Date` | No | — | Timestamp of last status change |
| `videoObjectKey` | `String` | No | — | Legacy/Source object key (`select: false`) |
| `videoOriginalFilename` | `String` | No | — | Source video file name (`select: false`) |
| `videoGeneration` | `Number` | No | `0` | Asset replacement generation counter (`select: false`) |
| `videoProcessingError` | `String` | No | — | Safe error string (`select: false`) |
| `videoUrl` | `String` | No | — | Legacy fallback string |
| `documentAvailable` | `Boolean` | No | `false` | Indicates whether private PDF document is attached |
| `documentAssetId` | `ObjectId` | No | — | Reference to active `DocumentAsset` (`ref: "DocumentAsset"`, `index: true`) |
| `documentGeneration` | `Number` | No | `0` | PDF version generation counter (`select: false`) |
| `documentObjectKey` | `String` | No | — | Private R2 key for lesson PDF (`select: false`) |
| `documentOriginalFilename` | `String` | No | — | Uploaded PDF filename (`select: false`) |
| `createdAt` | `Date` | Auto | `Date.now` | Mongoose timestamp |
| `updatedAt` | `Date` | Auto | `Date.now` | Mongoose timestamp |

---

#### 2.2.4 `Enrollment`
- **Collection Name**: `enrollments`
- **Purpose**: Student course enrollment records and lesson completion progress.
- **Schema & Fields**:

| Field | Type | Required | Default | Description / Constraints |
| :--- | :--- | :---: | :---: | :--- |
| `_id` | `ObjectId` | Auto | Auto | Primary key |
| `userId` | `ObjectId` | Yes | — | Enrolled student reference (`ref: "User"`, `index: true`) |
| `courseId` | `ObjectId` | Yes | — | Enrolled course reference (`ref: "Course"`, `index: true`) |
| `orderId` | `ObjectId` | No | — | Associated verified order reference (`ref: "Order"`) |
| `completedLessonIds` | `[ObjectId]` | No | `[]` | Array of completed `Lesson` references (`ref: "Lesson"`) |
| `createdAt` | `Date` | Auto | `Date.now` | Mongoose timestamp |
| `updatedAt` | `Date` | Auto | `Date.now` | Mongoose timestamp |

- **Indexes**:
  - `userId_1_courseId_1`: Compound Unique Index (`{ userId: 1, courseId: 1 }`)

---

### 2.3 Video Processing & Protected Streaming

#### 2.3.1 `VideoAsset`
- **Collection Name**: `videoassets`
- **Purpose**: Encrypted multi-bitrate HLS asset metadata and AES-256-GCM wrapped content key envelopes.
- **Schema & Fields**:

| Field | Type | Required | Default | Description / Constraints |
| :--- | :--- | :---: | :---: | :--- |
| `_id` | `ObjectId` | Auto | Auto | Primary key |
| `lessonId` | `ObjectId` | Yes | — | Parent lesson reference (`ref: "Lesson"`, `index: true`) |
| `courseId` | `ObjectId` | Yes | — | Parent course reference (`ref: "Course"`, `index: true`) |
| `generation` | `Number` | Yes | `1` | Sequential asset version |
| `status` | `String` | Yes | `"uploading"`| Enum: `["uploading", "queued", "processing", "ready", "failed", "superseded"]` (`index: true`) |
| `source` | `Object` | Yes | — | Embedded subdocument containing source details |
| `source.objectKey` | `String` | Yes | — | Private R2 source file path (`select: false`) |
| `source.filename` | `String` | Yes | — | Uploaded filename |
| `source.contentType` | `String` | Yes | — | Mime type (e.g., `"video/mp4"`) |
| `source.sizeBytes` | `Number` | Yes | — | File size in bytes |
| `source.etag` | `String` | No | — | S3/R2 ETag (`select: false`) |
| `outputPrefix` | `String` | Yes | — | Base R2 directory for HLS output (`select: false`) |
| `masterPlaylistObjectKey` | `String` | No | — | Key to `master.m3u8` (`select: false`) |
| `encryption` | `Object` | Yes | — | Cryptographic envelope for AES-128 HLS key |
| `encryption.algorithm` | `String` | Yes | `"AES-128"` | HLS encryption standard |
| `encryption.wrappedKey`| `String` | Yes | — | Base64 AES-256-GCM wrapped DEK (`select: false`) |
| `encryption.wrapIv` | `String` | Yes | — | Initialization Vector (`select: false`) |
| `encryption.authTag` | `String` | Yes | — | GCM Authentication Tag (`select: false`) |
| `encryption.kekVersion`| `String` | Yes | `"v1"` | Key Encryption Key identifier (`select: false`) |
| `media.durationSeconds`| `Number` | No | — | Probed media duration in seconds |
| `media.sourceWidth` | `Number` | No | — | Video resolution width |
| `media.sourceHeight` | `Number` | No | — | Video resolution height |
| `media.videoCodec` | `String` | No | — | Video codec (e.g., `"h264"`) |
| `media.audioCodec` | `String` | No | — | Audio codec (e.g., `"aac"`) |
| `renditions` | `[Object]` | No | `[]` | Array of generated variant streams (`[{ name, width, height, bandwidth, playlistObjectKey }]`) |
| `error.code` | `String` | No | — | Safe error code (e.g., `"TRANSCODE_FAILED"`) |
| `error.message` | `String` | No | — | Error description |
| `error.at` | `Date` | No | — | Error timestamp |
| `readyAt` | `Date` | No | — | Timestamp when asset became ready for streaming |
| `createdAt` | `Date` | Auto | `Date.now` | Mongoose timestamp |
| `updatedAt` | `Date` | Auto | `Date.now` | Mongoose timestamp |

- **Indexes**:
  - `lessonId_1_generation_1`: Compound Unique Index (`{ lessonId: 1, generation: 1 }`)
  - `lessonId_1_createdAt_-1`: Compound Index (`{ lessonId: 1, createdAt: -1 }`)

---

#### 2.3.2 `VideoProcessingJob`
- **Collection Name**: `videoprocessingjobs`
- **Purpose**: Worker task queue for distributed FFmpeg encoding and R2 staging/publishing.
- **Schema & Fields**:

| Field | Type | Required | Default | Description / Constraints |
| :--- | :--- | :---: | :---: | :--- |
| `_id` | `ObjectId` | Auto | Auto | Primary key |
| `assetId` | `ObjectId` | Yes | — | Unique reference to `VideoAsset` (`unique: true`, `index: true`) |
| `lessonId` | `ObjectId` | Yes | — | Associated lesson reference (`index: true`) |
| `status` | `String` | Yes | `"queued"` | Enum: `["queued", "processing", "retry_wait", "completed", "failed"]` (`index: true`) |
| `attempts` | `Number` | No | `0` | Number of transcode attempts performed |
| `maxAttempts` | `Number` | No | `5` | Maximum allowed attempts before permanent failure |
| `availableAt` | `Date` | No | `Date.now` | Timestamp when job is eligible for polling / backoff delay (`index: true`) |
| `lease.ownerId` | `String` | No | — | ID of active processing worker holding the lease |
| `lease.expiresAt` | `Date` | No | — | Lease expiration deadline |
| `lease.heartbeatAt`| `Date` | No | — | Last worker heartbeat timestamp |
| `error.code` | `String` | No | — | Failure error code |
| `error.message` | `String` | No | — | Failure error details |
| `error.at` | `Date` | No | — | Error timestamp |
| `startedAt` | `Date` | No | — | Processing start timestamp |
| `completedAt` | `Date` | No | — | Completion timestamp |
| `createdAt` | `Date` | Auto | `Date.now` | Mongoose timestamp |
| `updatedAt` | `Date` | Auto | `Date.now` | Mongoose timestamp |

- **Indexes**:
  - `status_1_availableAt_1_createdAt_1`: Priority Queue Polling Index
  - `status_1_lease.expiresAt_1`: Lease Recovery Index

---

#### 2.3.3 `DocumentAsset`
- **Collection Name**: `documentassets`
- **Purpose**: Versioned private PDF lesson attachments stored in Cloudflare R2 (`docs/` prefix).
- **Schema & Fields**:

| Field | Type | Required | Default | Description / Constraints |
| :--- | :--- | :---: | :---: | :--- |
| `_id` | `ObjectId` | Auto | Auto | Primary key |
| `lessonId` | `ObjectId` | Yes | — | Parent lesson reference (`ref: "Lesson"`, `index: true`) |
| `courseId` | `ObjectId` | Yes | — | Parent course reference (`ref: "Course"`, `index: true`) |
| `generation` | `Number` | Yes | `1` | Sequential version index |
| `status` | `String` | Yes | `"ready"` | Enum: `["ready", "superseded", "failed"]` (`index: true`) |
| `objectKey` | `String` | Yes | — | Full private R2 key (`select: false`) |
| `filename` | `String` | Yes | — | Original PDF file name |
| `contentType` | `String` | Yes | — | Mime type (`"application/pdf"`) |
| `sizeBytes` | `Number` | Yes | — | Document file size |
| `createdAt` | `Date` | Auto | `Date.now` | Mongoose timestamp |
| `updatedAt` | `Date` | Auto | `Date.now` | Mongoose timestamp |

- **Indexes**:
  - `lessonId_1_generation_1`: Compound Unique Index (`{ lessonId: 1, generation: 1 }`)

---

### 2.4 Security Auditing & Anti-Leech Anomaly Detection

#### 2.4.1 `VideoAccessFlag`
- **Collection Name**: `videoaccessflags`
- **Purpose**: Automated anomaly flags triggered when a student requests video decryption keys from too many distinct IPs within a short time window.
- **Schema & Fields**:

| Field | Type | Required | Default | Description / Constraints |
| :--- | :--- | :---: | :---: | :--- |
| `_id` | `ObjectId` | Auto | Auto | Primary key |
| `userId` | `ObjectId` | Yes | — | Flagged user reference (`ref: "User"`, `index: true`) |
| `deviceId` | `String` | Yes | — | Flagged device identifier |
| `lessonId` | `ObjectId` | Yes | — | Target lesson reference (`ref: "Lesson"`, `index: true`) |
| `assetId` | `ObjectId` | Yes | — | Target video asset reference (`ref: "VideoAsset"`, `index: true`) |
| `reasonCode` | `String` | Yes | — | Enum: `["distinct_ip_threshold"]` |
| `status` | `String` | Yes | `"open"` | Enum: `["open", "in_review", "resolved", "dismissed"]` (`index: true`) |
| `notes` | `String` | No | `""` | Administrator review notes |
| `distinctIpCount` | `Number` | Yes | — | Count of distinct client IPs detected in the window |
| `threshold` | `Number` | Yes | — | Configured threshold trigger value (e.g., 3) |
| `windowMinutes` | `Number` | Yes | — | Rolling evaluation window in minutes (e.g., 15) |
| `firstDetectedAt`| `Date` | Yes | `Date.now` | Earliest anomalous request timestamp |
| `lastDetectedAt` | `Date` | Yes | `Date.now` | Latest anomalous request timestamp (`index: true`) |
| `reviewedAt` | `Date` | No | — | Timestamp of admin resolution |
| `reviewedBy` | `ObjectId` | No | — | Admin user reference (`ref: "User"`) |
| `expiresAt` | `Date` | Yes | +180 days | Document TTL expiration date |
| `createdAt` | `Date` | Auto | `Date.now` | Mongoose timestamp |
| `updatedAt` | `Date` | Auto | `Date.now` | Mongoose timestamp |

- **Indexes**:
  - `userId_1_assetId_1_reasonCode_1`: Compound Unique Index (prevents duplicate open flags for same incident)
  - `status_1_lastDetectedAt_-1`: Admin queue sorting index
  - `userId_1_lastDetectedAt_-1`: User audit history index
  - `expiresAt`: TTL Index (`{ expiresAt: 1 }, { expireAfterSeconds: 0 }`)

---

#### 2.4.2 `HlsKeyAccessLog`
- **Collection Name**: `hlskeyaccesslogs`
- **Purpose**: High-frequency security audit log tracking every HLS key retrieval attempt.
- **Schema & Fields**:

| Field | Type | Required | Default | Description / Constraints |
| :--- | :--- | :---: | :---: | :--- |
| `_id` | `ObjectId` | Auto | Auto | Primary key |
| `userId` | `ObjectId` | Yes | — | Requesting user reference (`ref: "User"`, `index: true`) |
| `sessionId` | `ObjectId` | Yes | — | Requesting session reference (`ref: "Session"`, `index: true`) |
| `deviceId` | `String` | Yes | — | Client device identifier |
| `lessonId` | `ObjectId` | No | — | Lesson reference (`ref: "Lesson"`, `index: true`) |
| `assetId` | `ObjectId` | No | — | Video asset reference (`ref: "VideoAsset"`, `index: true`) |
| `ip` | `String` | Yes | — | Client IP address (sanitized proxy IP) |
| `userAgent` | `String` | No | `""` | User Agent string |
| `outcome` | `String` | Yes | — | Enum: `["success", "denied", "error"]` (`index: true`) |
| `reason` | `String` | Yes | — | Outcome reason code (e.g., `"key_delivered"`, `"DEVICE_MISMATCH"`) |
| `occurredAt` | `Date` | Yes | `Date.now` | Request timestamp (`index: true`) |
| `expiresAt` | `Date` | Yes | +30 days | Auto-cleanup TTL timestamp |

- **Indexes**:
  - `userId_1_occurredAt_-1`: User history query index
  - `userId_1_assetId_1_occurredAt_-1`: Anomaly detection aggregation index
  - `userId_1_deviceId_1_outcome_1_occurredAt_-1`: Abuse pattern analysis index
  - `expiresAt`: TTL Index (`{ expiresAt: 1 }, { expireAfterSeconds: 0 }`)

---

### 2.5 Commerce & Orders

#### 2.5.1 `Order`
- **Collection Name**: `orders`
- **Purpose**: Course and product purchase transactions with InstaPay payment screenshots awaiting admin verification.
- **Schema & Fields**:

| Field | Type | Required | Default | Description / Constraints |
| :--- | :--- | :---: | :---: | :--- |
| `_id` | `ObjectId` | Auto | Auto | Primary key |
| `id` | `String` | Yes | — | Order tracking ID (e.g., `"ORD-20260825-ABCD"`, `unique: true`) |
| `userId` | `ObjectId` | Yes | — | Buyer reference (`ref: "User"`, `index: true`) |
| `userName` | `String` | No | — | Buyer name snapshot |
| `userEmail` | `String` | No | — | Buyer email snapshot |
| `amount` | `Number` | Yes | — | Total monetary amount in EGP (`min: 0`) |
| `status` | `String` | Yes | `"pending"` | Enum: `["pending", "verified", "rejected"]` |
| `paymentScreenshotUrl`| `String` | Yes | — | Private R2 key for InstaPay transfer receipt |
| `reason` | `String` | No | — | Rejection explanation message |
| `items` | `[Object]` | Yes | — | Purchased line items array (validated non-empty) |
| `items.itemId` | `String` | Yes | — | Target product, course, or diploma slug/ID |
| `items.title` | `String` | Yes | — | Item title snapshot |
| `items.quantity` | `Number` | Yes | `1` | Item quantity (`min: 1`) |
| `items.price` | `String` | No | — | Price string snapshot (e.g., `"2,500 EGP"`) |
| `items.kind` | `String` | No | — | Enum: `["product", "course", "diploma"]` |
| `submittedAt` | `Date` | No | `Date.now` | Submission date |
| `createdAt` | `Date` | Auto | `Date.now` | Mongoose timestamp |
| `updatedAt` | `Date` | Auto | `Date.now` | Mongoose timestamp |

---

#### 2.5.2 `Cart`
- **Collection Name**: `carts`
- **Purpose**: Persistent shopping cart for authenticated students across sessions.
- **Schema & Fields**:

| Field | Type | Required | Default | Description / Constraints |
| :--- | :--- | :---: | :---: | :--- |
| `_id` | `ObjectId` | Auto | Auto | Primary key |
| `userId` | `ObjectId` | Yes | — | Owner reference (`ref: "User"`, `unique: true`, `index: true`) |
| `items` | `[Object]` | No | `[]` | Array of cart items |
| `items.id` | `String` | Yes | — | Target item ID |
| `items.name` | `String` | Yes | — | Item name |
| `items.price` | `String` | No | — | Formatted price |
| `items.kind` | `String` | Yes | — | Enum: `["product", "course", "diploma"]` |
| `items.quantity` | `Number` | Yes | `1` | Quantity (`min: 1`) |
| `items.category` | `String` | No | — | Product category or course track |
| `items.image` | `String` | No | — | Item thumbnail URL |
| `createdAt` | `Date` | Auto | `Date.now` | Mongoose timestamp |
| `updatedAt` | `Date` | Auto | `Date.now` | Mongoose timestamp |

---

#### 2.5.3 `Product`
- **Collection Name**: `products`
- **Purpose**: Physical instruments, tools, and architectural publications for sale.
- **Schema & Fields**:

| Field | Type | Required | Default | Description / Constraints |
| :--- | :--- | :---: | :---: | :--- |
| `_id` | `ObjectId` | Auto | Auto | Primary key |
| `id` | `String` | Yes | — | Unique identifier string (`unique: true`) |
| `name` | `String` | Yes | — | Product name |
| `description` | `String` | Yes | — | Specifications and product description |
| `price` | `String` | Yes | — | Formatted price (e.g., `"750 EGP"`) |
| `category` | `String` | Yes | — | Category name |
| `image` | `String` | Yes | — | Main cover image URL |
| `gallery` | `[String]` | No | `[]` | Additional gallery image URLs |
| `createdAt` | `Date` | Auto | `Date.now` | Mongoose timestamp |
| `updatedAt` | `Date` | Auto | `Date.now` | Mongoose timestamp |

---

#### 2.5.4 `ServiceRequest`
- **Collection Name**: `servicerequests`
- **Purpose**: Inquiries for architectural design commissions, academic research collaborations, or device slot increases.
- **Schema & Fields**:

| Field | Type | Required | Default | Description / Constraints |
| :--- | :--- | :---: | :---: | :--- |
| `_id` | `ObjectId` | Auto | Auto | Primary key |
| `name` | `String` | Yes | — | Client or student name |
| `email` | `String` | Yes | — | Contact email |
| `type` | `String` | Yes | — | Service category (e.g., `"design"`, `"research"`, `"device access"`) |
| `status` | `String` | Yes | `"pending"` | Enum: `["pending", "in review", "accepted", "rejected"]` |
| `message` | `String` | No | — | Message summary |
| `details` | `String` | No | — | Formatted breakdown of client requirements |
| `notes` | `String` | No | — | Internal administrator notes |
| `payload` | `Mixed` | No | — | Raw submitted form JSON (including `referenceImageUrls`) |
| `userId` | `ObjectId` | No | — | Optional user reference (`ref: "User"`) |
| `createdAt` | `Date` | Auto | `Date.now` | Mongoose timestamp |
| `updatedAt` | `Date` | Auto | `Date.now` | Mongoose timestamp |

---

### 2.6 CMS & Site Configuration

#### 2.6.1 `Project` (Architectural Portfolio)
- **Collection Name**: `projects`
- **Purpose**: Built projects, architectural competitions, furniture designs, and interiors.
- **Schema & Fields**:

| Field | Type | Required | Default | Description / Constraints |
| :--- | :--- | :---: | :---: | :--- |
| `_id` | `ObjectId` | Auto | Auto | Primary key |
| `id` | `String` | Yes | — | Unique identifier string (`unique: true`) |
| `slug` | `String` | Yes | — | URL slug (`unique: true`, auto-generated from `title`) |
| `sheetRef` | `String` | No | — | Unique drawing sheet reference (e.g., `"A-01"`, `"A-02"`, `unique: true`) |
| `title` | `String` | Yes | — | Project title |
| `category` | `String` | Yes | — | Enum: `["Buildings", "Interiors", "Furniture", "Competitions"]` |
| `year` | `String` | Yes | — | Completion / design year |
| `image` | `String` | Yes | — | Primary cover photograph URL |
| `gallery` | `[String]` | No | `[]` | Project photograph gallery URLs |
| `beforeImage` | `String` | No | — | Optional before image URL (renovations) |
| `afterImage` | `String` | No | — | Optional after image URL (renovations) |
| `aspect` | `String` | No | — | Enum: `["tall", "wide", "square"]` |
| `order` | `Number` | No | `0` | Display sequence order |
| `createdAt` | `Date` | Auto | `Date.now` | Mongoose timestamp |
| `updatedAt` | `Date` | Auto | `Date.now` | Mongoose timestamp |

- **Hooks**:
  - `pre("validate")`: Automatically assigns `slug`, next sequential `sheetRef` (`A-01` format), and sequential `order`.

---

#### 2.6.2 `Research`
- **Collection Name**: `researches`
- **Purpose**: Academic papers, journal articles, books, conference proceedings, and BioGeometry research.
- **Schema & Fields**:

| Field | Type | Required | Default | Description / Constraints |
| :--- | :--- | :---: | :---: | :--- |
| `_id` | `ObjectId` | Auto | Auto | Primary key |
| `id` | `String` | Yes | — | Unique string identifier (`unique: true`) |
| `slug` | `String` | Yes | — | URL slug (`unique: true`, auto-generated from `title`) |
| `title` | `String` | Yes | — | Research paper title |
| `year` | `String` | Yes | — | Publication year |
| `category` | `String` | Yes | — | Enum: `["Published", "Conference", "Ongoing", "Book"]` |
| `venue` | `String` | Yes | — | Journal, conference, or publisher name |
| `abstract` | `String` | Yes | — | Academic abstract text |
| `collaborators`| `String` | No | — | Collaborating researchers or institutions |
| `authors` | `[String]` | No | `[]` | List of author names (normalized and de-duplicated) |
| `publicationDate` | `Date` | No | — | Exact publication date |
| `doi` | `String` | No | — | Digital Object Identifier (normalized without URL prefix) |
| `citation` | `String` | No | — | BibTeX or APA citation string |
| `pdfUrl` | `String` | No | — | External link to public paper PDF (validated HTTP/HTTPS) |
| `externalUrl` | `String` | No | — | External publisher link |
| `keywords` | `[String]` | No | `[]` | Research topic tags |
| `image` | `String` | No | — | Cover figure / diagram URL |
| `figures` | `[String]` | No | `[]` | High-resolution scientific figures array |
| `createdAt` | `Date` | Auto | `Date.now` | Mongoose timestamp |
| `updatedAt` | `Date` | Auto | `Date.now` | Mongoose timestamp |

- **Hooks**:
  - `pre("validate")`: Automatically generates `slug` from `title`.

---

#### 2.6.3 `Faq`
- **Collection Name**: `faqs`
- **Purpose**: Frequently asked questions displayed on the `/faqs` page and footer accordions.
- **Schema & Fields**:

| Field | Type | Required | Default | Description / Constraints |
| :--- | :--- | :---: | :---: | :--- |
| `_id` | `ObjectId` | Auto | Auto | Primary key |
| `id` | `String` | Yes | — | Unique slug identifier (`unique: true`) |
| `question` | `String` | Yes | — | Question text |
| `answer` | `String` | Yes | — | Detailed answer text / markdown |
| `category` | `String` | No | `""` | Category group |
| `published` | `Boolean` | No | `true` | Visibility toggle |
| `order` | `Number` | No | `0` | Display sequence order |
| `createdAt` | `Date` | Auto | `Date.now` | Mongoose timestamp |
| `updatedAt` | `Date` | Auto | `Date.now` | Mongoose timestamp |

- **Hooks**:
  - `pre("validate")`: Auto-generates `id` slug and sequential `order`.

---

#### 2.6.4 `HomePage`
- **Collection Name**: `homepages`
- **Purpose**: Dynamic homepage layout builder configuration storing customizable and reorderable modular sections.
- **Schema & Fields**:

| Field | Type | Required | Default | Description / Constraints |
| :--- | :--- | :---: | :---: | :--- |
| `_id` | `ObjectId` | Auto | Auto | Primary key |
| `key` | `String` | Yes | `"home"` | Singleton key (`unique: true`) |
| `sections` | `[Object]` | No | `[]` | Array of section configurations |
| `sections.id` | `String` | Yes | — | Section identifier (e.g., `"hero"`, `"philosophy"`, `"courses"`) |
| `sections.type` | `String` | Yes | — | Enum: `["hero", "philosophy", "portfolio", "courses", "products", "research", "contact", "custom"]` |
| `sections.enabled`| `Boolean` | No | `true` | Toggle visibility |
| `sections.order` | `Number` | No | `0` | Vertical display order on landing page |
| `sections.content`| `Mixed` | No | `{}` | Section-specific content JSON (headings, CTA labels, copies) |
| `createdAt` | `Date` | Auto | `Date.now` | Mongoose timestamp |
| `updatedAt` | `Date` | Auto | `Date.now` | Mongoose timestamp |

---

#### 2.6.5 `SiteSettings`
- **Collection Name**: `sitesettings`
- **Purpose**: Global platform metadata, typography branding, InstaPay payment details, navigation links, and SEO defaults.
- **Schema & Fields**:

| Field | Type | Required | Default | Description / Constraints |
| :--- | :--- | :---: | :---: | :--- |
| `_id` | `ObjectId` | Auto | Auto | Primary key |
| `key` | `String` | Yes | `"default"` | Singleton key (`unique: true`) |
| `branding` | `Object` | Yes | — | Studio branding configuration |
| `branding.name` | `String` | Yes | `"Dr. Mohamed El Sawy"` | Full brand name |
| `branding.wordmark` | `String` | Yes | `"Sawy"` | Left brand wordmark |
| `branding.wordmarkSuffix` | `String` | No | `"Academy"` | Right brand wordmark |
| `branding.professor` | `String` | Yes | `"Mohamed El Sawy"` | Founder name |
| `branding.professorTitle` | `String` | Yes | `"Associate Professor"` | Founder academic rank |
| `branding.role` | `String` | No | `""` | Role designation |
| `branding.institution` | `String` | No | `""` | University / institution affiliation |
| `branding.affiliation` | `String` | No | `""` | Studio affiliation |
| `branding.tagline` | `String` | No | `""` | Primary studio motto |
| `branding.email` | `String` | No | `""` | Public contact email |
| `branding.phone` | `String` | No | `""` | Landline phone |
| `branding.mobile` | `String` | No | `""` | Mobile / WhatsApp number |
| `branding.address` | `Object` | No | `{}` | Postal address (line1, line2, governorate, country, postal) |
| `branding.officeHours` | `String` | No | `""` | Studio availability hours |
| `branding.established` | `String` | No | `""` | Founding year |
| `branding.footerBlurb` | `String` | No | `""` | Footer editorial description |
| `branding.logoUrl` | `String` | No | `""` | Logo image CDN URL |
| `branding.facebookUrl` | `String` | No | `""` | Facebook page link |
| `branding.instagramUrl` | `String` | No | `""` | Instagram profile link |
| `branding.instapayDestinationType` | `String` | No | `"phone"` | Enum: `["phone", "bank"]` |
| `branding.instapayAccountName` | `String` | No | `"Mohamed El Sawy"` | Recipient name on InstaPay |
| `branding.instapayPhoneNumber` | `String` | No | `"01X XXXX XXXX"` | InstaPay target mobile number |
| `branding.instapayBankName` | `String` | No | `""` | Destination bank name |
| `branding.instapayBankAccountNumber` | `String` | No | `""` | Destination IBAN / Account number |
| `branding.instapayBankAccountName` | `String` | No | `""` | Bank account holder name |
| `branding.instapayInstructions` | `String` | No | `""` | Payment guide text for students |
| `seo` | `Object` | No | — | Global SEO metadata (title, description, ogImageUrl) |
| `navigation.items` | `[Object]` | No | `[]` | Hierarchical header navigation items and dropdowns |
| `footer.links` | `[Object]` | No | `[]` | Footer menu navigation links |
| `pageHeaders` | `Map<String, Object>` | No | `{}` | Per-route header overrides (eyebrow, title, description) |
| `contactPage` | `Object` | No | `{}` | Contact page intro and banner image |
| `servicesPage` | `Object` | No | `{}` | Services page banners (design, research, process steps) |
| `sharedAssetUrls` | `[String]` | No | `[]` | Global media gallery assets |
| `createdAt` | `Date` | Auto | `Date.now` | Mongoose timestamp |
| `updatedAt` | `Date` | Auto | `Date.now` | Mongoose timestamp |

---

## 3. Database Indexes Summary Table

| Collection | Index Keys | Type / Constraint | Purpose |
| :--- | :--- | :--- | :--- |
| `users` | `{ email: 1 }` | Unique | Login uniqueness and fast lookups |
| `sessions` | `{ token: 1 }` | Unique | Session token verification |
| `sessions` | `{ userId: 1 }` | Standard | User active sessions query |
| `sessions` | `{ expiresAt: 1 }` | TTL (`expireAfterSeconds: 0`) | Automatic session expiration |
| `devices` | `{ userId: 1, deviceId: 1 }` | Unique Compound | Device limit enforcement per user |
| `devices` | `{ deviceId: 1 }` | Standard | Device identification |
| `courses` | `{ id: 1 }` / `{ slug: 1 }` | Unique | Public course page routing |
| `lessons` | `{ id: 1 }` | Unique | Lesson business ID routing |
| `lessons` | `{ videoAssetId: 1 }` | Standard | Active video asset pointer |
| `lessons` | `{ documentAssetId: 1 }` | Standard | Active PDF document asset pointer |
| `enrollments` | `{ userId: 1, courseId: 1 }` | Unique Compound | Single enrollment per user per course |
| `videoassets` | `{ lessonId: 1, generation: 1 }` | Unique Compound | Versioned generation uniqueness |
| `videoassets` | `{ lessonId: 1, createdAt: -1 }` | Compound | Fast retrieval of newest video asset |
| `videoassets` | `{ status: 1 }` | Standard | Workflow state queries |
| `videoprocessingjobs` | `{ assetId: 1 }` | Unique | 1:1 Job-to-Asset assignment |
| `videoprocessingjobs` | `{ status: 1, availableAt: 1, createdAt: 1 }` | Compound | Worker task polling priority queue |
| `videoprocessingjobs` | `{ status: 1, "lease.expiresAt": 1 }` | Compound | Stalled lease recovery query |
| `documentassets` | `{ lessonId: 1, generation: 1 }` | Unique Compound | Versioned document generation uniqueness |
| `videoaccessflags` | `{ userId: 1, assetId: 1, reasonCode: 1 }` | Unique Compound | Prevents duplicate open flags for same incident |
| `videoaccessflags` | `{ status: 1, lastDetectedAt: -1 }` | Compound | Admin security review queue |
| `videoaccessflags` | `{ userId: 1, lastDetectedAt: -1 }` | Compound | User security incident history |
| `videoaccessflags` | `{ expiresAt: 1 }` | TTL (`expireAfterSeconds: 0`) | Auto-retention expiry (180 days) |
| `hlskeyaccesslogs` | `{ userId: 1, occurredAt: -1 }` | Compound | User access log audit trail |
| `hlskeyaccesslogs` | `{ userId: 1, assetId: 1, occurredAt: -1 }` | Compound | Real-time IP anomaly detection query |
| `hlskeyaccesslogs` | `{ userId: 1, deviceId: 1, outcome: 1, occurredAt: -1 }` | Compound | Security diagnostic lookups |
| `hlskeyaccesslogs` | `{ expiresAt: 1 }` | TTL (`expireAfterSeconds: 0`) | Auto-retention log cleanup (30 days) |
| `orders` | `{ id: 1 }` | Unique | Human-readable order lookup |
| `orders` | `{ userId: 1 }` | Standard | User order history |
| `carts` | `{ userId: 1 }` | Unique | One shopping cart per user |
| `products` | `{ id: 1 }` | Unique | Catalog lookup |
| `projects` | `{ id: 1 }` / `{ slug: 1 }` / `{ sheetRef: 1 }` | Unique | Architectural portfolio routing |
| `researches` | `{ id: 1 }` / `{ slug: 1 }` | Unique | Academic research catalog routing |
| `faqs` | `{ id: 1 }` | Unique | FAQ accordion lookup |
| `homepages` | `{ key: 1 }` | Unique | Singleton homepage key |
| `sitesettings` | `{ key: 1 }` | Unique | Singleton site settings key |

---

## 4. Database & Storage Maintenance Operations

### 4.1 R2 Orphan & Staging Pruning (`scripts/r2-prune-orphans.js`)
To maintain consistency between MongoDB metadata and Cloudflare R2 object storage, the platform includes automated maintenance tooling:
- **Command**: `node scripts/r2-prune-orphans.js [--dry-run]`
- **Function**:
  1. Queries all active `video-assets/` and `docs/` references from `VideoAsset`, `Lesson`, and `DocumentAsset` collections.
  2. Lists all objects across the private R2 bucket (`sawy-academy-private`).
  3. Detects leftover `staging/` run folders from aborted worker runs or abandoned uploads.
  4. Deletes unreferenced files with batch S3 `DeleteObjectsCommand` calls while preserving all canonical active asset generations.
