'use client';

import { useDoc, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useUserProfile } from '@/firebase/auth/use-user-profile';
import { ReactNode } from 'react';

interface MaintenanceSettings {
  isEnabled: boolean;
  message?: string;
}

export function MaintenanceWrapper({ children }: { children: ReactNode }) {
  const db = useFirestore();
  const { isAdmin } = useUserProfile();
  
  const { data: settings, isLoading } = useDoc<MaintenanceSettings>(
    db ? doc(db, 'shopSettings', 'global') : null
  );

  if (isLoading) {
    return null; // or a loading spinner
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
