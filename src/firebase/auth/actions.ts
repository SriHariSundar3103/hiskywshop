'use client';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import { initializeFirebase } from '@/firebase';

async function mockProfile(user: User) {
  return {
    uid: user.uid,
    email: user.email || '',
    displayName: user.displayName || '',
    photoURL: user.photoURL || '',
    role: user.email === 'sri352006@gmail.com' ? 'admin' : 'user',
  };
}

export async function signInWithGoogle(): Promise<{ user: User; profile: any } | null> {
  const { auth } = initializeFirebase();
  if (!auth) {
    console.error('Firebase not initialized');
    return null;
  }
  
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    const profile = await mockProfile(user);
    return { user, profile };
  } catch (error: any) {
    console.error("Sign-in error:", error);
    return null;
  }
}

export async function signOut() {
  const { auth } = initializeFirebase();
  if (!auth) return;
  await firebaseSignOut(auth);
}

