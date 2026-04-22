import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export function HeroBanner() {
  return (
    <section className="relative w-full h-[400px] md:h-[500px] lg:h-[600px]">
      <Image
        src="/hero section.jpg"
        alt="Hi/sky Watch Shop - Premium Timepieces"
        fill
        className="object-cover"
        priority
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-black/20" />
      <div className="relative h-full flex flex-col justify-center items-start container px-4 text-white max-w-7xl mx-auto">
        <h1 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight max-w-2xl mb-4 drop-shadow-lg">
          Timeless Style
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
            Modern Precision
          </span>
        </h1>
        <p className="text-lg md:text-xl lg:text-2xl max-w-xl mb-8 opacity-95 drop-shadow-md">
          Discover our exclusive collection of luxury watches that blend classic craftsmanship with cutting-edge technology.
        </p>
        <Button asChild size="lg" className="text-lg px-8 py-6 rounded-full font-semibold shadow-2xl hover:shadow-3xl transition-all duration-300 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
          <Link href="/products">
            Explore Collection 
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
