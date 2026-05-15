'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect, useRef } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { signInAnonymously } from 'firebase/auth';

interface FirebaseProviderProps {
  children: ReactNode;
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
}

// Internal state for user authentication
interface UserAuthState {
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// Combined state for the Firebase context
export interface FirebaseContextState {
  areServicesAvailable: boolean; // True if core services (app, firestore, auth instance) are provided
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null; // The Auth service instance
  // User authentication state
  user: User | null;
  isUserLoading: boolean; // True during initial auth check
  userError: Error | null; // Error from auth listener
}

// Return type for useFirebase()
export interface FirebaseServicesAndUser {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// Return type for useUser() - specific to user auth state
export interface UserHookResult { // Renamed from UserAuthHookResult for consistency if desired, or keep as UserAuthHookResult
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// React Context
export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

/**
 * FirebaseProvider manages and provides Firebase services and user authentication state.
 */
export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  children,
  firebaseApp,
  firestore,
  auth,
}) => {

  const [userAuthState, setUserAuthState] = useState<UserAuthState>({
    user: null,
    isUserLoading: true, // Start loading until first auth event
    userError: null,
  });

  const hasInitiatedAnonymousRef = useRef(false);

  // Auto-initiate anonymous auth for guest users (after initial auth check completes)
  useEffect(() => {
    if (!auth || hasInitiatedAnonymousRef.current) return;

    if (userAuthState.user === null && !userAuthState.isUserLoading && !hasInitiatedAnonymousRef.current) {
      hasInitiatedAnonymousRef.current = true;
      signInAnonymously(auth).catch(err => {
          console.error("FirebaseProvider: Anonymous sign-in failed:", err);
          setUserAuthState(prev => ({ ...prev, userError: err }));
      });
    }
  }, [auth, userAuthState.user, userAuthState.isUserLoading]);

  // Effect to subscribe to Firebase auth state changes

  // Effect to subscribe to Firebase auth state changes
  useEffect(() => {
    // Guard: do not subscribe if auth instance is missing.
    if (!auth) {
      setUserAuthState({
        user: null,
        isUserLoading: false,
        userError: new Error('Auth service not provided.'),
      });
      return;
    }

    // Reset on auth instance change
    setUserAuthState({ user: null, isUserLoading: true, userError: null });

    // Subscribe to Firebase auth state changes
    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        setUserAuthState({ user: firebaseUser, isUserLoading: false, userError: null });
      },
      (error) => {
        console.error('FirebaseProvider: onAuthStateChanged error:', error);
        setUserAuthState({ user: null, isUserLoading: false, userError: error });
      }
    );

    return () => {
      // Guard in case firebase throws during subscription
      try {
        unsubscribe();
      } catch {
        // no-op
      }
    };
  }, [auth]); // Depends on the auth instance


  // Memoize the context value
  const contextValue = useMemo((): FirebaseContextState => {
    const servicesAvailable = !!(firebaseApp && firestore && auth);
    return {
      areServicesAvailable: servicesAvailable,
      firebaseApp: servicesAvailable ? firebaseApp : null,
      firestore: servicesAvailable ? firestore : null,
      auth: servicesAvailable ? auth : null,
      user: userAuthState.user,
      isUserLoading: userAuthState.isUserLoading,
      userError: userAuthState.userError,
    };
  }, [firebaseApp, firestore, auth, userAuthState]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};

/**
 * Hook to access core Firebase services and user authentication state.
 * Throws error if core services are not available or used outside provider.
 */
export const useFirebase = (): FirebaseServicesAndUser | null => {
  const context = useContext(FirebaseContext);

  // Special pages like `/_not-found` can render outside the provider tree.
  // Return null instead of throwing so consumers can safely guard.
  if (context === undefined) {
    return null;
  }

  if (
    !context.areServicesAvailable ||
    !context.firebaseApp ||
    !context.firestore ||
    !context.auth
  ) {
    return null;
  }

  return {
    firebaseApp: context.firebaseApp,
    firestore: context.firestore,
    auth: context.auth,
    user: context.user,
    isUserLoading: context.isUserLoading,
    userError: context.userError,
  };
};

/** Hook to access Firebase Auth instance.
 * Returns null when used outside the provider tree.
 */
export const useAuth = (): Auth | null => {
  return useFirebase()?.auth ?? null;
};

/** Hook to access Firestore instance.
 * Returns null when used outside the provider tree.
 */
export const useFirestore = (): Firestore | null => {
  return useFirebase()?.firestore ?? null;
};

/** Hook to access Firebase App instance.
 * Returns null when used outside the provider tree.
 */
export const useFirebaseApp = (): FirebaseApp | null => {
  return useFirebase()?.firebaseApp ?? null;
};

type MemoFirebase <T> = T & {__memo?: boolean};

export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T | (MemoFirebase<T>) {
  const memoized = useMemo(factory, deps);
  
  if(typeof memoized !== 'object' || memoized === null) return memoized;
  (memoized as MemoFirebase<T>).__memo = true;
  
  return memoized;
}

/**
 * Hook specifically for accessing the authenticated user's state.
 * This provides the User object, loading status, and any auth errors.
 * @returns {UserHookResult} Object with user, isUserLoading, userError.
 */
export const useUser = (): UserHookResult => {
  const firebase = useFirebase();

  return {
    user: firebase?.user ?? null,
    isUserLoading: firebase?.isUserLoading ?? false,
    userError: firebase?.userError ?? null,
  };
};
