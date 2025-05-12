'use server';

import { db } from '@/lib/firebase';
import {
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  collection,
  getDocs,
  serverTimestamp,
  query,
  orderBy,
  Timestamp,
  FirestoreError,
} from 'firebase/firestore';
import type { Anime } from '@/types/anime'; // For potential future use if storing more data

const handleFirestoreError = (error: unknown, context: string): FirestoreError => {
  console.error(`Firestore Error in ${context}:`, error);
  if (error instanceof FirestoreError) {
    return error;
  }
  // Create a generic FirestoreError if it's not already one
  const genericError = new FirestoreError('unknown', `An unknown error occurred in ${context}.`);
  // Attempt to copy relevant properties if possible
  if (typeof error === 'object' && error !== null) {
    if ('message' in error && typeof error.message === 'string') {
      (genericError as any).message = error.message;
    }
  }
  return genericError;
};

// --- Favorites ---

export const addToFavorites = async (userId: string, animeId: string): Promise<void> => {
  const favRef = doc(db, 'users', userId, 'favorites', animeId);
  try {
    await setDoc(favRef, { animeId, addedAt: serverTimestamp() });
  } catch (error) {
    throw handleFirestoreError(error, `addToFavorites (user: ${userId}, anime: ${animeId})`);
  }
};

export const removeFromFavorites = async (userId: string, animeId: string): Promise<void> => {
  const favRef = doc(db, 'users', userId, 'favorites', animeId);
  try {
    await deleteDoc(favRef);
  } catch (error) {
    throw handleFirestoreError(error, `removeFromFavorites (user: ${userId}, anime: ${animeId})`);
  }
};

export const isFavorite = async (userId: string, animeId: string): Promise<boolean> => {
  if (!userId || !animeId) return false;
  const favRef = doc(db, 'users', userId, 'favorites', animeId);
  try {
    const docSnap = await getDoc(favRef);
    return docSnap.exists();
  } catch (error) {
    throw handleFirestoreError(error, `isFavorite (user: ${userId}, anime: ${animeId})`);
  }
};

export const getUserFavoriteIds = async (userId: string): Promise<string[]> => {
  if (!userId) return [];
  const favCollectionRef = collection(db, 'users', userId, 'favorites');
  const q = query(favCollectionRef, orderBy('addedAt', 'desc'));
  try {
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data().animeId as string);
  } catch (error) {
    throw handleFirestoreError(error, `getUserFavoriteIds (user: ${userId})`);
  }
};

// --- Wishlist ---

export const addToWishlist = async (userId: string, animeId: string): Promise<void> => {
  const wishRef = doc(db, 'users', userId, 'wishlist', animeId);
  try {
    await setDoc(wishRef, { animeId, addedAt: serverTimestamp() });
  } catch (error) {
    throw handleFirestoreError(error, `addToWishlist (user: ${userId}, anime: ${animeId})`);
  }
};

export const removeFromWishlist = async (userId: string, animeId: string): Promise<void> => {
  const wishRef = doc(db, 'users', userId, 'wishlist', animeId);
  try {
    await deleteDoc(wishRef);
  } catch (error) {
    throw handleFirestoreError(error, `removeFromWishlist (user: ${userId}, anime: ${animeId})`);
  }
};

export const isInWishlist = async (userId: string, animeId: string): Promise<boolean> => {
  if (!userId || !animeId) return false;
  const wishRef = doc(db, 'users', userId, 'wishlist', animeId);
  try {
    const docSnap = await getDoc(wishRef);
    return docSnap.exists();
  } catch (error) {
    throw handleFirestoreError(error, `isInWishlist (user: ${userId}, anime: ${animeId})`);
  }
};

export const getUserWishlistIds = async (userId: string): Promise<string[]> => {
  if (!userId) return [];
  const wishCollectionRef = collection(db, 'users', userId, 'wishlist');
  const q = query(wishCollectionRef, orderBy('addedAt', 'desc'));
  try {
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data().animeId as string);
  } catch (error) {
    throw handleFirestoreError(error, `getUserWishlistIds (user: ${userId})`);
  }
};