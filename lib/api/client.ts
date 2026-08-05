import type { ApiResponse } from "@/lib/api/types";
import { getOrCreateDeviceId } from "@/lib/device/id";

interface RequestOptions {
  query?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown | FormData;
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

  const response = await fetch(withQuery(path, options.query), {
    method,
    headers,
    body,
  });

  const payload = (await response.json().catch(() => null)) as
    | ApiResponse<T>
    | null;

  if (!response.ok || !payload?.success) {
    const extras = payload ? getErrorExtras(payload) : {};
    if (
      extras.code === "DEVICE_REMOVED" &&
      typeof window !== "undefined"
    ) {
      window.dispatchEvent(new CustomEvent("sawy:session-invalid"));
    }
    throw new ApiClientError(
      payload ? getErrorMessage(payload, "Request failed.") : "Request failed.",
      response.status,
      extras
    );
  }

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

export function apiUpload<T>(path: string, formData: FormData) {
  return apiRequest<T>(path, "POST", { body: formData });
}
