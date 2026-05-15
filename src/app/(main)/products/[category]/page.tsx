'use client';

// HYDRATION FIX: Disable static generation to prevent prerendering issues with Firebase
export const dynamic = 'force-dynamic';

import { useState, useMemo } from 'react';
import { notFound, useParams } from 'next/navigation';
import { useProducts } from '@/context/product-context';
import { categories, menSubCategories } from '@/lib/data';
import { ProductGrid } from '@/components/product-grid';
import { ProductFilters } from '@/components/product-filters';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function CategoryPage() {
  const params = useParams();
  const category = params.category as string;
  const { products, loading } = useProducts();
  const [sortBy, setSortBy] = useState('trending');
  const [activeSubCategory, setActiveSubCategory] = useState(menSubCategories[0].slug);

  const isMenCategory = category === 'men';
  const currentCategory = categories.find(c => c.slug === category);
  
  const filteredProducts = useMemo(() => {
    if (category === 'all') return products;

    let prods = (products || []).filter(p => p.category.toLowerCase() === category);
    
    if (isMenCategory) {
      prods = prods.filter(p => p.productType.toLowerCase() === activeSubCategory);
    }
    
    return prods;
  }, [products, category, isMenCategory, activeSubCategory]);
    
  if (!loading && !currentCategory && category !== 'all') {
    notFound();
  }

  const sortedProducts = useMemo(() => {
    let sortableProducts = [...filteredProducts];
    switch (sortBy) {
      case 'price-asc':
        sortableProducts.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        sortableProducts.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        sortableProducts.sort((a, b) => (b.createdAt as any) - (a.createdAt as any));
        break;
      case 'popularity':
        sortableProducts.sort((a, b) => b.reviewCount - a.reviewCount);
        break;
      case 'trending':
      default:
        sortableProducts.sort((a, b) => (b.isTrending === a.isTrending)? 0 : b.isTrending? -1 : 1);
        break;
    }
    return sortableProducts;
  }, [filteredProducts, sortBy]);

  const categoryName = currentCategory ? currentCategory.name : 'All';
  const isWomenCategory = category === 'women';
  const subCategoryName = menSubCategories.find(s => s.slug === activeSubCategory)?.name || '';


  const ProductGridSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
         <div key={i} className="space-y-2">
            <Skeleton className="aspect-square w-full" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
          </div>
      ))}
    </div>
  );

  return (
    <div className="container py-8 bg-background">
      <Breadcrumb className="mb-8">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/products/all">Products</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>
              {isMenCategory ? `Men's ${subCategoryName}` : `${categoryName} Watches`}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      
      <div className="border-b pb-4 mb-8">
        {isWomenCategory ? (
          <div className='text-center'>
            <h1 className="text-4xl font-bold tracking-tight">Women's Watches Collection</h1>
            <p className="mt-2 text-lg text-muted-foreground">Elegant and trendy watches for every occasion</p>
          </div>
        ) : (
          <h1 className="text-4xl font-bold tracking-tight">{isMenCategory ? "Men's Collection" : `${categoryName} Watches`}</h1>
        )}
         {isMenCategory && (
            <p className="mt-2 text-lg text-muted-foreground">Explore watches and stylish outfits for every occasion</p>
        )}
      </div>

      {isMenCategory && (
        <Tabs defaultValue={activeSubCategory} onValueChange={setActiveSubCategory} className="w-full mb-8">
            <TabsList className="grid w-full grid-cols-3 border-b">
                {menSubCategories.map(sub => (
                    <TabsTrigger key={sub.slug} value={sub.slug}>{sub.name}</TabsTrigger>
                ))}
            </TabsList>
        </Tabs>
      )}

       <div className="flex items-baseline justify-between mb-8">
        <div className="text-sm text-muted-foreground">{loading ? <Skeleton className="h-5 w-20" /> : `${sortedProducts.length} products`}</div>
        <div className="flex items-center gap-4">
            <Select onValueChange={setSortBy} defaultValue="trending">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="trending">Trending</SelectItem>
                <SelectItem value="newest">New Arrivals</SelectItem>
                <SelectItem value="price-asc">Price: Low to High</SelectItem>
                <SelectItem value="price-desc">Price: High to Low</SelectItem>
                <SelectItem value="popularity">Popularity</SelectItem>
              </SelectContent>
            </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <aside className="hidden lg:block">
          <ProductFilters category={category} subCategory={isMenCategory ? activeSubCategory : undefined} />
        </aside>
        <main className="lg:col-span-3">
          {loading ? <ProductGridSkeleton /> : sortedProducts.length > 0 ? (
            <>
              <ProductGrid products={sortedProducts} />
              <div className="flex justify-center items-center mt-12 space-x-1">
                <Button variant="outline">Previous</Button>
                <Button variant="outline" size="icon">1</Button>
                <Button variant="ghost" size="icon">2</Button>
                <Button variant="ghost" size="icon">3</Button>
                <span className="p-2 text-muted-foreground">...</span>
                <Button variant="ghost" size="icon">10</Button>
                <Button variant="outline">Next</Button>
              </div>
            </>
          ) : (
            <div className="text-center py-16">
              <h2 className="text-2xl font-semibold">No Products Found</h2>
              <p className="mt-2 text-muted-foreground">Try adjusting your filters or checking another category.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
