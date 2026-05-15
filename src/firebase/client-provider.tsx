'use client';

import React, { useMemo, type ReactNode, useState, useEffect } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  // HYDRATION FIX: Add client-ready gate
  // This ensures Firebase only initializes on the client, never during SSR
  const [isClientReady, setIsClientReady] = useState(false);

  const firebaseServices = useMemo(() => {
    // Only initialize Firebase when client is ready
    if (!isClientReady) return null;
    return initializeFirebase();
  }, [isClientReady]);

  // Set client-ready flag after component mounts (client-side only)
  useEffect(() => {
    setIsClientReady(true);
  }, []);

  // Don't render Firebase-dependent children until Firebase is initialized
  if (!firebaseServices) {
    // Return children anyway to prevent hydration mismatch
    // Firebase services will be available in context as null during this brief moment
    return <>{children}</>;
  }

  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.firebaseApp}
      auth={firebaseServices.auth}
      firestore={firebaseServices.firestore}
    >
      {children}
    </FirebaseProvider>
  );
}