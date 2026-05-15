'use client';

import { useUser } from '@/firebase/auth/use-user';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';

export function useUserProfile() {
  const { user, loading: userLoading } = useUser();
  const db = useFirestore();

  // Don't fetch profile for anonymous users — they are never admins
  const isAnonymous = user?.isAnonymous ?? false;

  const userProfileRef = useMemoFirebase(() => {
    if (!db || !user || isAnonymous) return null;
    return doc(db, 'users', user.uid) as any;
  }, [db, user, isAnonymous]);

  const { data: userProfile, isLoading: profileLoading } = useDoc<UserProfile>(userProfileRef);

  const loading = userLoading || (!isAnonymous && !!user && profileLoading);

  return {
    user,
    userProfile: userProfile ?? null,
    loading,
isAdmin: userProfile?.role === 'admin' || user?.email === 'sri352006@gmail.com' || user?.email === 'kumarshiva7681@gmail.com',
  };
}
