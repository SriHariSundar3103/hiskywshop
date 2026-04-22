'use client';

import { useEffect, useState } from 'react';
import type { Product } from '@/lib/types';
import { aiProductRecommendations, type AiProductRecommendationsOutput } from '@/ai/flows/ai-product-recommendations';
import { ProductGrid } from '@/components/product-grid';
import { useProducts } from '@/context/product-context';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface ProductRecommendationsProps {
  product: Product;
}

export function ProductRecommendations({ product }: ProductRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<AiProductRecommendationsOutput | null>(null);
  const [loading, setLoading] = useState(true);
  const { products: allProducts } = useProducts();

  const mapProductIdsToProducts = (ids: string[]) => {
    return ids.map(id => allProducts.find(p => p.id === id)).filter((p): p is Product => !!p);
  };

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        const result = await aiProductRecommendations({
          currentProduct: {
            productId: product.id,
            name: product.name,
            category: product.category,
            price: product.price,
            description: product.description,
            tags: product.tags,
          },
        });
        setRecommendations(result);
      } catch (error) {
        console.error("Failed to fetch AI recommendations:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [product]);

  if (loading) {
    return (
      <section className="space-y-8">
        <h2 className="text-3xl font-bold tracking-tight">You Might Also Like</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-64" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!recommendations) {
    return null;
  }
  
  const recommendedWatches = mapProductIdsToProducts(recommendations.recommendedWatches.slice(0, 4).map(w => w.productId));
  const customersAlsoViewed = mapProductIdsToProducts(recommendations.customersAlsoViewed.slice(0, 4).map(w => w.productId));
  const recommendedAccessories = mapProductIdsToProducts(recommendations.recommendedAccessories.slice(0, 4).map(w => w.productId));
  
  const tabs = [
    { value: 'related', label: 'Related Products', products: recommendedWatches },
    { value: 'viewed', label: 'Customers Also Viewed', products: customersAlsoViewed },
    { value: 'accessories', label: 'Accessories', products: recommendedAccessories },
  ].filter(tab => tab.products.length > 0);


  return (
    <section className="space-y-8">
        <Tabs defaultValue={tabs[0]?.value}>
            <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
                {tabs.map(tab => (
                    <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>
                ))}
            </TabsList>
            {tabs.map(tab => (
                 <TabsContent key={tab.value} value={tab.value}>
                    <div className="pt-6">
                        <ProductGrid products={tab.products} />
                    </div>
                </TabsContent>
            ))}
        </Tabs>
    </section>
  );
}
