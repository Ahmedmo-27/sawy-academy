# Sawy Academy

An architectural education and research platform founded by **Dr. Mohamed El Sawy (Associate Professor of Architecture & BioGeometry)**. The platform combines a student LMS, video streaming engine with AES-128 HLS encryption, architectural portfolio showcase, academic research repository, physical instrument shop, and InstaPay e-commerce checkout.

---

## 📚 Technical Documentation Index

Complete and thorough technical documentation is available in the [`docs/`](./docs) directory:

1. **[API Documentation](./docs/API_DOCUMENTATION.md)**:
   - Full REST API specification across all 17 route modules and 40+ endpoints.
   - Authentication protocols (JWT HttpOnly cookies, device concurrency limits, CSRF tokens).
   - Video upload pipeline, transcode queue, and AES-128 HLS playback authorization.
   - Request/response schemas, error envelopes, and rate limiting rules.

2. **[Dashboard Documentation](./docs/DASHBOARD_DOCUMENTATION.md)**:
   - **Admin Dashboard (`/admin`)**: 12 operational modules (Courses & Lessons Manager, Diplomas, Order Verification Queue, Services Queue, Video Security Flags, User Device Limits, Products, Portfolio, Research, FAQs, Homepage Builder, Site Settings).
   - **Student Dashboard (`/dashboard`)**: Course progression tracker, continue learning shortcuts, registered device management, and profile security.

3. **[Database Documentation & Data Dictionary](./docs/DATABASE_DOCUMENTATION.md)**:
   - Exhaustive data dictionary for all **21 Mongoose models**.
   - Types, constraints, default values, compound/TTL indexes, lifecycle pre-hooks, and field security attributes (`select: false`).

4. **[Database Diagrams & Data Flows](./docs/DATABASE_DIAGRAMS.md)**:
   - Visual Mermaid Master Entity-Relationship Diagram (ERD).
   - Sub-domain relationship diagrams (Identity/Access, LMS/Video, Commerce, CMS).
   - Sequence Data Flow Diagrams (DFDs) for Video Transcoding/Streaming, Decryption Key Delivery with Anomaly Detection, and Order Checkout/Enrollment.

5. **[Cloudflare R2 Storage Architecture](./docs/r2-storage-layout.md)**:
   - Dual-bucket storage layout (`sawy-academy-public` vs `sawy-academy-private`).
   - Object key conventions, upload purposes, and verification commands.

6. **[Protected HLS Video Hosting Guide](./docs/r2-video-hosting.md)**:
   - Cryptographic key wrapping (KEK/DEK), FFmpeg multi-bitrate worker, and Cloudflare Worker media gateway.

---

## 🛠 Tech Stack

- **Frontend / Fullstack**: [Next.js 15](https://nextjs.org/) (App Router), [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Tailwind CSS](https://tailwindcss.com/), [Framer Motion](https://www.framer.com/motion/), [GSAP](https://greensock.com/), [Media Chrome](https://github.com/muxinc/media-chrome), [Hls.js](https://github.com/video-dev/hls.js).
- **Backend API**: [Express 5](https://expressjs.com/), [Node.js](https://nodejs.org/), [Mongoose 8](https://mongoosejs.com/).
- **Database**: [MongoDB Atlas](https://www.mongodb.com/atlas) with TTL indexes and compound unique constraints.
- **Storage & CDN**: [Cloudflare R2](https://www.cloudflare.com/developer-platform/r2/) (Dual bucket: Public Marketing CDN + Private Lesson Media).
- **Video Processing**: Standalone Node.js worker with [FFmpeg](https://ffmpeg.org/) and AES-128 HLS chunking.
- **Testing**: [Vitest](https://vitest.dev/) (Unit/Integration) and [Playwright](https://playwright.dev/) (E2E).

---

## 🚀 Quick Start

### 1. Installation
```bash
npm install
```

### 2. Environment Setup
Create a `.env` file from `.env.example`:
```bash
cp .env.example .env
```
Ensure key environment variables are set:
- `MONGODB_URI`
- `JWT_SECRET`
- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`
- `VIDEO_KEY_KEK` (32-byte hex/base64 key-encryption-key)
- `VIDEO_MEDIA_GRANT_SECRET`

### 3. Database Seeding
```bash
npm run seed:admin   # Seeds initial admin user
npm run seed:faqs    # Seeds initial FAQs
npm run seed         # Runs full platform seeder
```

### 4. Running the Development Servers
```bash
# Start Next.js frontend dev server (port 3000)
npm run dev

# Start Express API server in watch mode (port 5000)
npm run dev:api

# Start background FFmpeg video processing worker
npm run worker:video
```

---

## 🧪 Testing & Verification

```bash
# Run unit and API tests
npm test

# Run Cloudflare R2 integration tests
npm run test:r2

# Run Playwright End-to-End browser tests
npm run test:e2e

# Run type check and lint
npm run typecheck
npm run lint
```