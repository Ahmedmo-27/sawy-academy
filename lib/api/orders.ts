import { apiGet, apiPatch, apiPost } from "@/lib/api/client";
import type { Order } from "@/lib/api/types";

/**
 * Assumed POST /api/orders payload (manual InstaPay verification):
 *   {
 *     items: Array<{ id: string; quantity: number; kind?: string; name?: string; price?: string }>,
 *     screenshotUrl: string
 *   }
 *
 * Assumed POST /api/upload (multipart): field "file" → { url: string } in ApiResponse data.
 */
export interface CreateOrderPayload {
  items: Array<{
    id: string;
    quantity: number;
    kind?: string;
    name?: string;
    price?: string;
  }>;
  screenshotUrl: string;
}

// TODO: Confirm order queue endpoints once payment verification API ships.
export function listOrders(status?: string) {
  return apiGet<Order[]>("/api/orders", { status });
}

/**
 * Assumed GET /api/orders?userId=me → Order[]
 * (date via submittedAt|createdAt, items[], amount, status, screenshot fields, reason?)
 */
// TODO: Confirm student-scoped orders filter once payment API ships.
export function listMyOrders() {
  return apiGet<Order[]>("/api/orders", { userId: "me" });
}

export function getOrder(id: string) {
  return apiGet<Order>(`/api/orders/${id}`);
}

// TODO: Attach Authorization bearer token once api client supports auth headers.
export function createOrder(payload: CreateOrderPayload) {
  return apiPost<Order>("/api/orders", payload);
}

export function approveOrder(id: string) {
  return apiPatch<Order>(`/api/orders/${id}/approve`);
}

export function rejectOrder(id: string, reason: string) {
  return apiPatch<Order>(`/api/orders/${id}/reject`, { reason });
}
