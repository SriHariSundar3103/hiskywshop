import type { Product } from '@/lib/types';
import { ProductCard } from '@/components/product-card';

interface ProductGridProps {
  products: Product[];
  fromSearch?: string;
}

export function ProductGrid({ products, fromSearch }: ProductGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} fromSearch={fromSearch} />
      ))}
    </div>
  );
}
