import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, Heart, Eye, Phone } from 'lucide-react';
import { businessDetails } from '@/lib/data';

interface ProductCardProps {
  product: Product;
  fromSearch?: string;
}

export function ProductCard({ product, fromSearch }: ProductCardProps) {
  // Use first image ID directly (local fallback)
  const firstImageId = product.images[0];
  const productImageUrl = firstImageId ? `/placeholder/${firstImageId}.jpg` : '/hero section.jpg';
  const productUrl = `/product/${product.id}${fromSearch ? '?from_search=' + encodeURIComponent(fromSearch) : ''}`;

  return (
    <Card className="h-full overflow-hidden transition-all duration-300 group rounded-lg border hover:shadow-lg hover:-translate-y-1 flex flex-col">
      <CardContent className="p-0 relative">
        <div className="relative aspect-square">
          <Link href={productUrl} className="block w-full h-full">
            <Image
              src={productImageUrl}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </Link>
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 pointer-events-none"></div>
          <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
            {product.isTrending && (
              <Badge className="bg-[#CC0C39] text-white hover:bg-[#CC0C39]">Trending</Badge>
            )}
            {product.isDealOfTheDay && (
              <Badge className="bg-[#FFA41C] text-black hover:bg-[#FFA41C]">Best Seller</Badge>
            )}
          </div>
          
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-full flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
            <Button size="icon" variant="secondary" className="rounded-full shadow-lg">
              <Heart className="h-5 w-5"/>
              <span className="sr-only">Wishlist</span>
            </Button>
            <Button size="icon" variant="secondary" className="rounded-full shadow-lg">
              <Eye className="h-5 w-5"/>
              <span className="sr-only">Quick View</span>
            </Button>
          </div>
        </div>
      </CardContent>
      <div className="p-4 space-y-2 flex flex-col flex-grow bg-card">
        <h3 className="text-base font-medium tracking-tight">
          <Link href={productUrl} className="hover:text-primary transition-colors">
            {product.name}
          </Link>
        </h3>
        <p className="text-xs text-muted-foreground">{product.category}</p>
        <div className="flex-grow"></div>
        <div className="flex items-center justify-between pt-2">
          <p className="text-xl font-bold">₹{product.price.toLocaleString()}</p>
          <div className="flex items-center gap-1 text-sm">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span>{product.rating}</span>
            <span className="text-muted-foreground">({product.reviewCount})</span>
          </div>
        </div>
        <Button asChild className="w-full mt-2">
          <a href={`tel:${businessDetails.phone}`}>
            <Phone className="mr-2 h-4 w-4" />
            Call to Order
          </a>
        </Button>
      </div>
    </Card>
  );
}

