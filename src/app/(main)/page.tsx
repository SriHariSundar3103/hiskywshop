'use client';

// HYDRATION FIX: Disable static generation to prevent prerendering issues with Firebase
export const dynamic = 'force-dynamic';

import { HeroBanner } from '@/components/hero-banner';
import { CategoryShowcase } from '@/components/category-showcase';
import { ProductGrid } from '@/components/product-grid';
import { useProducts } from '@/context/product-context';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

export default function HomePage() {
  const { products, loading } = useProducts();
  const trendingProducts = (products || []).filter(p => p.isTrending).slice(0, 4);
  const dealOfTheDayProducts = (products || []).filter(p => p.isDealOfTheDay).slice(0, 4);

  const ProductSectionSkeleton = () => (
    <section>
      <div className="flex items-center justify-between mb-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-24" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
           <div key={i} className="space-y-2">
              <Skeleton className="aspect-square w-full" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
            </div>
        ))}
      </div>
    </section>
  );

  return (
    <>
      <HeroBanner />
      <div className="container py-12 md:py-16 space-y-16">
        <section>
          <CategoryShowcase />
        </section>

        {loading ? (
          <>
            <ProductSectionSkeleton />
            <ProductSectionSkeleton />
          </>
        ) : (
          <>
            {trendingProducts.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-3xl font-bold tracking-tight">Trending Now</h2>
                  <Button variant="outline" asChild>
                    <Link href="/products/all">View All</Link>
                  </Button>
                </div>
                <ProductGrid products={trendingProducts} />
              </section>
            )}

            {dealOfTheDayProducts.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-3xl font-bold tracking-tight">Deals of the Day</h2>
                  <Button variant="outline" asChild>
                    <Link href="/products/all">View All Deals</Link>
                  </Button>
                </div>
                <ProductGrid products={dealOfTheDayProducts} />
              </section>
            )}
          </>
        )}
      </div>
    </>
  );
}
