import Image from 'next/image';
import Link from 'next/link';
import { categories } from '@/lib/data';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';

export function CategoryShowcase() {
  const categoryImages = {
    'category-men': '/mens.jpg',
    'category-women': '/woman.webp',
    'category-kids': '/kids.webp',
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
      {categories.map((category) => {
        const imageUrl = categoryImages[category.image as keyof typeof categoryImages];
        return (
          <Link href={`/products/${category.slug}`} key={category.slug} className="group">
            <Card className="relative overflow-hidden h-80 md:h-96 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 cursor-pointer border-0 bg-gradient-to-br from-slate-50 to-slate-100">
              <Image
                src={imageUrl}
                alt={`${category.name} collection`}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <CardHeader className="p-0">
                  <CardTitle className="text-2xl md:text-3xl lg:text-4xl font-black text-white drop-shadow-2xl tracking-wide leading-tight">
                    {category.name === 'Men' ? "Men's Collection" : `${category.name}'s Collection`}
                  </CardTitle>
                </CardHeader>
                <p className="text-white/90 text-sm md:text-base mt-2 drop-shadow-md max-w-sm">
                  {category.description}
                </p>
              </div>
              <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-all duration-300">
                <ArrowRight className="h-8 w-8 text-white drop-shadow-lg" />
              </div>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
