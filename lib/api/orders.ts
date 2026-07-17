import { apiPost } from "@/lib/api/client";
import type { Order } from "@/lib/api/types";

/**
 * Assumed POST /api/orders payload (manual InstaPay verification):
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

// TODO: Attach Authorization bearer token once api client supports auth headers.
export function createOrder(payload: CreateOrderPayload) {
  return apiPost<Order>("/api/orders", payload);
}
