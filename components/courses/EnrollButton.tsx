"use client";

import { useCart } from "@/components/cart/CartProvider";
import { useToast } from "@/components/feedback/ToastProvider";

interface EnrollButtonProps {
  id: string;
  name: string;
  price: string;
  kind?: "course" | "diploma";
  category?: string;
  image?: string;
  className?: string;
  label?: string;
}

export function EnrollButton({
  id,
  name,
  price,
  kind = "course",
  category,
  image,
  className = "action-primary",
  label = "Enroll",
}: EnrollButtonProps) {
  const { addItem, hasItem } = useCart();
  const { success } = useToast();
  const enrolled = hasItem(id);

  function handleAdd() {
    addItem({
      id,
      name,
      price,
      kind,
      category: category ?? (kind === "diploma" ? "Diploma" : "Course"),
      image,
    });
    success("Added to cart");
  }

  return (
    <button
      type="button"
      className={className}
      disabled={enrolled}
      onClick={handleAdd}
    >
      {enrolled ? "Added to cart" : label}
    </button>
  );
}
