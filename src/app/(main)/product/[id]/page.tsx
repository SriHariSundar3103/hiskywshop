'use client';

import { notFound, useParams, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useProducts } from '@/context/product-context';
import { businessDetails } from '@/lib/data';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, CheckCircle, Phone, Heart } from 'lucide-react';
import { ProductRecommendations } from '@/components/product-recommendations';
import { Separator } from '@/components/ui/separator';
import { useEffect, useState, useRef } from 'react';
import type { Product } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import type { Image as ImageType } from '@/lib/types';

export default function ProductDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const { getProductById, updateProduct, images } = useProducts();
  const [product, setProduct] = useState<Product | undefined | null>(undefined);
  const fromSearch = searchParams.get('from_search');
  const lastViewedId = useRef<string | null>(null);

  useEffect(() => {
    const currentProduct = getProductById(id);
    setProduct(currentProduct);

    if (currentProduct && lastViewedId.current !== id) {
        lastViewedId.current = id;
        const newViewCount = (currentProduct.viewCount || 0) + 1;
        const updates: Partial<Product> = { viewCount: newViewCount };

        const TRENDING_THRESHOLD = 10;
        if (newViewCount >= TRENDING_THRESHOLD && !currentProduct.isTrending) {
            updates.isTrending = true;
        }
        
        updateProduct(id, updates);
    }
  }, [id, getProductById, updateProduct]);

  if (product === undefined) {
    return (
      <div className="container py-8 md:py-12">
        <Skeleton className="h-8 w-1/2 mb-8" />
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          <div className="grid gap-4">
            <Skeleton className="aspect-square w-full" />
            <div className="grid grid-cols-3 gap-4">
              <Skeleton className="aspect-square w-full" />
              <Skeleton className="aspect-square w-full" />
              <Skeleton className="aspect-square w-full" />
            </div>
          </div>
          <div className="space-y-6">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-12 w-1/4" />
            <Skeleton className="h-24 w-full" />
            <div className="flex gap-3">
              <Skeleton className="h-12 flex-1" />
              <Skeleton className="h-12 flex-1" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    notFound();
  }

  const getProductImage = (id: string): ImageType | undefined => images.find(img => img.id === id);

  const productImages = product.images.map(id => getProductImage(id)).filter(Boolean) as ImageType[];

  const breadcrumbContent = fromSearch ? (
    <BreadcrumbList>
      <BreadcrumbItem>
        <BreadcrumbLink href="/">Home</BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        <BreadcrumbLink href={`/search?q=${encodeURIComponent(fromSearch)}`}>Search Results</BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        <BreadcrumbPage>{product.name}</BreadcrumbPage>
      </BreadcrumbItem>
    </BreadcrumbList>
  ) : (
    <BreadcrumbList>
      <BreadcrumbItem>
        <BreadcrumbLink href="/">Home</BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        <BreadcrumbLink href={`/products/${product.category.toLowerCase()}`}>{product.category === 'Men' ? "Men's Collection" : `${product.category} Watches`}</BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        <BreadcrumbPage>{product.name}</BreadcrumbPage>
      </BreadcrumbItem>
    </BreadcrumbList>
  );

  return (
    <div className="container py-8 md:py-12 bg-background">
      <Breadcrumb className="mb-8">
        {breadcrumbContent}
      </Breadcrumb>
      
      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        {/* Image Gallery */}
        <div className="grid gap-4">
          <div className="relative aspect-square overflow-hidden rounded-lg border">
            {productImages[0] && (
              <Image
                src={productImages[0].url}
                alt={product.name}
                fill
                className="object-cover"
              />
            )}
          </div>
          <div className="grid grid-cols-3 gap-4">
            {productImages.slice(1, 3).map((img, index) => (
              <div key={index} className="relative aspect-square overflow-hidden rounded-lg border">
                {img && (
                  <Image
                    src={img.url}
                    alt={`${product.name} view ${index + 2}`}
                    fill
                    className="object-cover"
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">{product.name}</h1>
            <div className="mt-2 flex items-center gap-4">
                <div className="flex items-center gap-1">
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold">{product.rating}</span>
                    <span className="text-sm text-muted-foreground">({product.reviewCount} reviews)</span>
                </div>
                <Separator orientation="vertical" className="h-5" />
                 <div className="flex items-center gap-2">
                    {product.tags.map(tag => <Badge key={tag} variant="outline">{tag}</Badge>)}
                 </div>
            </div>
          </div>

          <p className="text-4xl font-bold text-[#B12704]">₹{product.price.toLocaleString()}</p>
          
          <div className="flex items-center gap-2">
            <CheckCircle className={`w-5 h-5 ${product.stockStatus === 'Available' ? 'text-green-600' : 'text-red-600'}`} />
            <span className={`font-semibold ${product.stockStatus === 'Available' ? 'text-green-600' : 'text-red-600'}`}>
                {product.stockStatus}
            </span>
          </div>

          <p className="text-base text-muted-foreground leading-relaxed">{product.description}</p>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild size="lg" className="flex-1">
              <a href={`tel:${businessDetails.phone}`}>
                <Phone className="mr-2 h-5 w-5" /> Call Now to Order
              </a>
            </Button>
            <Button size="lg" variant="secondary" className="flex-1">
              Order via GPay
            </Button>
             <Button size="lg" variant="outline" className="px-4">
              <Heart className="h-5 w-5" />
              <span className="sr-only">Add to Wishlist</span>
            </Button>
          </div>
        </div>
      </div>
      
      <Separator className="my-12" />

      <ProductRecommendations product={product} />
    </div>
  );
}
    