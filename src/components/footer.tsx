'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Icons } from '@/components/icons';
import { businessDetails, categories } from '@/lib/data';
import { Github, Twitter, Instagram } from 'lucide-react';

// HYDRATION FIX: Dynamically import Firebase-dependent component with ssr: false
const AdminFooterLink = dynamic(() => import('./footer-admin-link').then(mod => mod.AdminFooterLink), {
  ssr: false,
  loading: () => null,
});


export function Footer() {
  // Use suppressHydrationWarning for year display
  // This is safe because the year only changes once a year at year boundary
  // The SSR and client output will be the same 99.99% of the time
  return (
    <footer className="bg-[#232F3E] text-white" suppressHydrationWarning>
      <div className="container py-12 px-4 md:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
          <div className="col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center space-x-2">
              <Icons.Logo className="h-8 w-8" />
              <span className="text-xl font-bold">Hi/sky</span>
            </Link>
            <p className="mt-4 text-sm text-gray-300">
              Timeless elegance for every moment.
            </p>
          </div>

          <div>
            <h4 className="font-semibold tracking-tight">Shop</h4>
            <ul className="mt-4 space-y-2">
              {categories.map((category) => (
                <li key={category.slug}>
                  <Link href={`/products/${category.slug}`} className="text-sm text-gray-300 hover:text-white transition-colors">
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold tracking-tight">About</h4>
            <ul className="mt-4 space-y-2">
              <li>
                <Link href="/about" className="text-sm text-gray-300 hover:text-white transition-colors">
                  Our Story
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-gray-300 hover:text-white transition-colors">
                  Contact Us
                </Link>
              </li>
               <AdminFooterLink />
            </ul>
          </div>

          <div className="col-span-2 md:col-span-2 lg:col-span-2">
             <h4 className="font-semibold tracking-tight">Contact Us</h4>
             <address className="mt-4 space-y-2 not-italic text-sm text-gray-300">
                <p>{businessDetails.address}</p>
                <p>Email: <a href={`mailto:${businessDetails.email}`} className="hover:text-white transition-colors">{businessDetails.email}</a></p>
                <p>Phone: <a href={`tel:${businessDetails.phone}`} className="hover:text-white transition-colors">{businessDetails.phone}</a></p>
             </address>
          </div>
        </div>

        <div className="mt-12 flex flex-col md:flex-row justify-between items-center border-t border-gray-600 pt-6">
            <p className="text-sm text-gray-400">
                &copy; {new Date().getFullYear()} {businessDetails.shop_name}. All rights reserved.
            </p>
            <div className="flex items-center gap-4 mt-4 md:mt-0">
                <Link href="#" aria-label="Twitter">
                    <Twitter className="h-5 w-5 text-gray-400 hover:text-white transition-colors"/>
                </Link>
                 <Link href="#" aria-label="Instagram">
                    <Instagram className="h-5 w-5 text-gray-400 hover:text-white transition-colors"/>
                </Link>
                 <Link href="#" aria-label="GitHub">
                    <Github className="h-5 w-5 text-gray-400 hover:text-white transition-colors"/>
                </Link>
            </div>
        </div>
      </div>
    </footer>
  );
}
