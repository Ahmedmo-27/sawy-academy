import Image from "next/image";
import Link from "next/link";
import { ImageFrame } from "@/components/decorative/ImageFrame";
import { ProductCard } from "@/components/products/ProductCard";
import { products } from "@/lib/data/products";

interface CourseMaterialsProps {
  relatedProductIds: string[];
}

export function CourseMaterials({ relatedProductIds }: CourseMaterialsProps) {
  const materials = products.filter((p) => relatedProductIds.includes(p.id));
  if (materials.length === 0) return null;

  return (
    <div className="bay-grid">
      {materials.map((product) => (
        <div
          key={product.id}
          className="col-span-12 sm:col-span-6 lg:col-span-3 bg-concrete"
        >
          <ProductCard
            id={product.id}
            name={product.name}
            category={product.category}
            description={product.description}
            price={product.price}
            image={product.image}
          />
        </div>
      ))}
    </div>
  );
}

interface SpecifiedMaterialsStripProps {
  relatedProductIds: string[];
}

export function SpecifiedMaterialsStrip({
  relatedProductIds,
}: SpecifiedMaterialsStripProps) {
  const materials = products.filter((p) => relatedProductIds.includes(p.id));
  if (materials.length === 0) return null;

  return (
    <div>
      <p className="label-caps mb-4 text-charcoal-infill/70">
        Specified materials
      </p>
      <div className="flex flex-wrap gap-4">
        {materials.map((product) => (
          <Link
            key={product.id}
            href="/products"
            className="group flex items-center gap-3 min-w-0"
          >
            <ImageFrame className="relative w-14 h-14 shrink-0">
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-cover"
                sizes="56px"
              />
            </ImageFrame>
            <div className="min-w-0">
              <p className="type-infill text-charcoal truncate group-hover:text-clay transition-colors">
                {product.name}
              </p>
              <p className="label-caps">{product.category}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
