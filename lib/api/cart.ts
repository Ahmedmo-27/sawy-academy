import { apiGet, apiPut } from "@/lib/api/client";

export type CartItemKind = "product" | "course" | "diploma";

export interface CartItemPayload {
  id: string;
  name: string;
  price?: string;
  kind: CartItemKind;
  quantity: number;
  category?: string;
  image?: string;
}

export interface CartPayload {
  items: CartItemPayload[];
  updatedAt?: string;
}

/** GET /api/cart → current user's persisted cart. */
export function getCart() {
  return apiGet<CartPayload>("/api/cart");
}

/** PUT /api/cart — replace the authenticated user's cart items. */
export function putCart(items: CartItemPayload[]) {
  return apiPut<CartPayload>("/api/cart", { items });
}
