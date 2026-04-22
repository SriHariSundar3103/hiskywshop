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

import { doc, getDoc, setDoc } from 'firebase/firestore';

export async function signInWithGoogle(): Promise<{ user: User; profile: any } | null> {
  const { auth, firestore } = initializeFirebase();
  if (!auth) {
    console.error('Firebase not initialized');
    return null;
  }
  
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    
    // Auto-admin detection logic
    const role = user.email === 'sri352006@gmail.com' ? 'admin' : 'user';
    
    if (firestore) {
      const userRef = doc(firestore, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || '',
          photoURL: user.photoURL || '',
          role: role
        });
      } else if (userSnap.data().role !== role && user.email === 'sri352006@gmail.com') {
         await setDoc(userRef, { role: role }, { merge: true });
      }
    }

    return { user, profile: { role } };
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

