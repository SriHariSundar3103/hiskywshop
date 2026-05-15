'use client';

import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useUserProfile } from '@/firebase/auth/use-user-profile';
import { ReactNode, useState, useEffect } from 'react';

interface MaintenanceSettings {
  isEnabled: boolean;
  message?: string;
}

export function MaintenanceWrapper({ children }: { children: ReactNode }) {
  // HYDRATION FIX: Defer Firebase hooks until client is ready
  // This prevents SSR/prerendering from trying to access Firebase context
  const [isClientReady, setIsClientReady] = useState(false);

  useEffect(() => {
    setIsClientReady(true);
  }, []);

  // During SSR or before client is ready, just render children
  if (!isClientReady) {
    return <>{children}</>;
  }

  // Now safe to use Firebase hooks (client-side only)
  return <MaintenanceWrapperContent>{children}</MaintenanceWrapperContent>;
}

function MaintenanceWrapperContent({ children }: { children: ReactNode }) {
  const db = useFirestore();
  const { isAdmin } = useUserProfile();
  
  const settingsRef = useMemoFirebase(() => {
    if (!db) return null;
    return doc(db, 'shopSettings', 'global') as any;
  }, [db]);

  const { data: settings, isLoading } = useDoc<MaintenanceSettings>(settingsRef);

  // HYDRATION FIX: Always render children during loading state
  // This ensures server (during SSR) and client (during hydration) render the same content
  // Once loaded, show maintenance screen only if enabled
  if (isLoading) {
    return <>{children}</>;
  }

  // If maintenance mode is ON and user is NOT admin, show maintenance screen
  if (settings?.isEnabled && !isAdmin) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 text-center">
        <h1 className="text-4xl font-bold mb-4">Under Maintenance</h1>
        <p className="text-xl text-muted-foreground max-w-md">
          {settings.message || "We are currently updating our store to serve you better. Please check back soon."}
        </p>
      </div>
    );
  }

  // Otherwise, show the normal website
  return <>{children}</>;
}
