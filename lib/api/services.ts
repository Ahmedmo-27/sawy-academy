import { apiGet, apiPatch, apiPost } from "@/lib/api/client";
import type {
  ServiceRequest,
  ServiceStatus,
  ServiceSubmissionPayload,
} from "@/lib/api/types";

// TODO: Confirm service request endpoints once the real API ships.
export function listServiceRequests(status?: string) {
  return apiGet<ServiceRequest[]>("/api/services", { status });
}

/**
 * Assumed GET /api/services?userId=me → ServiceRequest[]
 * (type, status, createdAt, details|message, notes?)
 */
// TODO: Confirm student-scoped services filter once the request API ships.
export function listMyServiceRequests() {
  return apiGet<ServiceRequest[]>("/api/services", { userId: "me" });
}

export function getServiceRequest(id: string) {
  return apiGet<ServiceRequest>(`/api/services/${id}`);
}

export function updateServiceRequestStatus(
  id: string,
  status: ServiceStatus,
  notes?: string
) {
  return apiPatch<ServiceRequest>(`/api/services/${id}`, { status, notes });
}

export function submitServiceRequest(payload: ServiceSubmissionPayload) {
  return apiPost<ServiceRequest>("/api/services", payload);
}
