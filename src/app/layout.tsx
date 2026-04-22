import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { cn } from '@/lib/utils';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Hi/sky Time - Premium Watches for Everyone',
  description: 'Explore a wide range of stylish and affordable watches for men, women, and kids at Hi/sky Time. Your one-stop watch shop in Bangalore.',
  keywords: "Watch shop Bangalore, Affordable watches India, Men women kids watches, Best watch store near me, Hi/sky watches",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className={cn(
        "font-body antialiased bg-background text-foreground",
      )}>
        <Providers>
          {children}
        </Providers>
        <Toaster />
      </body>
    </html>
  );
}
