'use client';

import { useSearchParams } from 'next/navigation';
import { useProducts } from '@/context/product-context';
import { ProductGrid } from '@/components/product-grid';
import { useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q');
  const { products, loading } = useProducts();

  const filteredProducts = useMemo(() => {
    if (!query) {
      return [];
    }
    return (products || []).filter(product => 
      product.name.toLowerCase().includes(query.toLowerCase()) ||
      product.description.toLowerCase().includes(query.toLowerCase()) ||
      product.category.toLowerCase().includes(query.toLowerCase()) ||
      product.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
    );
  }, [products, query]);

  const ProductGridSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(8)].map((_, i) => (
         <div key={i} className="space-y-2">
            <Skeleton className="aspect-square w-full" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
          </div>
      ))}
    </div>
  );

  return (
    <div className="container py-12">
      {loading ? (
        <>
          <Skeleton className="h-8 w-1/3 mb-8" />
          <ProductGridSkeleton />
        </>
      ) : (
        <>
          <h1 className="text-3xl font-bold mb-8">
            {query ? `${filteredProducts.length} results for "${query}"` : 'Please enter a search term'}
          </h1>
          {filteredProducts.length > 0 ? (
            <ProductGrid products={filteredProducts} />
          ) : (
            <p className="text-muted-foreground">
              No products found matching your search. Try a different term.
            </p>
          )}
        </>
      )}
    </div>
  );
}

