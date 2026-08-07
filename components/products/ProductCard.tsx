"use client";

import Link from "next/link";
import { useState } from "react";
import { Magnetic } from "@/components/animation/Magnetic";
import { MediaBay } from "@/components/decorative/MediaBay";
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
    <article className="group flex h-full min-w-0 flex-col bg-concrete elevation-surface">
      <Link href={href} className="relative block">
        <MediaBay
          src={image}
          alt={name}
          className="aspect-[4/3] sm:aspect-[4/5]"
          fallback="product"
          morph
          sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 25vw"
        />
        <div className="project-overlay pointer-events-none absolute inset-0 hidden items-end bg-charcoal/50 p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100 sm:flex sm:p-5">
          <p className="type-infill !text-concrete line-clamp-4 leading-snug">
            {description}
          </p>
        </div>
      </Link>
      <div className="flex min-w-0 flex-1 flex-col p-5 sm:p-5 lg:p-6">
        <p className="label-caps mb-2">{category}</p>
        <h2 className="type-title mb-2 line-clamp-2 text-base leading-snug sm:text-[length:var(--text-title)]">
          <Link
            href={href}
            className="hover:text-clay transition-colors duration-200"
          >
            {name}
          </Link>
        </h2>
        <p className="type-infill mb-5 line-clamp-2 flex-1 leading-snug lg:hidden">
          {description}
        </p>
        <div className="mt-auto flex min-w-0 flex-col gap-3 border-t border-hairline pt-4 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
          <span className="type-title shrink-0 text-sm tabular-nums sm:text-base">
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
