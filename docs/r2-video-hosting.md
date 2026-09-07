# Protected HLS lesson-video hosting

Bucket names, public `website-assets/`, private `docs/`, and how they relate to
this HLS tree are defined in [r2-storage-layout.md](./r2-storage-layout.md).
This document remains the source of truth for lesson-video upload, encryption,
Worker playback, and the `video-assets/` object layout below.

## Architecture and data separation

Lesson video sources, encrypted HLS playlists, and encrypted segments live in a
private Cloudflare R2 bucket. MongoDB stores workflow metadata, internal object
keys, rendition metadata, and a wrapped 16-byte AES-128 content key. The
plaintext content key is generated in API memory, wrapped with AES-256-GCM, and
zeroed. It is unwrapped only in the FFmpeg worker and authenticated key endpoint,
then zeroed again.

`VIDEO_KEY_KEK` is a separate 32-byte key-encryption key (KEK), encoded as
base64 or 64 hexadecimal characters. It must not be the R2 secret, JWT secret,
or media-grant secret. MongoDB contains only `wrappedKey`, `wrapIv`, `authTag`,
`algorithm`, and `kekVersion`; it must never contain either plaintext key.
Back up every KEK version still referenced by an asset before rotating it.
Current code reads one active KEK, so rewrapping old envelopes is required
before retiring the previous key.

Object layout:

- `video-assets/{courseId}/{lessonId}/{assetId}/source/{safeFilename}`
- `video-assets/{courseId}/{lessonId}/{assetId}/staging/{jobId}/{runId}/...`
- `video-assets/{courseId}/{lessonId}/{assetId}/hls/master.m3u8`
- `video-assets/{courseId}/{lessonId}/{assetId}/hls/{rendition}/...`

The browser receives academy API paths and short HMAC grants, never R2
credentials, bucket names, S3 endpoints, internal object keys, or presigned R2
URLs. Admin status responses also omit playlist object keys.

## Upload, processing, and admin statuses

`POST /api/courses/:slug/lessons/:lessonId/video` is an authenticated,
registered-device, admin-only multipart upload (`video`). It accepts one MP4,
WebM, Ogg, or QuickTime file up to `VIDEO_UPLOAD_MAX_BYTES` (default 2 GiB).
The API creates a new immutable asset generation, wraps its content key, streams
the source to private R2, creates one unique processing job, and returns HTTP
202 with `lessonId`, `assetId`, `jobId`, `generation`, and `status: "queued"`.
Temporary upload files are removed on success and failure; partial database/R2
state is rolled back where possible.

Asset statuses are `uploading`, `queued`, `processing`, `ready`, `failed`, and
`superseded`. Job statuses are `queued`, `processing`, `retry_wait`,
`completed`, and `failed`. Lesson-facing processing status is `none`, `queued`,
`processing`, `ready`, or `failed`.

The FFmpeg worker claims one available job atomically, increments `attempts`,
and owns a time-limited lease. Heartbeats extend only an unexpired lease owned
by that worker. It downloads the source, validates it with ffprobe, creates
source-aware 1080p/720p/480p renditions without upscaling (or one even-sized
source rendition below 480p), and emits six-second AES-128 HLS VOD segments.
Files upload to a run-specific staging prefix. Publication copies the master
playlist last, then marks the asset ready. A ready asset is idempotently
recognized on a retried job, and older ready generations become `superseded`.

`GET /api/courses/:slug/lessons/:lessonId/video/status` is admin-only and
returns public workflow fields: asset/generation status, attempts, maximum
attempts, next availability, safe error data, public rendition dimensions and
bandwidth, and ready time. `POST .../video/retry` accepts only a failed asset
and failed job, resets attempts, and queues it with HTTP 202. Concurrent retry
requests are guarded by a conditional update and receive HTTP 409 after the
first succeeds.

## Student playback and endpoint checks

Every academy playback endpoint authenticates the current Session record, so
logout, session revocation, expiry, and device removal stop new requests.
`requireDevice` also requires the request device to equal the session device
and verifies that it is still registered.

- `GET /api/lessons/:lessonId/video-access` applies authentication,
  session-device verification, the per-user limiter, lesson lookup, parent
  course lookup, admin-or-enrollment authorization, leveled-course prerequisite
  rules, and ready asset/course/lesson binding. It returns only the same-origin
  manifest endpoint, bounded expiry metadata, and watermark text.
- `GET /api/lessons/:lessonId/manifest` repeats those checks. It validates the
  canonical asset prefix, reads at most 1 MiB, rejects absolute, encoded,
  queried, fragmented, backslash, NUL, traversal, wrong-extension, and unknown
  rendition URIs, and rewrites all playlist references. Responses are private,
  non-cacheable, and vary by credentials/device.
- `GET /api/lessons/:lessonId/hls-key` repeats access policy, requires an exact
  configured `Origin` or Referer origin, validates an unexpired HMAC grant, and
  matches scope, user, session, device, course, lesson, asset, and generation.
  It authenticates the AES-GCM envelope and returns exactly 16 bytes with
  `private, no-store`. Success, denial, and errors are audited without logging
  the grant or key.
- `GET|HEAD https://media.example.com/media?grant=...` is handled by the
  Cloudflare Worker. It requires the exact allowed academy origin, verifies the
  signature and maximum five-minute claim lifetime, validates every claim and
  media path, constructs the private R2 key internally, supports conditional
  and Range requests, and returns generic errors. `OPTIONS` supplies restricted
  CORS; other methods are rejected.

Media/key grants default to `VIDEO_MEDIA_GRANT_TTL_SECONDS=90` and are capped at
300 seconds. Already-issued encrypted segment grants can remain usable until
their short expiry after revocation; new manifests and keys require a live
session. The API limiter permits 12 video-access requests per user per 60
seconds per process. Use a distributed edge/store-backed limiter when running
multiple API replicas.

## Cloudflare Worker and private R2 deployment

Deploy `workers/media-gateway` as a Worker with the `VIDEO_BUCKET` R2 binding.
The binding must point to the private lesson-video bucket. The Worker needs no
R2 API key because bindings provide private service access. Set
`MEDIA_ALLOWED_ORIGIN` to the exact academy web origin (no path), and set the
HMAC secret with:

```sh
cd workers/media-gateway
npm install
npx wrangler secret put VIDEO_MEDIA_GRANT_SECRET
npm run check
npm test
npx wrangler deploy --dry-run
npx wrangler deploy
```

Attach a dedicated HTTPS custom domain such as `media.example.com` to the
Worker, then set the API's `VIDEO_MEDIA_BASE_URL` to that origin. Do not point
the custom domain directly at R2. Disable the bucket's public `r2.dev` URL and
do not create another public bucket domain. Bucket CORS is not the browser
boundary in this architecture—the Worker supplies CORS—but keep the bucket
private and least-privileged.

After changing bindings, run `npm run types` and review
`worker-configuration.d.ts`. Keep `wrangler.jsonc` bucket names and production
origins environment-specific; never put secrets in Wrangler vars or source
control.

## API and FFmpeg worker configuration

Required API/processing secrets and values:

- `MONGODB_URI`, `JWT_SECRET`
- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`,
  `R2_BUCKET_NAME` for API uploads and the external FFmpeg worker (private
  lesson bucket). Optional public marketing bucket:
  `R2_PUBLIC_BUCKET_NAME`, `R2_PUBLIC_BASE_URL` — see
  [r2-storage-layout.md](./r2-storage-layout.md).
- `VIDEO_KEY_KEK`, `VIDEO_KEY_KEK_VERSION`
- `VIDEO_MEDIA_GRANT_SECRET` (same value as the media Worker secret)
- `VIDEO_MEDIA_BASE_URL`, `VIDEO_ALLOWED_ORIGINS`
- `ALLOWED_ORIGINS`, and explicit `TRUST_PROXY` values when behind known proxies

The FFmpeg worker is a long-running Node process started with
`npm run worker:video`. Deploy it on a host/container with persistent outbound
access to MongoDB and R2, enough temporary disk for the source plus all
renditions, and `ffmpeg`/`ffprobe` installed. Configure alternate binaries with
`FFMPEG_PATH` and `FFPROBE_PATH`. Do not run it in a request-limited serverless
function. Run one or more workers; Mongo leases serialize claims.

Operational tuning:

- `VIDEO_WORKER_ID`, `VIDEO_WORKER_LEASE_MS`,
  `VIDEO_WORKER_HEARTBEAT_MS` (must be shorter than the lease),
  `VIDEO_WORKER_POLL_MS`, and `VIDEO_WORKER_MAX_ATTEMPTS`
- `VIDEO_WORKER_RETRY_BASE_MS` and `VIDEO_WORKER_RETRY_MAX_MS` for bounded
  exponential retry delay
- `VIDEO_R2_UPLOAD_CONCURRENCY` and `VIDEO_UPLOAD_MAX_BYTES`
- `VIDEO_ACCESS_DISTINCT_IP_THRESHOLD`,
  `VIDEO_ACCESS_DISTINCT_IP_WINDOW_MINUTES`,
  `VIDEO_ACCESS_LOG_RETENTION_DAYS`, and
  `VIDEO_ACCESS_FLAG_RETENTION_DAYS`

Configure `TRUST_PROXY` only with explicit trusted proxy addresses/ranges.
Key-anomaly IP detection uses Express `req.ip`; a permissive proxy setting lets
clients spoof it. Thresholds are bounded to 2–20 distinct successful key IPs
over 1–120 minutes. Access logs expire after 1–90 days and review flags after
7–365 days. Threshold flags are idempotent per user/asset/reason. Admins can
review flags, update status/notes, revoke all user sessions, and remove a device
(which also revokes that device's sessions).

## Operations and recovery

Monitor queued/retry age, lease expiry, attempt counts, failed assets, staging
growth, R2/API errors, FFmpeg stderr, disk space, key-audit persistence errors,
and open anomaly flags. Transient errors enter `retry_wait` with exponential
backoff; invalid media and missing assets fail permanently. Expired leases are
conditionally recovered, preventing two workers from updating the same lease.
The manual retry endpoint is for investigated terminal failures.

Staging prefixes are cleaned after each attempt. Failed pre-publication output
is deleted. If a process is killed during cleanup, use a lifecycle/maintenance
job to remove old `staging/` prefixes that do not belong to active leases.
Preserve source objects until the asset retention policy explicitly deletes
them. Test KEK restoration and Mongo/R2 recovery together.

## Browser verification and protection boundary

The React player uses hls.js/MSE where supported, producing a browser `blob:`
attachment, and native HLS where the engine exposes it. Playwright runs
Chromium, Firefox, and WebKit coverage. Playwright WebKit is a WebKit engine
test in this environment; it is not a claim of testing real Safari, iOS,
Apple hardware, or FairPlay. Perform separate manual Safari/iOS validation
before release, especially native HLS, seeking, cookies, CORS, and fullscreen.

This design protects against direct bucket download, casual link sharing, and
plain R2/presigned URL exposure in browser developer tools. Short grants,
session/device/course/lesson/generation checks, origin checks, encryption,
watermarking, and audit flags raise the cost of extraction and detect
multi-IP key abuse.

It cannot stop screen recording, camera capture, a skilled user capturing
encrypted segments plus a legitimately delivered key, in-process browser
instrumentation, or plaintext capture after decryption. Origin/Referer checks
are defense in depth, not proof of browser identity. This is not DRM and
provides neither Widevine nor FairPlay. `controlsList`, context-menu blocking,
drag blocking, and watermarks are deterrents, not cryptographic controls.

## Legacy migration

The legacy `videoUrl` field remains for migration, but the protected player does
not consume YouTube IDs or URLs. Existing lessons need an administrator-owned
source upload or a separately approved importer. No automatic third-party video
download is assumed.
