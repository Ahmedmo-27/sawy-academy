# Sawy Academy — Database Diagrams & System Data Flows

This document contains visual architectural diagrams for **Sawy Academy**, including the complete **Entity-Relationship Diagram (ERD)**, domain-specific relationship models, and **Data Flow Diagrams (DFDs)** explaining critical business workflows.

---

## 1. Master Entity-Relationship Diagram (ERD)

The following Mermaid diagram depicts all 21 models, foreign key relationships, embedded subdocuments, and cardinality across the platform.

```mermaid
erDiagram
    %% ==========================================
    %% IDENTITY & ACCESS CONTROL
    %% ==========================================
    User ||--o{ Session : "has active"
    User ||--o{ Device : "registers"
    User ||--o{ Enrollment : "enrolls in"
    User ||--o{ Order : "places"
    User ||--o| Cart : "owns"
    User ||--o{ ServiceRequest : "submits"
    User ||--o{ VideoAccessFlag : "flagged on"
    User ||--o{ HlsKeyAccessLog : "generates key logs"
    
    Session ||--o{ HlsKeyAccessLog : "audits"

    User {
        ObjectId _id PK
        string name
        string email UK
        string passwordHash
        string role "admin | student"
        string avatarUrl
        number deviceLimit "1..20"
        date createdAt
        date updatedAt
    }

    Session {
        ObjectId _id PK
        string token UK
        ObjectId userId FK
        string deviceId
        date lastActiveAt
        date expiresAt "TTL Index"
    }

    Device {
        ObjectId _id PK
        ObjectId userId FK
        string deviceId
        string label
        string userAgent
        date lastActiveAt
    }

    %% ==========================================
    %% LMS & LESSON ASSET PIPELINE
    %% ==========================================
    CourseGroup ||--o{ Course : "bundles"
    Course ||--o{ Lesson : "contains"
    Course ||--o{ Enrollment : "enrolled by"
    Course ||--o{ VideoAsset : "owns assets"
    Course ||--o{ DocumentAsset : "owns docs"
    Course ||--o{ Product : "recommends"

    Lesson ||--o| VideoAsset : "active video"
    Lesson ||--o| DocumentAsset : "active document"
    Lesson ||--o{ VideoProcessingJob : "processes"
    Lesson ||--o{ VideoAccessFlag : "subject of flag"
    Lesson ||--o{ HlsKeyAccessLog : "target of log"

    Course {
        ObjectId _id PK
        string id UK
        string slug UK
        string title
        string description
        string level
        string instructor
        string price
        string image
        ObjectId[] lessons FK
        ObjectId[] relatedProductIds FK
    }

    CourseGroup {
        ObjectId _id PK
        string title
        string subtitle
        string type "diploma | leveled"
        string image
        ObjectId[] courses FK
        string bundlePrice
    }

    Lesson {
        ObjectId _id PK
        string id UK
        string slug
        string title
        string sheetRef
        string duration
        number order
        string summary
        string content
        boolean videoAvailable
        ObjectId videoAssetId FK
        string videoProcessingStatus
        boolean documentAvailable
        ObjectId documentAssetId FK
    }

    Enrollment {
        ObjectId _id PK
        ObjectId userId FK
        ObjectId courseId FK
        ObjectId orderId FK
        ObjectId[] completedLessonIds FK
        date createdAt
    }

    VideoAsset {
        ObjectId _id PK
        ObjectId lessonId FK
        ObjectId courseId FK
        number generation
        string status "uploading | queued | processing | ready | failed | superseded"
        object source
        string outputPrefix
        string masterPlaylistObjectKey
        object encryption "AES-128 wrapped envelope"
        object media "duration, dimensions, codecs"
        object[] renditions "1080p, 720p, 480p"
        date readyAt
    }

    VideoProcessingJob {
        ObjectId _id PK
        ObjectId assetId FK,UK
        ObjectId lessonId FK
        string status "queued | processing | retry_wait | completed | failed"
        number attempts
        number maxAttempts
        date availableAt
        object lease "ownerId, expiresAt, heartbeatAt"
    }

    DocumentAsset {
        ObjectId _id PK
        ObjectId lessonId FK
        ObjectId courseId FK
        number generation
        string status "ready | superseded | failed"
        string objectKey
        string filename
        string contentType
        number sizeBytes
    }

    %% ==========================================
    %% SECURITY AUDIT & ABUSE DETECTION
    %% ==========================================
    VideoAccessFlag {
        ObjectId _id PK
        ObjectId userId FK
        string deviceId
        ObjectId lessonId FK
        ObjectId assetId FK
        string reasonCode "distinct_ip_threshold"
        string status "open | in_review | resolved | dismissed"
        number distinctIpCount
        number threshold
        number windowMinutes
        date firstDetectedAt
        date lastDetectedAt
        date expiresAt "TTL Index (180d)"
    }

    HlsKeyAccessLog {
        ObjectId _id PK
        ObjectId userId FK
        ObjectId sessionId FK
        string deviceId
        ObjectId lessonId FK
        ObjectId assetId FK
        string ip
        string outcome "success | denied | error"
        string reason
        date occurredAt
        date expiresAt "TTL Index (30d)"
    }

    %% ==========================================
    %% COMMERCE & ORDERS
    %% ==========================================
    Order ||--o{ Enrollment : "creates upon approval"
    
    Order {
        ObjectId _id PK
        string id UK
        ObjectId userId FK
        string userName
        string userEmail
        number amount
        string status "pending | verified | rejected"
        string paymentScreenshotUrl "private R2 key"
        object[] items
        date submittedAt
    }

    Cart {
        ObjectId _id PK
        ObjectId userId FK,UK
        object[] items
    }

    Product {
        ObjectId _id PK
        string id UK
        string name
        string description
        string price
        string category
        string image
        string[] gallery
    }

    ServiceRequest {
        ObjectId _id PK
        string name
        string email
        string type "design | research | device access"
        string status "pending | in review | accepted | rejected"
        string details
        object payload "includes referenceImageUrls"
        ObjectId userId FK
    }

    %% ==========================================
    %% CMS & SINGLETON CONFIGURATIONS
    %% ==========================================
    Project {
        ObjectId _id PK
        string id UK
        string slug UK
        string sheetRef UK "A-01 format"
        string title
        string category "Buildings | Interiors | Furniture | Competitions"
        string year
        string image
        string[] gallery
        number order
    }

    Research {
        ObjectId _id PK
        string id UK
        string slug UK
        string title
        string year
        string category "Published | Conference | Ongoing | Book"
        string venue
        string abstract
        string[] authors
        string doi
        string pdfUrl
        string externalUrl
        string[] keywords
    }

    Faq {
        ObjectId _id PK
        string id UK
        string question
        string answer
        string category
        boolean published
        number order
    }

    HomePage {
        ObjectId _id PK
        string key UK "home"
        object[] sections
    }

    SiteSettings {
        ObjectId _id PK
        string key UK "default"
        object branding "name, wordmark, InstaPay info"
        object seo "title, description, ogImageUrl"
        object navigation "items"
        object footer "links"
        map pageHeaders
        object contactPage
        object servicesPage
    }
```

---

## 2. Sub-Domain Architectural Diagrams

### 2.1 Identity, Session & Device Concurrency Sub-Domain

```mermaid
graph TD
    subgraph Client
        Browser["Student Browser / App"]
    end

    subgraph Server_Auth["Authentication & Device Engine"]
        JWT["JWT Generator / Verifier"]
        Cookie["HttpOnly sawy_session Cookie"]
        DeviceLimit["Device Limit Evaluator (1-20)"]
    end

    subgraph Database["MongoDB Collections"]
        UserCol[("users")]
        SessionCol[("sessions (TTL)")]
        DeviceCol[("devices")]
    end

    Browser -->|"1. POST /api/auth/login (email, password, deviceId, userAgent)"| Server_Auth
    Server_Auth --> UserCol
    Server_Auth --> DeviceLimit
    DeviceLimit -->|"Count <= user.deviceLimit"| DeviceCol
    Server_Auth -->|"Create Session"| SessionCol
    Server_Auth -->|"Issue Token"| JWT
    JWT -->|"Set-Cookie: sawy_session"| Cookie
    Cookie --> Browser
```

---

### 2.2 LMS & Protected Video Pipeline Sub-Domain

```mermaid
graph LR
    subgraph Course_Hierarchy["Course Hierarchy"]
        CG["CourseGroup<br/>(Diploma / Track)"] -->|Bundles| C["Course<br/>(Level / Subject)"]
        C -->|Contains| L["Lesson<br/>(Lecture Module)"]
    end

    subgraph Video_Pipeline["Video Processing Pipeline"]
        L -->|Active Pointer| VA["VideoAsset<br/>(Encrypted Renditions)"]
        VA -->|1:1 Task| VPJ["VideoProcessingJob<br/>(Worker Lease Queue)"]
    end

    subgraph Document_Pipeline["Document Pipeline"]
        L -->|Active Pointer| DA["DocumentAsset<br/>(Private PDF in R2)"]
    end

    subgraph Storage_Cloudflare["Cloudflare R2 Storage (Private Bucket)"]
        R2Source["video-assets/{cid}/{lid}/{aid}/source/raw.mp4"]
        R2HLS["video-assets/{cid}/{lid}/{aid}/hls/master.m3u8 + segments"]
        R2Docs["docs/{cid}/{lid}/{aid}/lecture.pdf"]
    end

    VA -.-> R2Source
    VA -.-> R2HLS
    DA -.-> R2Docs
```

---

## 3. System Data Flow Diagrams (DFDs)

### 3.1 Data Flow 1: Video Upload, Worker Queue & AES-128 HLS Transcoding

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Platform Admin
    participant API as Express API Server
    participant DB as MongoDB Atlas
    participant R2 as Cloudflare R2 (Private)
    participant Worker as FFmpeg Video Worker Process

    Admin->>API: POST /api/courses/:slug/lessons/:id/video/intent
    API-->>Admin: 200 OK (Upload Grant Token)

    Admin->>API: POST /api/courses/:slug/lessons/:id/video (multipart/form-data)
    Note over API: 1. Generate 16-byte AES-128 DEK<br/>2. Wrap DEK with AES-256-GCM (KEK)<br/>3. Zero plaintext DEK from memory
    API->>R2: Stream source video to video-assets/{cid}/{lid}/{aid}/source/{file}
    API->>DB: Insert VideoAsset (status: 'queued', encryption envelope)
    API->>DB: Insert VideoProcessingJob (status: 'queued', maxAttempts: 5)
    API->>DB: Update Lesson (videoProcessingStatus: 'queued')
    API-->>Admin: 202 Accepted { lessonId, assetId, jobId, status: 'queued' }

    loop Background Worker Polling
        Worker->>DB: Atomically claim job (findOneAndUpdate status='queued' & set lease)
        Worker->>R2: Download source video
        Note over Worker: 1. Unwrap DEK using KEK<br/>2. ffprobe resolution & duration<br/>3. FFmpeg encode 1080p, 720p, 480p<br/>4. Segment into 6s chunks encrypted with AES-128
        Worker->>R2: Upload HLS playlists and .ts segments to staging/{jobId}/
        Worker->>R2: Promote staging to hls/master.m3u8 & variant playlists
        Worker->>DB: Update VideoAsset (status: 'ready', renditions metadata)
        Worker->>DB: Update VideoProcessingJob (status: 'completed')
        Worker->>DB: Update Lesson (videoAvailable: true, videoProcessingStatus: 'ready')
        Worker->>DB: Mark older VideoAsset generations as 'superseded'
    end
```

---

### 3.2 Data Flow 2: Authenticated HLS Playback, Key Delivery & Anomaly Detection

```mermaid
sequenceDiagram
    autonumber
    actor Student as Enrolled Student
    participant Browser as React Video Player (hls.js)
    participant API as Express API Server
    participant Worker as Media Gateway (Cloudflare Worker)
    participant DB as MongoDB Atlas
    participant R2 as Cloudflare R2 (Private)

    Student->>Browser: Open Lesson Page
    Browser->>API: GET /api/lessons/:lessonId/video-access
    Note over API: Verify session, device limit, enrollment & course prerequisites
    API-->>Browser: 200 OK { signedUrl: '/manifest', watermarkText: 'student@domain.com' }

    Browser->>API: GET /api/lessons/:lessonId/manifest
    API->>R2: Fetch master.m3u8
    Note over API: Rewrites variant URIs with HMAC Media Grants & Key URIs
    API-->>Browser: 200 OK (Dynamic m3u8 manifest)

    par Video Segment Requests
        Browser->>Worker: GET https://media.sawy.com/media?grant={mediaGrant}
        Note over Worker: Verify HMAC signature, 5-min TTL, Origin & safe path
        Worker->>R2: Internal R2 binding fetch video segment
        Worker-->>Browser: 200 OK / 206 Partial Content (AES-128 encrypted .ts chunk)
    and Decryption Key Request
        Browser->>API: GET /api/lessons/:lessonId/hls-key?grant={keyGrant}
        Note over API: 1. Verify Origin & Referer headers<br/>2. Verify HMAC key grant & session device<br/>3. Unwrap content key from DB envelope<br/>4. Send 16 raw bytes & immediately zero memory
        API->>DB: Insert HlsKeyAccessLog (ip, outcome: 'success')
        API->>DB: Check distinct IPs for (userId, assetId) in past 15 minutes
        opt Distinct IP count exceeds threshold (e.g., >= 3)
            API->>DB: Upsert VideoAccessFlag (reason: 'distinct_ip_threshold', status: 'open')
        end
        API-->>Browser: 200 OK (16-byte raw AES-128 key)
    end

    Note over Browser: Decrypt .ts chunks in browser memory & render with watermarked student identifier
```

---

### 3.3 Data Flow 3: E-Commerce Checkout, InstaPay Verification & Course Enrollment

```mermaid
sequenceDiagram
    autonumber
    actor Student as Student
    participant App as Next.js Web Application
    participant API as Express API Server
    participant R2 as Cloudflare R2 (Private)
    participant DB as MongoDB Atlas
    actor Admin as Studio Administrator

    Student->>App: Add Course / Diploma to Cart
    App->>API: PUT /api/cart (persist cart items)
    API->>DB: Upsert Cart for userId

    Student->>App: Proceed to Checkout & Pay via InstaPay
    Student->>App: Upload Payment Screenshot (image/jpeg)
    App->>API: POST /api/upload (purpose='payment')
    API->>R2: Save proof to payments/{userObjectId}/{timestamp}-{filename}
    API-->>App: 201 Created { objectKey: 'payments/...' }

    App->>API: POST /api/orders { items, screenshotUrl }
    API->>DB: Create Order (id: 'ORD-YYYYMMDD-XXXX', status: 'pending')
    API-->>App: 201 Created { order }

    Note over Admin: Admin navigates to /admin/orders
    Admin->>API: GET /api/orders (filter: status='pending')
    API->>DB: Query pending orders
    API-->>Admin: 200 OK [ pending orders ]

    Admin->>API: GET /api/orders/:id/payment-screenshot
    API->>R2: Stream payment receipt from private R2
    API-->>Admin: 200 OK (Receipt Image)

    Admin->>API: PATCH /api/orders/:id/approve
    Note over API: 1. Update Order status to 'verified'<br/>2. Resolve Course / Diploma bundled course IDs<br/>3. Upsert Enrollment records for student
    API->>DB: Update Order status='verified'
    API->>DB: Upsert Enrollment (userId, courseId, orderId, completedLessonIds: [])
    API-->>Admin: 200 OK (Verified Order)

    Student->>App: Opens Student Dashboard (/dashboard)
    App->>API: GET /api/enrollments?userId=me
    API->>DB: Query student enrollments populated with course & lesson details
    API-->>App: 200 OK [ Enrolled courses & progress ]
```

---

### 3.4 Data Flow 4: Interactive Lesson Completion & Progress Tracking

```mermaid
sequenceDiagram
    autonumber
    actor Student as Student Player
    participant Rail as LessonCourseRail Component
    participant API as Express API Server
    participant DB as MongoDB Atlas

    Student->>Rail: Click Lesson Checkbox (Mark Complete)
    Rail->>API: POST /api/enrollments/courses/:courseKey/lessons/:lessonKey/complete
    Note over API: 1. Verify authenticated session & device<br/>2. Resolve Course & Lesson by slug or ObjectId<br/>3. Execute $addToSet on completedLessonIds<br/>4. Recalculate completedLesson count & nextLessonSlug
    API->>DB: findOneAndUpdate { userId, courseId }, { $addToSet: { completedLessonIds: lessonId } }
    API-->>Rail: 200 OK { success: true, enrollment }
    Note over Rail: Update progress bar % & highlight next unfinished lesson

    opt Student Unchecks Lesson
        Student->>Rail: Click Lesson Checkbox (Unmark)
        Rail->>API: DELETE /api/enrollments/courses/:courseKey/lessons/:lessonKey/complete
        API->>DB: findOneAndUpdate { userId, courseId }, { $pull: { completedLessonIds: lessonId } }
        API-->>Rail: 200 OK { success: true, enrollment }
        Note over Rail: Recalculate progress percentage in real-time
    end
```
