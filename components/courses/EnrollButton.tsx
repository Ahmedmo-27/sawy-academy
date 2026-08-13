"use client";

import Link from "next/link";
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
  label = "Add to cart",
}: EnrollButtonProps) {
  const { addItem, hasItem } = useCart();
  const { success } = useToast();
  const inCart = hasItem(id);

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

  if (inCart) {
    return (
      <Link href="/checkout" className={className}>
        Proceed to checkout
      </Link>
    );
  }

  return (
    <button type="button" className={className} onClick={handleAdd}>
      {label}
    </button>
  );
}
