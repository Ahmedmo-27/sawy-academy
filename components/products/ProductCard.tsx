"use client";

import Image from "next/image";
import { useState } from "react";
import { ImageFrame } from "@/components/decorative/ImageFrame";
import { useCart } from "@/components/cart/CartProvider";

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
  const [justAdded, setJustAdded] = useState(false);
  const inCart = hasItem(id) || justAdded;

  function handleAdd() {
    addItem({ id, name, price, kind: "product" });
    onAddToCart?.();
    setJustAdded(true);
  }

  return (
    <article className="group flex flex-col h-full bg-concrete elevation-surface">
      <ImageFrame className="aspect-[4/5]">
        <Image
          src={image}
          alt={name}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, 25vw"
        />
        <div className="project-overlay absolute inset-0 bg-charcoal/50 flex items-end p-5 pointer-events-none">
          <p className="type-infill !text-concrete leading-relaxed">
            {description}
          </p>
        </div>
      </ImageFrame>
      <div className="p-6 flex flex-col flex-1">
        <p className="label-caps mb-2">{category}</p>
        <h2 className="type-title mb-2">{name}</h2>
        <p className="type-infill leading-relaxed mb-6 flex-1 lg:hidden">
          {description}
        </p>
        <div className="flex items-baseline justify-between pt-4 hairline-t mt-auto">
          <span className="type-title text-base tabular-nums">{price}</span>
          <button
            type="button"
            className="action-secondary disabled:text-clay-muted disabled:cursor-not-allowed"
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
