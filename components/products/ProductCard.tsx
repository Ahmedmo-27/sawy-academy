"use client";

import Image from "next/image";
import { useState } from "react";
import { ImageFrame } from "@/components/decorative/ImageFrame";
import { useCart } from "@/components/cart/CartProvider";
import { useToast } from "@/components/feedback/ToastProvider";

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
  const [justAdded, setJustAdded] = useState(false);
  const inCart = hasItem(id) || justAdded;

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
    <article className="group flex h-full min-w-0 flex-col bg-concrete elevation-surface">
      <ImageFrame className="aspect-[4/5]">
        <Image
          src={image}
          alt={name}
          fill
          className="object-cover"
          sizes="(max-width: 1023px) 50vw, 25vw"
        />
        <div className="project-overlay pointer-events-none absolute inset-0 hidden items-end bg-charcoal/50 p-4 sm:flex sm:p-5">
          <p className="type-infill !text-concrete line-clamp-4 leading-snug">
            {description}
          </p>
        </div>
      </ImageFrame>
      <div className="flex min-w-0 flex-1 flex-col p-3 sm:p-5 lg:p-6">
        <p className="label-caps mb-1.5 sm:mb-2">{category}</p>
        <h2 className="type-title mb-1.5 line-clamp-2 text-base leading-snug sm:mb-2 sm:text-[length:var(--text-title)]">
          {name}
        </h2>
        <p className="type-infill mb-4 line-clamp-2 flex-1 leading-snug lg:hidden">
          {description}
        </p>
        <div className="mt-auto flex min-w-0 flex-col gap-2 border-t border-hairline pt-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3 sm:pt-4">
          <span className="type-title shrink-0 text-sm tabular-nums sm:text-base">
            {price}
          </span>
          <button
            type="button"
            className="action-secondary self-start disabled:cursor-not-allowed disabled:text-clay-muted sm:self-auto"
            onClick={handleAdd}
            disabled={inCart}
          >
            {inCart ? "In cart" : "Add to cart"}
          </button>
        </div>
      </div>
    </article>
  );
}
