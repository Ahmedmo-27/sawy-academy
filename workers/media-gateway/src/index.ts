export const MAX_GRANT_LIFETIME_SECONDS = 300;
const SAFE_ID = /^[a-f0-9]{24}$/;
const SAFE_DEVICE = /^[^\u0000-\u001F\u007F]{1,200}$/u;
const SAFE_MEDIA_PATH =
  /^(?!\/)(?!.*(?:^|\/)\.\.(?:\/|$))(?!.*[\\\0])(?:[A-Za-z0-9._-]+\/)*[A-Za-z0-9._-]+\.(?:ts|m4s|mp4|aac)$/i;

type MediaClaims = {
  v: 1;
  scope: "media";
  uid: string;
  sid: string;
  did: string;
  cid: string;
  lid: string;
  aid: string;
  gen: number;
  exp: number;
  path: string;
};

function textResponse(status: number, message: string, headers?: HeadersInit) {
  return new Response(message, {
    status,
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Type": "text/plain; charset=utf-8",
      ...headers,
    },
  });
}

export function decodeBase64Url(value: string): Uint8Array {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) throw new Error("Invalid encoding");
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

export function encodeBase64Url(value: Uint8Array): string {
  let binary = "";
  for (const byte of value) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function constantTimeEqual(left: Uint8Array, right: Uint8Array): boolean {
  let difference = left.length ^ right.length;
  const length = Math.max(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    difference |= (left[index % left.length] ?? 0) ^ (right[index % right.length] ?? 0);
  }
  return difference === 0;
}

export function isClaims(
  value: unknown,
  nowSeconds = Math.floor(Date.now() / 1000)
): value is MediaClaims {
  if (!value || typeof value !== "object") return false;
  const claim = value as Record<string, unknown>;
  return (
    claim.v === 1 &&
    claim.scope === "media" &&
    typeof claim.uid === "string" &&
    SAFE_ID.test(claim.uid) &&
    typeof claim.sid === "string" &&
    SAFE_ID.test(claim.sid) &&
    typeof claim.did === "string" &&
    SAFE_DEVICE.test(claim.did) &&
    typeof claim.cid === "string" &&
    SAFE_ID.test(claim.cid) &&
    typeof claim.lid === "string" &&
    SAFE_ID.test(claim.lid) &&
    typeof claim.aid === "string" &&
    SAFE_ID.test(claim.aid) &&
    Number.isSafeInteger(claim.gen) &&
    Number(claim.gen) >= 1 &&
    Number.isSafeInteger(claim.exp) &&
    Number(claim.exp) > nowSeconds &&
    Number(claim.exp) <= nowSeconds + MAX_GRANT_LIFETIME_SECONDS &&
    typeof claim.path === "string" &&
    SAFE_MEDIA_PATH.test(claim.path)
  );
}

export async function verifyGrant(
  token: string,
  secret: string,
  nowSeconds = Math.floor(Date.now() / 1000)
): Promise<MediaClaims> {
  if (new TextEncoder().encode(secret).byteLength < 32) {
    throw new Error("Grant secret is not configured securely");
  }
  const parts = token.split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw new Error("Invalid grant");
  }
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const expected = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(parts[0]))
  );
  const supplied = decodeBase64Url(parts[1]);
  if (
    encodeBase64Url(supplied) !== parts[1] ||
    !constantTimeEqual(expected, supplied)
  ) {
    throw new Error("Invalid grant");
  }

  const payload = decodeBase64Url(parts[0]);
  if (encodeBase64Url(payload) !== parts[0]) throw new Error("Invalid grant");
  const parsed: unknown = JSON.parse(
    new TextDecoder("utf-8", { fatal: true }).decode(payload)
  );
  if (!isClaims(parsed, nowSeconds)) throw new Error("Invalid grant claims");
  return parsed;
}

export function sourceOrigin(request: Request): string {
  const origin = request.headers.get("Origin");
  if (origin) return origin.replace(/\/+$/, "");
  const referer = request.headers.get("Referer");
  if (!referer) return "";
  try {
    return new URL(referer).origin;
  } catch {
    return "";
  }
}

export function corsHeaders(origin: string) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
    "Access-Control-Allow-Headers": "Range, If-Match, If-None-Match, If-Modified-Since, If-Unmodified-Since",
    "Access-Control-Expose-Headers": "Accept-Ranges, Content-Length, Content-Range, ETag",
    "Access-Control-Max-Age": "600",
    Vary: "Origin",
  };
}

export function contentType(mediaPath: string): string {
  const extension = mediaPath.slice(mediaPath.lastIndexOf(".")).toLowerCase();
  return (
    {
      ".ts": "video/mp2t",
      ".m4s": "video/iso.segment",
      ".mp4": "video/mp4",
      ".aac": "audio/aac",
    }[extension] || "application/octet-stream"
  );
}

export async function handleMedia(request: Request, env: Env): Promise<Response> {
  const allowedOrigin = env.MEDIA_ALLOWED_ORIGIN.replace(/\/+$/, "");
  const requestOrigin = sourceOrigin(request);
  if (!allowedOrigin || requestOrigin !== allowedOrigin) {
    return textResponse(403, "Forbidden");
  }
  const cors = corsHeaders(allowedOrigin);
  const url = new URL(request.url);
  if (url.pathname !== "/media") return textResponse(404, "Not found", cors);
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (request.method !== "GET" && request.method !== "HEAD") {
    return textResponse(405, "Method not allowed", { ...cors, Allow: "GET, HEAD, OPTIONS" });
  }

  let claims: MediaClaims;
  try {
    claims = await verifyGrant(url.searchParams.get("grant") || "", env.VIDEO_MEDIA_GRANT_SECRET);
  } catch {
    return textResponse(403, "Forbidden", cors);
  }

  const objectKey =
    `video-assets/${claims.cid}/${claims.lid}/${claims.aid}/hls/${claims.path}`;
  const object = await env.VIDEO_BUCKET.get(objectKey, {
    onlyIf: request.headers,
    range: request.headers,
  });
  if (!object) return textResponse(404, "Not found", cors);
  if (!("body" in object)) {
    const status =
      request.headers.has("If-None-Match") ||
      request.headers.has("If-Modified-Since")
        ? 304
        : 412;
    return new Response(null, { status, headers: cors });
  }

  const headers = new Headers(cors);
  object.writeHttpMetadata(headers);
  headers.set("Accept-Ranges", "bytes");
  headers.set("Content-Type", contentType(claims.path));
  headers.set("ETag", object.httpEtag);
  headers.set(
    "Cache-Control",
    `private, max-age=${Math.max(0, claims.exp - Math.floor(Date.now() / 1000))}, must-revalidate`
  );
  let status = 200;
  const objectRange = object.range;
  if (
    objectRange &&
    "offset" in objectRange &&
    "length" in objectRange &&
    typeof objectRange.offset === "number" &&
    typeof objectRange.length === "number"
  ) {
    status = 206;
    const end = objectRange.offset + objectRange.length - 1;
    headers.set("Content-Range", `bytes ${objectRange.offset}-${end}/${object.size}`);
    headers.set("Content-Length", String(objectRange.length));
  } else {
    headers.set("Content-Length", String(object.size));
  }
  return new Response(request.method === "HEAD" ? null : object.body, {
    status,
    headers,
  });
}

export default {
  async fetch(request, env): Promise<Response> {
    try {
      return await handleMedia(request, env);
    } catch {
      return textResponse(500, "Media unavailable");
    }
  },
} satisfies ExportedHandler<Env>;
