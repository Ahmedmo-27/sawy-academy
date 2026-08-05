import type { ApiResponse } from "@/lib/api/types";
import { getOrCreateDeviceId } from "@/lib/device/id";
import { logger } from "@/lib/logger";

interface RequestOptions {
  query?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown | FormData;
  auth?: boolean;
  device?: boolean;
  onProgress?: (progress: number) => void;
}

interface UploadProgressOptions {
  onProgress?: (progress: number) => void;
  auth?: boolean;
  device?: boolean;
}

export class ApiClientError extends Error {
  status: number;
  code?: string;
  devices?: Array<{
    id: string;
    label: string;
    lastActiveAt: string;
    createdAt?: string;
  }>;

  constructor(
    message: string,
    status: number,
    extras?: {
      code?: string;
      devices?: ApiClientError["devices"];
    }
  ) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = extras?.code;
    this.devices = extras?.devices;
  }
}

const TOKEN_KEY = "sawy-academy-auth-token";

function readAuthToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
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

function getErrorExtras<T>(payload: ApiResponse<T>) {
  if (!payload.error || typeof payload.error === "string") {
    return {};
  }

  const error = payload.error as ApiResponse<T>["error"] & {
    code?: string;
    devices?: ApiClientError["devices"];
  };

  return {
    code: error.code,
    devices: error.devices,
  };
}

export async function apiRequest<T>(
  path: string,
  method: string,
  options: RequestOptions = {}
) {
  let body: BodyInit | undefined;
  const headers = new Headers();
  const startedAt = typeof performance !== "undefined" ? performance.now() : Date.now();

  if (options.body instanceof FormData) {
    body = options.body;
  } else if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(options.body);
  } else if (method !== "GET" && method !== "DELETE") {
    headers.set("Content-Type", "application/json");
  }

  const useAuth = options.auth !== false;
  const useDevice = options.device !== false;

  if (useAuth) {
    const token = readAuthToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  if (useDevice && typeof window !== "undefined") {
    headers.set("X-Device-Id", getOrCreateDeviceId());
  }

  const url = withQuery(path, options.query);
  const route =
    typeof window !== "undefined" ? window.location.pathname : undefined;

  logger.info("API request", {
    method,
    path: url,
    route,
    auth: useAuth,
    device: useDevice,
  });

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body,
    });
  } catch (error) {
    logger.error("API request network failure", {
      method,
      path: url,
      route,
      error,
    });
    throw new ApiClientError("Network request failed.", 0);
  }

  const payload = await readJsonResponse<T>(response, options.onProgress);
  const durationMs = Math.round(
    (typeof performance !== "undefined" ? performance.now() : Date.now()) -
      startedAt
  );

  if (!response.ok || !payload?.success) {
    const extras = payload ? getErrorExtras(payload) : {};
    const message = payload
      ? getErrorMessage(payload, "Request failed.")
      : "Request failed.";
    const logDetails = {
      method,
      path: url,
      route,
      status: response.status,
      durationMs,
      code: extras.code,
      error: message,
    };

    if (response.status >= 500 || response.status === 0) {
      logger.error("API request failed", logDetails);
    } else {
      logger.warn("API request rejected", logDetails);
    }

    if (
      extras.code === "DEVICE_REMOVED" &&
      typeof window !== "undefined"
    ) {
      window.dispatchEvent(new CustomEvent("sawy:session-invalid"));
    }
    throw new ApiClientError(message, response.status, extras);
  }

  logger.info("API request succeeded", {
    method,
    path: url,
    route,
    status: response.status,
    durationMs,
  });

  return payload.data as T;
}

export function apiGet<T>(
  path: string,
  query?: RequestOptions["query"],
  options?: Omit<RequestOptions, "query" | "body">
) {
  return apiRequest<T>(path, "GET", { ...options, query });
}

export function apiPost<T>(
  path: string,
  body?: RequestOptions["body"],
  options?: Omit<RequestOptions, "body">
) {
  return apiRequest<T>(path, "POST", { ...options, body });
}

export function apiPut<T>(
  path: string,
  body?: RequestOptions["body"],
  options?: Omit<RequestOptions, "body">
) {
  return apiRequest<T>(path, "PUT", { ...options, body });
}

export function apiPatch<T>(
  path: string,
  body?: RequestOptions["body"],
  options?: Omit<RequestOptions, "body">
) {
  return apiRequest<T>(path, "PATCH", { ...options, body });
}

export function apiDelete<T>(
  path: string,
  body?: RequestOptions["body"],
  options?: Omit<RequestOptions, "body">
) {
  return apiRequest<T>(path, "DELETE", { ...options, body });
}

async function readJsonResponse<T>(
  response: Response,
  onProgress?: (progress: number) => void
) {
  if (!onProgress || !response.body) {
    return (await response.json().catch(() => null)) as ApiResponse<T> | null;
  }

  const contentLength = response.headers.get("content-length");
  const total = contentLength ? Number.parseInt(contentLength, 10) : 0;

  if (!Number.isFinite(total) || total <= 0) {
    onProgress(50);
    const payload = (await response.json().catch(() => null)) as
      | ApiResponse<T>
      | null;
    onProgress(100);
    return payload;
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    chunks.push(value);
    received += value.length;
    onProgress(Math.min(99, Math.round((received / total) * 100)));
  }

  onProgress(100);

  const merged = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }

  const text = new TextDecoder().decode(merged);
  try {
    return JSON.parse(text) as ApiResponse<T>;
  } catch {
    return null;
  }
}

export function apiUpload<T>(path: string, formData: FormData) {
  return apiRequest<T>(path, "POST", { body: formData });
}

export function apiUploadWithProgress<T>(
  path: string,
  formData: FormData,
  options: UploadProgressOptions = {}
) {
  if (typeof window === "undefined") {
    return apiUpload<T>(path, formData);
  }

  return new Promise<T>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", withQuery(path));

    const useAuth = options.auth !== false;
    const useDevice = options.device !== false;

    if (useAuth) {
      const token = readAuthToken();
      if (token) {
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      }
    }

    if (useDevice) {
      xhr.setRequestHeader("X-Device-Id", getOrCreateDeviceId());
    }

    xhr.upload.addEventListener("progress", (event) => {
      if (!event.lengthComputable || !options.onProgress) return;
      options.onProgress(Math.round((event.loaded / event.total) * 100));
    });

    xhr.addEventListener("load", () => {
      let payload: ApiResponse<T> | null = null;

      try {
        payload = JSON.parse(xhr.responseText) as ApiResponse<T>;
      } catch {
        payload = null;
      }

      if (xhr.status >= 200 && xhr.status < 300 && payload?.success) {
        options.onProgress?.(100);
        resolve(payload.data as T);
        return;
      }

      const extras = payload ? getErrorExtras(payload) : {};
      reject(
        new ApiClientError(
          payload
            ? getErrorMessage(payload, "Upload failed.")
            : "Upload failed.",
          xhr.status,
          extras
        )
      );
    });

    xhr.addEventListener("error", () => {
      reject(new ApiClientError("Upload failed.", 0));
    });

    xhr.addEventListener("abort", () => {
      reject(new ApiClientError("Upload cancelled.", 0));
    });

    xhr.send(formData);
  });
}
