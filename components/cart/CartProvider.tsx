"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { getCart, putCart } from "@/lib/api/cart";
import { formatPrice, parsePrice } from "@/lib/cart/pricing";
import { useAuth } from "@/hooks/useAuth";

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
const SYNC_DEBOUNCE_MS = 400;

const CartContext = createContext<CartContextValue | null>(null);

function normalizeItem(item: CartItemInput): CartItem {
  const quantity = Number(item.quantity);
  return {
    id: item.id,
    name: item.name,
    price: item.price ?? "",
    kind: item.kind,
    quantity: Math.max(1, Number.isFinite(quantity) ? quantity : 1),
    category: item.category,
    image: item.image,
  };
}

function readLocalItems(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartItem[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item) =>
      normalizeItem({
        ...item,
        quantity: item.quantity ?? 1,
      })
    );
  } catch {
    return [];
  }
}

/** Union by id: local display fields win; quantity is the max of both sides. */
function mergeCartItems(local: CartItem[], remote: CartItem[]): CartItem[] {
  const map = new Map<string, CartItem>();

  for (const item of remote) {
    map.set(item.id, normalizeItem(item));
  }

  for (const item of local) {
    const existing = map.get(item.id);
    if (existing) {
      map.set(
        item.id,
        normalizeItem({
          ...existing,
          ...item,
          quantity: Math.max(existing.quantity, item.quantity ?? 1),
        })
      );
    } else {
      map.set(item.id, normalizeItem(item));
    }
  }

  return Array.from(map.values());
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [remoteReady, setRemoteReady] = useState(false);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  useEffect(() => {
    setItems(readLocalItems());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || authLoading) return;

    if (!isAuthenticated) {
      setRemoteReady(true);
      return;
    }

    let cancelled = false;
    setRemoteReady(false);

    async function syncFromServer() {
      try {
        const remote = await getCart();
        if (cancelled) return;

        const remoteItems = (remote.items || []).map((item) =>
          normalizeItem({
            ...item,
            price: item.price ?? "",
            quantity: item.quantity ?? 1,
          })
        );

        const merged = mergeCartItems(itemsRef.current, remoteItems);
        setItems(merged);
      } catch {
        // Keep the local cart when the server is unreachable.
      } finally {
        if (!cancelled) {
          setRemoteReady(true);
        }
      }
    }

    void syncFromServer();

    return () => {
      cancelled = true;
    };
  }, [hydrated, authLoading, isAuthenticated, user.id]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  useEffect(() => {
    if (!hydrated || !remoteReady || !isAuthenticated) return;

    const timer = window.setTimeout(() => {
      void putCart(items).catch(() => {
        // Local cart remains the source of truth on sync failure.
      });
    }, SYNC_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [items, hydrated, remoteReady, isAuthenticated]);

  const addItem = useCallback((item: CartItemInput) => {
    setItems((prev) => {
      const existing = prev.find((entry) => entry.id === item.id);
      if (existing) {
        const added = Math.max(1, item.quantity ?? 1);
        return prev.map((entry) =>
          entry.id === item.id
            ? {
                ...entry,
                quantity: Math.max(1, entry.quantity) + added,
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
        item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item
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
        (sum, item) =>
          sum + parsePrice(item.price) * Math.max(1, item.quantity),
        0
      ),
    [items]
  );

  const count = useMemo(
    () => items.reduce((sum, item) => sum + Math.max(1, item.quantity), 0),
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
