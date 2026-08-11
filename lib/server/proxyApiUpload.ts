/**
 * Stream a browser upload to the Express API without the Next.js rewrite
 * buffer (default 10MB). Used for lesson video/PDF so R2 receives the full file.
 */

const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade",
]);

function apiOrigin() {
  return (
    process.env.API_PROXY_TARGET ||
    (process.env.NODE_ENV === "production"
      ? "https://sawy-academy.onrender.com"
      : "http://127.0.0.1:5000")
  ).replace(/\/+$/, "");
}

export async function proxyApiUpload(request: Request, apiPath: string) {
  const headers = new Headers();
  for (const name of [
    "cookie",
    "content-type",
    "content-length",
    "x-device-id",
    "x-csrf-token",
    "authorization",
  ]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  const response = await fetch(`${apiOrigin()}${apiPath}`, {
    method: "POST",
    headers,
    body: request.body,
    duplex: "half",
    redirect: "manual",
  } as RequestInit);

  const outbound = new Headers();
  response.headers.forEach((value, key) => {
    if (!HOP_BY_HOP.has(key.toLowerCase())) {
      outbound.append(key, value);
    }
  });

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: outbound,
  });
}
