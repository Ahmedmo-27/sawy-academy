import type { ApiResponse } from "@/lib/api/types";

interface RequestOptions {
  query?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown | FormData;
}

export class ApiClientError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
  }
}

function withQuery(path: string, query?: RequestOptions["query"]) {
  if (!query) return path;

  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  });

  const queryString = params.toString();
  return queryString ? `${path}?${queryString}` : path;
}

function getErrorMessage<T>(payload: ApiResponse<T>, fallback: string) {
  if (typeof payload.error === "string") return payload.error;
  return payload.error?.message ?? fallback;
}

async function request<T>(
  path: string,
  method: string,
  options: RequestOptions = {}
) {
  let body: BodyInit | undefined;
  let headers: HeadersInit | undefined = { "Content-Type": "application/json" };

  if (options.body instanceof FormData) {
    body = options.body;
    headers = undefined;
  } else if (options.body !== undefined) {
    body = JSON.stringify(options.body);
  }

  const response = await fetch(withQuery(path, options.query), {
    method,
    headers,
    body,
  });

  const payload = (await response.json().catch(() => null)) as
    | ApiResponse<T>
    | null;

  if (!response.ok || !payload?.success) {
    throw new ApiClientError(
      payload ? getErrorMessage(payload, "Request failed.") : "Request failed.",
      response.status
    );
  }

  return payload.data as T;
}

export function apiGet<T>(
  path: string,
  query?: RequestOptions["query"]
) {
  return request<T>(path, "GET", { query });
}

export function apiPost<T>(path: string, body?: RequestOptions["body"]) {
  return request<T>(path, "POST", { body });
}

export function apiPut<T>(path: string, body?: RequestOptions["body"]) {
  return request<T>(path, "PUT", { body });
}

export function apiPatch<T>(path: string, body?: RequestOptions["body"]) {
  return request<T>(path, "PATCH", { body });
}

export function apiDelete<T>(path: string) {
  return request<T>(path, "DELETE");
}

export function apiUpload<T>(path: string, formData: FormData) {
  return request<T>(path, "POST", { body: formData });
}
