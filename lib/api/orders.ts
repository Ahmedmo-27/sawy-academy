import { apiGet, apiPatch, apiPost } from "@/lib/api/client";
import type { Order } from "@/lib/api/types";

/**
 * POST /api/orders payload (manual InstaPay verification):
 *   {
 *     items: Array<{ id: string; quantity: number; kind?: string; name?: string; price?: string }>,
 *     screenshotUrl: string
 *   }
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

export function listOrders(status?: string) {
  return apiGet<Order[]>("/api/orders", { status });
}

/** GET /api/orders?userId=me → Order[] */
export function listMyOrders() {
  return apiGet<Order[]>("/api/orders", { userId: "me" });
}

export function getOrder(id: string) {
  return apiGet<Order>(`/api/orders/${id}`);
}

export function createOrder(payload: CreateOrderPayload) {
  return apiPost<Order>("/api/orders", payload);
}

export function approveOrder(id: string) {
  return apiPatch<Order>(`/api/orders/${id}/approve`);
}

export function rejectOrder(id: string, reason: string) {
  return apiPatch<Order>(`/api/orders/${id}/reject`, { reason });
}
