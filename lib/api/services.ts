import { apiPost } from "@/lib/api/client";
import type {
  ServiceRequest,
  ServiceSubmissionPayload,
} from "@/lib/api/types";

export function submitServiceRequest(payload: ServiceSubmissionPayload) {
  return apiPost<ServiceRequest>("/api/services", payload);
}
