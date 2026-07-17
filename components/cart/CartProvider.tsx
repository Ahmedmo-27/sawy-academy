"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { formatPrice, parsePrice } from "@/lib/cart/pricing";

export type CartItemKind = "product" | "course" | "diploma";

export interface CartItem {
  id: string;
  name: string;
  price: string;
  kind: CartItemKind;
  quantity: number;
  /** Product category, course level, or similar label for the line sheet. */
  category?: string;
  image?: string;
}

/** Fields required when pushing an item into the cart (quantity defaults to 1). */
export type CartItemInput = Omit<CartItem, "quantity"> & { quantity?: number };

interface CartContextValue {
  items: CartItem[];
  count: number;
  subtotal: number;
  subtotalLabel: string;
  hydrated: boolean;
  addItem: (item: CartItemInput) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  hasItem: (id: string) => boolean;
}

const STORAGE_KEY = "sawy-academy-cart";

const CartContext = createContext<CartContextValue | null>(null);

function normalizeItem(item: CartItemInput): CartItem {
  return {
    ...item,
    quantity: Math.max(1, item.quantity ?? 1),
  };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CartItem[];
        if (Array.isArray(parsed)) {
          setItems(
            parsed.map((item) =>
              normalizeItem({
                ...item,
                quantity: item.quantity ?? 1,
              })
            )
          );
        }
      }
    } catch {
      // Ignore corrupt cart storage.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    // TODO: Sync to GET/PUT /api/cart once authenticated cart endpoints exist.
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const addItem = useCallback((item: CartItemInput) => {
    setItems((prev) => {
      const existing = prev.find((entry) => entry.id === item.id);
      if (existing) {
        return prev.map((entry) =>
          entry.id === item.id
            ? {
                ...entry,
                quantity: entry.quantity + (item.quantity ?? 1),
                // Refresh display fields if a newer add provides them.
                name: item.name ?? entry.name,
                price: item.price ?? entry.price,
                category: item.category ?? entry.category,
                image: item.image ?? entry.image,
                kind: item.kind ?? entry.kind,
              }
            : entry
        );
      }
      return [...prev, normalizeItem(item)];
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    setItems((prev) => {
      if (quantity < 1) {
        return prev.filter((item) => item.id !== id);
      }
      return prev.map((item) =>
        item.id === id ? { ...item, quantity } : item
      );
    });
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const hasItem = useCallback(
    (id: string) => items.some((item) => item.id === id),
    [items]
  );

  const subtotal = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + parsePrice(item.price) * item.quantity,
        0
      ),
    [items]
  );

  const count = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const value = useMemo(
    () => ({
      items,
      count,
      subtotal,
      subtotalLabel: formatPrice(subtotal),
      hydrated,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      hasItem,
    }),
    [
      items,
      count,
      subtotal,
      hydrated,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      hasItem,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within CartProvider");
  }
  return ctx;
}
