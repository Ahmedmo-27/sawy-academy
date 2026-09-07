# R2 storage directory layout

Two Cloudflare R2 buckets separate public marketing media from private lesson
content. Object keys for course-bound private files use MongoDB ObjectIds, not
human titles or URL slugs. HLS video path details and playback security live in
[r2-video-hosting.md](./r2-video-hosting.md); this document is the convention
for bucket names, prefixes, and what must not go where.

## Buckets

| Bucket (logical name) | Env / binding | Access | Contents |
|-----------------------|---------------|--------|----------|
| `sawy-academy-public` | `R2_PUBLIC_BUCKET_NAME` + `R2_PUBLIC_BASE_URL` (CDN / custom domain) | Public read via CDN or custom domain; write via API credentials only | Marketing images under `website-assets/` |
| `sawy-academy-private` | `R2_BUCKET_NAME`; media Worker `VIDEO_BUCKET` binding | Private; disable public `r2.dev`; API and Worker only | Lesson video under `video-assets/`; lesson PDFs under `docs/`; payment proofs under `payments/` |

Shared credentials for both buckets: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`,
`R2_SECRET_ACCESS_KEY`. Config helpers live in `lib/r2Config.js`. Object key
builders live in `lib/r2ObjectKeys.js`.

Upload entry points:

- CMS `purpose=website-asset` → public `website-assets/` via `POST /api/upload`
- Checkout `purpose=payment` → private `payments/{userObjectId}/…`
- Service form `purpose=service-reference` + `guestName` → private
  `service-references/guest-{name}/…` (no login required)
- Legacy `purpose=local` → disk `/uploads` (avoid for new features)
- Lesson video → private `video-assets/` (existing admin upload)
- Lesson PDF → private `docs/` via `POST /api/courses/:slug/lessons/:lessonId/document`

Do **not** put raw lesson MP4s, HLS segments, or lesson PDFs in the public
bucket.

## Key rules (all prefixes)

- Prefer stable MongoDB ObjectIds for course, lesson, project, product,
  research, and versioned asset folders.
- Never bake course titles, lesson titles, or free-form display names into
  object keys (titles and slugs change; IDs do not).
- Sanitize uploaded filenames before the final path segment (alphanumeric,
  dash, underscore, and a safe extension only).
- Admin UIs may browse by title, but they must resolve to ObjectId keys
  internally.

## 1. Public: `website-assets/`

Human-readable **page** folders match site route names. Entity-specific media
under a page uses ObjectId subfolders when tied to a database record. Store the
full public URL (CDN origin + object key) in existing CMS string fields
(`image`, `heroImageUrl`, `designImageUrl`, and similar).

```
website-assets/
  home/
    hero.{ext}
    section-{key}.{ext}
  courses/
    listing-hero.{ext}
    {courseObjectId}/cover.{ext}
  services/
    design.{ext}
    research.{ext}
    process-brief.{ext}
    process-review.{ext}
    process-delivery.{ext}
  portfolio/
    {projectObjectId}/cover.{ext}
    {projectObjectId}/gallery/{n}.{ext}
  products/
    {productObjectId}/cover.{ext}
    {productObjectId}/gallery/{n}.{ext}
  researches/
    {researchObjectId}/cover.{ext}
    {researchObjectId}/figures/{n}.{ext}
  branding/
    logo.{ext}
    og-default.{ext}
  shared/
    ...
```

Rules:

- Page folders are route slugs (`home`, `courses`, `services`, …), not free-form
  titles such as `home page`.
- Prefer opaque or timestamped filenames on upload when collisions matter.

## 2. Private: `docs/`

Enrollment-gated lesson documents (PDF). Admin uploads from Lessons manager.
Students download via `GET /api/lessons/:lessonId/document` (auth + enrollment).
MongoDB holds `objectKey`, original filename, mime, size, and status
(`DocumentAsset` + Lesson flags).

```
docs/
  {courseObjectId}/
    {lessonObjectId}/
      {assetId}/
        {safeFilename}.pdf
```

Rules:

- One immutable generation per `assetId`. A replacement PDF creates a new
  `assetId`; the previous generation is marked superseded in MongoDB.
- Browser never sees long-lived R2 URLs or raw object keys.
- Allowed types initially: PDF only.

## 3. Private: `payments/`

Checkout InstaPay proofs. Keys use the authenticated user's ObjectId (not
display names):

```
payments/
  {userObjectId}/
    {timestamp}-{random}-{safeFilename}.jpg
```

`POST /api/upload` with `purpose=payment` writes here. Orders store the object
key; viewers load `GET /api/orders/:id/payment-screenshot` (owner or admin).

## 3b. Private: `service-references/`

Design-service reference images. Guests do **not** need to sign in. Files are
keyed from the design request **name** field:

```
service-references/
  guest-{safeName}/
    {timestamp}-{random}-{safeFilename}.jpg
```

Example: name `Jane Doe` → `service-references/guest-Jane-Doe/...`

`POST /api/upload` with `purpose=service-reference` and `guestName` (no auth).
Requests store object keys in `payload.referenceImageUrls`; viewers load
`GET /api/services/:id/reference-images/:index` (owner email or admin).
Submit validation requires keys to match `guest-{name}` from the same form.

## 4. Private: `video-assets/`

Canonical HLS and source layout (implemented). Do not introduce a parallel
public `videos/{title}/lesson.mp4` tree. Full upload, processing, Worker, and
playback behavior: [r2-video-hosting.md](./r2-video-hosting.md).

```
video-assets/
  {courseObjectId}/
    {lessonObjectId}/
      {assetId}/
        source/{safeFilename}
        staging/{jobId}/{runId}/...
        hls/master.m3u8
        hls/{rendition}/...
```

Video key builders live in `lib/videoAccess.js` (`buildVideoAssetSourceKey`,
`buildVideoAssetOutputPrefix`). Website and docs builders live in
`lib/r2ObjectKeys.js`. Students play HLS via academy APIs and the media
gateway Worker; they never download the raw `source/` object through a public
CDN.

The legacy helper `videos/{courseId}/{lessonId}/...` (`buildVideoObjectKey`)
must not be used for new uploads.

## Sketch → adopted mapping

| Explorer-style sketch | Adopted key |
|-----------------------|-------------|
| `website-assets/home page/...` | `website-assets/home/...` on the **public** bucket |
| `docs/course 1/lesson 1.pdf` | `docs/{courseObjectId}/{lessonObjectId}/{assetId}/{safeFilename}.pdf` on the **private** bucket |
| `videos/course 1/lesson 1.mp4` | `video-assets/{courseObjectId}/{lessonObjectId}/{assetId}/source/{safeFilename}` on the **private** bucket |
| `payments/user 1/payment1.jpg` | `payments/{userObjectId}/{timestamp}-{random}-{safeFilename}.jpg` on the **private** bucket |
| `service-references/…` | `service-references/guest-{safeName}/…` on the **private** bucket |

## Do not

- Put lesson PDFs, payment proofs, service reference images, or lesson video
  (source or HLS) in the public bucket.
- Use course/lesson/user titles or spaces in private object keys.
- Expose private bucket names, S3 endpoints, internal keys, or long-lived
  presigned URLs to the browser for lesson or payment content.
- Point a public custom domain directly at the private lesson bucket.
- Treat research catalog `pdfUrl` (public CMS URL string) as the same system
  as private lesson `docs/` without an explicit product decision.

## How to verify both buckets

Token needs Object Read + Write on **both** buckets. `npm test` stays offline.

```sh
npm run r2:check                 # env + HeadBucket readiness
npm run test:r2                  # live put/get/CDN/isolation (skips if env missing)
npm run r2:smoke-video           # tiny MP4 through the course upload + one FFmpeg job
npm run r2:smoke-video:upload-only
npm run r2:smoke-cleanup         # delete recorded smoke objects and Mongo records
```

Smoke and integration runs **keep** R2 objects (and the ephemeral `[R2 SMOKE]` course) until `r2:smoke-cleanup`. Keys and Mongo ids are appended to `tmp/r2-smoke-manifest.json`.

Expected:

- Public CDN `GET {R2_PUBLIC_BASE_URL}/website-assets/...` returns 200.
- Private `video-assets/`, `docs/`, `payments/`, and `service-references/` objects are reachable via the S3 API only and return 401/403/404 from the public origin.

## Still out of scope

- Migrating historical `/uploads` CMS images into `website-assets/`.
- Public-assets Worker (optional); CDN custom domain on the public bucket is
  enough for marketing images.
- Wiring `branding.logoUrl` / `seo.ogImageUrl` into the live Next.js layout
  (fields and admin uploads exist; front-end consumption may still use
  defaults).
