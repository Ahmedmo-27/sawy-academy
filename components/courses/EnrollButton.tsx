"use client";

import { useCart } from "@/components/cart/CartProvider";

interface EnrollButtonProps {
  id: string;
  name: string;
  price: string;
  kind?: "course" | "diploma";
  className?: string;
  label?: string;
}

export function EnrollButton({
  id,
  name,
  price,
  kind = "course",
  className = "action-primary",
  label = "Enroll",
}: EnrollButtonProps) {
  const { addItem, hasItem } = useCart();
  const enrolled = hasItem(id);

  return (
    <button
      type="button"
      className={className}
      disabled={enrolled}
      onClick={() => addItem({ id, name, price, kind })}
    >
      {enrolled ? "Added to cart" : label}
    </button>
  );
}
