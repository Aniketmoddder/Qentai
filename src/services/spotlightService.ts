
'use server';

import { db } from '@/lib/firebase';
import type { SpotlightSlide } from '@/types/spotlight';
import {
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  FirestoreError,
  serverTimestamp,
  addDoc,
} from 'firebase/firestore';
import { revalidatePath } from 'next/cache';

const spotlightCollection = collection(db, 'spotlight');

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

// Convert Firestore Timestamps to ISO strings for client components
const convertSpotlightTimestampsForClient = (slideData: any): SpotlightSlide => {
    const data = { ...slideData };
    if (data.createdAt instanceof Timestamp) {
        data.createdAt = data.createdAt.toDate().toISOString();
    }
    if (data.updatedAt instanceof Timestamp) {
        data.updatedAt = data.updatedAt.toDate().toISOString();
    }
    return data as SpotlightSlide;
}

export async function getSpotlightSlides(): Promise<SpotlightSlide[]> {
  try {
    const q = query(spotlightCollection, orderBy('order', 'asc'), limit(8));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(docSnap => 
        convertSpotlightTimestampsForClient({ id: docSnap.id, ...docSnap.data() })
    );
  } catch (error) {
    throw handleFirestoreError(error, 'getSpotlightSlides');
  }
}

export async function addSpotlightSlide(data: Omit<SpotlightSlide, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  try {
    const docRef = await addDoc(spotlightCollection, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    revalidatePath('/'); // Revalidate homepage
    revalidatePath('/admin/spotlight-manager');
    return docRef.id;
  } catch (error) {
    throw handleFirestoreError(error, 'addSpotlightSlide');
  }
}

export async function updateSpotlightSlide(id: string, data: Partial<Omit<SpotlightSlide, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> {
  const docRef = doc(spotlightCollection, id);
  try {
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
    revalidatePath('/');
    revalidatePath('/admin/spotlight-manager');
  } catch (error) {
    throw handleFirestoreError(error, `updateSpotlightSlide (id: ${id})`);
  }
}

export async function deleteSpotlightSlide(id: string): Promise<void> {
  const docRef = doc(spotlightCollection, id);
  try {
    await deleteDoc(docRef);
    revalidatePath('/');
    revalidatePath('/admin/spotlight-manager');
  } catch (error) {
    throw handleFirestoreError(error, `deleteSpotlightSlide (id: ${id})`);
  }
}

    