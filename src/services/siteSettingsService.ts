'use server';

import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp, FirestoreError } from 'firebase/firestore';
import type { Theme } from '@/context/ThemeContext';

const SETTINGS_COLLECTION = 'settings';
const SITE_CONFIG_DOC_ID = 'siteConfiguration';

interface SiteConfiguration {
  defaultTheme?: Theme;
  updatedAt?: any; // Firestore ServerTimestamp
}

const handleFirestoreError = (error: unknown, context: string): FirestoreError => {
  console.error(`Firestore Error in ${context}:`, error);
  if (error instanceof FirestoreError) {
    return error;
  }
  const genericError = new FirestoreError('unknown', `An unknown error occurred in ${context}.`);
  if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string') {
    (genericError as any).message = error.message;
  }
  return genericError;
};

export async function getDefaultSiteTheme(): Promise<Theme | null> {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, SITE_CONFIG_DOC_ID);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const config = docSnap.data() as SiteConfiguration;
      return config.defaultTheme || null;
    }
    return null; // No default theme set in Firestore
  } catch (error) {
    // It's important to handle the case where the settings document might not exist
    // or there's a permission issue, especially on first load or if rules are restrictive.
    if (error instanceof FirestoreError && (error.code === 'permission-denied' || error.code === 'unauthenticated')) {
        console.warn(`Permission denied or unauthenticated access when fetching default site theme. This might be expected if anonymous users cannot read site settings. Falling back to application default. Error: ${error.message}`);
    } else {
        console.error("Error fetching default site theme:", handleFirestoreError(error, 'getDefaultSiteTheme').message);
    }
    return null; // Fallback if error
  }
}

export async function updateDefaultSiteTheme(theme: Theme): Promise<void> {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, SITE_CONFIG_DOC_ID);
    await setDoc(docRef, { defaultTheme: theme, updatedAt: serverTimestamp() }, { merge: true });
  } catch (error) {
    console.error("Error updating default site theme:", error);
    throw handleFirestoreError(error, 'updateDefaultSiteTheme'); // Re-throw to be caught by the calling component
  }
}