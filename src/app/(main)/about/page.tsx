// HYDRATION FIX: Disable static generation to prevent prerendering issues with Firebase
export const dynamic = 'force-dynamic';

import Image from 'next/image';
import { businessDetails } from '@/lib/data';

export default function AboutPage() {
  return (
    <div className="bg-gradient-to-b from-slate-50 to-white min-h-screen">
      <div className="container mx-auto py-16 px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-12 lg:gap-20">
          {/* Hero Image */}
          <div className="relative">
            <div className="aspect-[4/3] lg:aspect-square relative rounded-3xl overflow-hidden shadow-2xl ring-4 ring-white/50">
              <Image
                src="/hero section.jpg"
                alt={`${businessDetails.shop_name} showroom`}
                fill
                className="object-cover hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent" />
            </div>
          </div>

          {/* Content */}
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl lg:text-5xl font-black bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent tracking-tight mb-6">
                About {businessDetails.shop_name}
              </h1>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 p-6 bg-white/50 rounded-2xl backdrop-blur-sm border">
                <div>
                  <h3 className="font-bold text-lg mb-2">📍 Location</h3>
                  <p className="text-sm">{businessDetails.address}</p>
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-2">📞 Contact</h3>
                  <p className="text-sm">{businessDetails.phone}</p>
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-2">✉️ Email</h3>
                  <p className="text-sm">{businessDetails.email}</p>
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-2">💳 Payment</h3>
                  <p className="text-sm">{businessDetails.payment_mode}</p>
                </div>
              </div>
            </div>

            <div className="prose prose-lg max-w-none">
              <p className="text-xl text-gray-700 leading-relaxed">
                Welcome to <span className="font-bold text-2xl">{businessDetails.shop_name}</span>, where timekeeping transcends function to become an expression of personal style.
              </p>
              <p className="text-lg mt-6 text-gray-600 leading-relaxed">
                Founded in Bangalore, our passion is to bring you a curated collection of watches that blend timeless elegance with modern precision. From sophisticated formal wear to rugged sports models and fun, vibrant watches for kids, our collection caters to every taste and occasion.
              </p>
              <p className="text-lg mt-6 text-gray-600 leading-relaxed">
                We believe a watch is more than just a device to tell time; it's a companion on your journey and a statement piece. Visit us opposite Diya School to discover your perfect timepiece.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
