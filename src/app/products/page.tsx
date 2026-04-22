'use client';

import { ProductGrid } from '@/components/product-grid';
import { ProductFilters } from '@/components/product-filters';
import { useProducts } from '@/context/product-context';
import { categories } from '@/lib/data';
import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ChevronLeft, Filter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useUserProfile } from '@/firebase/auth/use-user-profile';

export default function ProductsPage() {
  const { products } = useProducts();
  const { isAdmin } = useUserProfile();
  const [activeCategory, setActiveCategory] = useState('all');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const filteredProducts = activeCategory === 'all' 
    ? products 
    : (products || []).filter(p => p.category.toLowerCase() === activeCategory);

  const categoryCounts = categories.reduce((acc, cat) => {
    acc[cat.slug] = (products || []).filter(p => p.category.toLowerCase() === cat.slug).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Mobile Filter Button */}
      <div className="container sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b px-4 py-4 md:hidden">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => setMobileFiltersOpen(true)}>
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
          <h1 className="text-2xl font-bold">Products ({products.length})</h1>
        </div>
      </div>

      <div className="container py-8 lg:py-12 max-w-7xl mx-auto px-4">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters - Desktop */}
          <div className="hidden lg:block lg:w-80 xl:w-96 sticky top-24 h-fit">
            <div className="bg-white rounded-2xl shadow-xl border p-6 mb-8">
              <h3 className="text-xl font-bold mb-6 flex items-center">
                <Filter className="w-5 h-5 mr-2" />
                Categories
              </h3>
              <div className="space-y-2">
                <Button
                  variant={activeCategory === 'all' ? "default" : "ghost"}
                  className="w-full justify-start h-12 px-4 py-2 text-left hover:bg-slate-100 transition-all"
                  onClick={() => setActiveCategory('all')}
                >
                  All ({products.length})
                </Button>
                {categories.map((category) => (
                  <Button
                    key={category.slug}
                    variant={activeCategory === category.slug ? "default" : "ghost"}
                    className="w-full justify-start h-12 px-4 py-2 text-left hover:bg-slate-100 transition-all"
                    onClick={() => setActiveCategory(category.slug)}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span>{category.name}</span>
                      <Badge variant="secondary" className="ml-2">
                        {categoryCounts[category.slug] || 0}
                      </Badge>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
            {activeCategory !== 'all' && (
              <ProductFilters 
                category={activeCategory} 
                subCategory={undefined}
              />
            )}
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Desktop Category Tabs */}
            <div className="lg:hidden mb-8">
              <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
                <TabsList className="grid w-full grid-cols-4 bg-white rounded-2xl p-1 shadow-lg gap-1">
                  <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-xl py-3 data-[state=active]:shadow-md">
                    All
                  </TabsTrigger>
                  {categories.map((cat) => (
                    <TabsTrigger 
                      key={cat.slug} 
                      value={cat.slug}
                      className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-xl py-3 data-[state=active]:shadow-md"
                    >
                      {cat.name}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>

            {/* Products Grid */}
            <div className="space-y-8">
              <div className="flex items-center gap-4">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/">
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Back to Home
                  </Link>
                </Button>
                <div className="flex-1 flex flex-wrap gap-2">
                  <Badge variant="secondary" className="px-3 py-1">
                    {filteredProducts.length} {activeCategory === 'all' ? 'products' : 'results'}
                  </Badge>
                </div>
              </div>
              
              <ProductGrid products={filteredProducts} />
              
              {filteredProducts.length === 0 && (
                <div className="text-center py-24">
                  <h3 className="text-2xl font-bold text-muted-foreground mb-4">
                    No products found
                  </h3>
                  <p className="text-muted-foreground mb-8">
                    {activeCategory === 'all' ? 'No products available yet.' : `No ${activeCategory} products available.`}
                  </p>
                  {isAdmin && (
                    <Button asChild size="lg">
                      <Link href="/admin/products/new">
                        Add First Product
                      </Link>
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
