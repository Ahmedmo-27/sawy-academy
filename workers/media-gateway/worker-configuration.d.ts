// Runtime types come from @cloudflare/workers-types. Regenerate binding declarations
// after changing wrangler.jsonc with: npm run types
/// <reference types="@cloudflare/workers-types" />

interface Env {
  VIDEO_BUCKET: R2Bucket;
  MEDIA_ALLOWED_ORIGIN: string;
  VIDEO_MEDIA_GRANT_SECRET: string;
}
