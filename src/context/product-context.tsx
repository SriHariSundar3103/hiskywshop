'use client';

import { createContext, useContext, ReactNode, useMemo, useCallback } from 'react';
import type { Product, Image } from '@/lib/types';
import { useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useUserProfile } from '@/firebase/auth/use-user-profile';
import { addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';

export type NewProductData = Omit<Product, 'id' | 'createdAt' | 'isTrending' | 'isDealOfTheDay' | 'rating' | 'reviewCount' | 'viewCount'>;

interface ProductContextType {
  products: Product[];
  images: Image[];
  loading: boolean;
  addProduct: (data: NewProductData) => Promise<void>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  addImage: (data: { url: string; altText: string }) => Promise<void>;
  getProductById: (id: string) => Product | undefined;
}

const ProductContext = createContext<ProductContextType>({
  products: [],
  images: [],
  loading: false,
  addProduct: async () => {},
  updateProduct: async () => {},
  deleteProduct: async () => {},
  addImage: async () => {},
  getProductById: () => undefined,
});

export function ProductProvider({ children }: { children: ReactNode }) {
  const db = useFirestore();
  const { isAdmin, loading: profileLoading, user } = useUserProfile();

  const productsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return collection(db, 'products') as any;
  }, [db]);

  const imagesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return collection(db, 'images') as any;
  }, [db]);

  const { data: productsData, isLoading: collectionLoading } = useCollection<Product>(productsQuery);
  const { data: imagesData, isLoading: imagesLoading } = useCollection<Image>(imagesQuery);

  const products = useMemo(() => productsData || [], [productsData]);
  const images = useMemo(() => imagesData || [], [imagesData]);

  const addProduct = useCallback(async (productData: NewProductData) => {
    if (!isAdmin || !db) return;
    await addDoc(collection(db, 'products'), {
      ...productData,
      createdAt: serverTimestamp(),
      isTrending: false,
      isDealOfTheDay: false,
      rating: 0,
      reviewCount: 0,
      viewCount: 0,
    });
  }, [isAdmin, db]);

  const updateProduct = useCallback(async (id: string, updates: Partial<Product>) => {
    if (!isAdmin || !db) return;
    await updateDoc(doc(db, 'products', id), updates);
  }, [isAdmin, db]);

  const deleteProduct = useCallback(async (id: string) => {
    if (!isAdmin || !db) return;
    await deleteDoc(doc(db, 'products', id));
  }, [isAdmin, db]);

  const addImage = useCallback(async (data: { url: string; altText: string }) => {
    if (!isAdmin || !db) return;
    await addDoc(collection(db, 'images'), {
      ...data,
      createdAt: serverTimestamp(),
    });
  }, [isAdmin, db]);

  const getProductById = useCallback((id: string) => {
    return products.find((p: Product) => p.id === id);
  }, [products]);

  const contextValue: ProductContextType = {
    products,
    images,
    loading: collectionLoading || imagesLoading || profileLoading,
    addProduct,
    updateProduct,
    deleteProduct,
    addImage,
    getProductById,
  };

  return (
    <ProductContext.Provider value={contextValue}>
      {children}
    </ProductContext.Provider>
  );
}

export function useProducts() {
  return useContext(ProductContext);
}
