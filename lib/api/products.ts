import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api/client";
import type { Product } from "@/lib/api/types";

export type ProductInput = Pick<
  Product,
  "id" | "name" | "description" | "price" | "category" | "image"
>;

export function listProducts() {
  return apiGet<Product[]>("/api/products");
}

export function getProduct(id: string) {
  return apiGet<Product>(`/api/products/${id}`);
}

export function createProduct(input: ProductInput) {
  return apiPost<Product>("/api/products", input);
}

export function updateProduct(id: string, input: ProductInput) {
  return apiPut<Product>(`/api/products/${id}`, input);
}

export function deleteProduct(id: string) {
  return apiDelete<Product>(`/api/products/${id}`);
}
