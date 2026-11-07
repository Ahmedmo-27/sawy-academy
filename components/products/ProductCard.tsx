"use client";

import { useState } from "react";
import { Magnetic } from "@/components/animation/Magnetic";
import { useCart } from "@/components/cart/CartProvider";
import { useToast } from "@/components/feedback/ToastProvider";
import { useThemeSlots } from "@/components/theme/slots";

interface ProductCardProps {
  id: string;
  name: string;
  category: string;
  description: string;
  price: string;
  image: string;
  onAddToCart?: () => void;
}

export function ProductCard({
  id,
  name,
  category,
  description,
  price,
  image,
  onAddToCart,
}: ProductCardProps) {
  const { addItem, hasItem } = useCart();
  const { success } = useToast();
  const { Card } = useThemeSlots();
  const [justAdded, setJustAdded] = useState(false);
  const inCart = hasItem(id) || justAdded;
  const href = `/products/${id}`;

  function handleAdd() {
    addItem({
      id,
      name,
      price,
      kind: "product",
      category,
      image,
    });
    onAddToCart?.();
    setJustAdded(true);
    success("Added to cart");
  }

  return (
    <article className="flex h-full min-w-0 flex-col gap-4">
      <Card title={name} meta={category} image={image} href={href} />
      <div className="mt-auto flex min-w-0 flex-1 flex-col">
        <p className="type-infill mb-5 line-clamp-3 flex-1 leading-snug">{description}</p>
        <div className="flex min-w-0 flex-col gap-3 border-t border-charcoal/10 pt-4 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
          <span className="shrink-0 font-serif text-base font-semibold tabular-nums text-clay sm:text-lg">
            {price}
          </span>
          <Magnetic strength={16}>
            <button
              type="button"
              className="action-secondary self-start disabled:cursor-not-allowed disabled:text-clay-muted sm:self-auto"
              onClick={handleAdd}
              disabled={inCart}
            >
              {inCart ? "In cart" : "Add to cart"}
            </button>
          </Magnetic>
        </div>
      </div>
    </article>
  );
}
