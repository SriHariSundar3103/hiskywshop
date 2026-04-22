'use client';

import { ProductProvider } from '@/context/product-context';
import { FirebaseClientProvider } from '@/firebase';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <FirebaseClientProvider>
      <ProductProvider>{children}</ProductProvider>
    </FirebaseClientProvider>
  );
}
