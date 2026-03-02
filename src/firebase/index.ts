'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'

/**
 * Initializes Firebase SDKs. 
 * Optimized for Vercel, Local development, and Firebase App Hosting.
 */
export function initializeFirebase() {
  if (getApps().length) {
    return getSdks(getApp());
  }

  let firebaseApp: FirebaseApp;
  
  try {
    // Fallback logic for different environments
    // On Vercel/Local, we use the config object directly to avoid 'no-options' errors
    if (typeof window !== 'undefined' || process.env.VERCEL) {
      firebaseApp = initializeApp(firebaseConfig);
    } else {
      // Attempt automatic initialization for Firebase App Hosting
      try {
        firebaseApp = initializeApp();
      } catch (e) {
        firebaseApp = initializeApp(firebaseConfig);
      }
    }
  } catch (e) {
    // Final fallback
    firebaseApp = initializeApp(firebaseConfig);
  }

  return getSdks(firebaseApp);
}

export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp)
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
