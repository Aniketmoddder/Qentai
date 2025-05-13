'use server';

import { db, auth as firebaseAuth } from '@/lib/firebase'; // Imported firebaseAuth to check provider
import type { AppUser, AppUserRole } from '@/types/appUser';
import { convertUserTimestampsForClient } from '@/lib/userUtils';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  updateDoc,
  query,
  orderBy,
  serverTimestamp,
  FirestoreError,
  Timestamp,
  setDoc,
  limit,
  where,
} from 'firebase/firestore';
import { revalidatePath } from 'next/cache';

const usersCollection = collection(db, 'users');
const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'ninjax.desi@gmail.com';


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

export const upsertAppUserInFirestore = async (
  userData: Partial<Omit<AppUser, 'createdAt' | 'lastLoginAt' | 'updatedAt' >> & {
    uid: string;
    email: string | null;
    displayName?: string | null; // Firebase User's displayName
    photoURL?: string | null;    // Firebase User's photoURL
    username?: string;
    fullName?: string;
    // bannerImageUrl is not passed directly here for Google Sign-In if we want them to choose
  }
): Promise<AppUser> => {
  const userRef = doc(usersCollection, userData.uid);
  try {
    const userSnap = await getDoc(userRef);
    let finalUserDataForDb: Partial<AppUser>;

    const defaultUsername = userData.email ? userData.email.split('@')[0] : `user_${userData.uid.substring(0,5)}`;
    const defaultFullName = userData.displayName || null;

    if (userSnap.exists()) {
      // Existing user
      const existingData = userSnap.data() as AppUser;
      let role = existingData.role;
      if (userData.email === ADMIN_EMAIL && existingData.role !== 'owner') {
        role = 'owner';
      }

      finalUserDataForDb = {
        email: userData.email !== undefined ? userData.email : existingData.email,
        displayName: userData.displayName !== undefined ? userData.displayName : existingData.displayName,
        // Preserve existing Qentai choices unless explicitly updated elsewhere.
        // Google's photoURL might be passed in userData.photoURL, but we prioritize existingData.
        photoURL: existingData.photoURL,
        bannerImageUrl: existingData.bannerImageUrl,
        username: userData.username || existingData.username || defaultUsername,
        fullName: userData.fullName !== undefined ? userData.fullName : (existingData.fullName || defaultFullName),
        role,
        status: existingData.status || 'active',
        lastLoginAt: serverTimestamp() as any,
        updatedAt: serverTimestamp() as any,
      };
      
      // If Firebase auth's photoURL is different and Qentai's is null, consider it for initial setup.
      // This case handles if user previously logged in with Google but didn't complete Qentai profile setup.
      if (userData.photoURL && existingData.photoURL === null) {
        // This scenario is tricky. For now, we assume if existingData.photoURL is null, they still need to pick.
        // If we wanted to use Google's as a fallback:
        // finalUserDataForDb.photoURL = userData.photoURL;
      }


      await updateDoc(userRef, finalUserDataForDb);
      const updatedClientData: AppUser = {
        ...existingData,
        ...finalUserDataForDb,
        uid: userData.uid,
        lastLoginAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdAt: existingData.createdAt ? (typeof existingData.createdAt === 'string' ? existingData.createdAt : (existingData.createdAt as Timestamp).toDate().toISOString()) : new Date().toISOString(),
      };
      revalidatePath(`/profile`);
      revalidatePath(`/admin/user-management`);
      return convertUserTimestampsForClient(updatedClientData);

    } else {
      // New user
      const isGoogleSignInProvider = firebaseAuth.currentUser?.providerData.some(p => p.providerId === 'google.com');
      let role: AppUserRole = userData.email === ADMIN_EMAIL ? 'owner' : 'member';

      finalUserDataForDb = {
        uid: userData.uid,
        email: userData.email || null,
        displayName: userData.displayName || null,
        // For NEW users (Google or Email/Pass), set photoURL and bannerImageUrl to null initially.
        // This forces them through the setup process on /profile/settings.
        photoURL: null,
        bannerImageUrl: null,
        username: userData.username || defaultUsername,
        fullName: userData.fullName || defaultFullName,
        role: role,
        status: 'active',
        createdAt: serverTimestamp() as any,
        lastLoginAt: serverTimestamp() as any,
        updatedAt: serverTimestamp() as any,
      };
      await setDoc(userRef, finalUserDataForDb);
      const newUserDataForClient = {
        ...finalUserDataForDb,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      revalidatePath(`/admin/user-management`);
      return convertUserTimestampsForClient(newUserDataForClient);
    }
  } catch (error) {
    throw handleFirestoreError(error, `upsertAppUserInFirestore (uid: ${userData.uid})`);
  }
};

export const updateAppUserProfile = async (
  uid: string,
  profileData: { username?: string; fullName?: string; photoURL?: string | null; bannerImageUrl?: string | null }
): Promise<void> => {
  const userRef = doc(usersCollection, uid);
  try {
    const dataToUpdate: { [key: string]: any } = { ...profileData, updatedAt: serverTimestamp() };
    
    if (profileData.hasOwnProperty('photoURL')) {
        dataToUpdate.photoURL = profileData.photoURL === '' ? null : profileData.photoURL;
    }
    if (profileData.hasOwnProperty('bannerImageUrl')) {
        dataToUpdate.bannerImageUrl = profileData.bannerImageUrl === '' ? null : profileData.bannerImageUrl;
    }
    
    // Filter out undefined values to avoid accidentally clearing fields in Firestore,
    // except for photoURL and bannerImageUrl which can explicitly be set to null.
    Object.keys(dataToUpdate).forEach(key => {
        if (dataToUpdate[key] === undefined && key !== 'photoURL' && key !== 'bannerImageUrl') { 
             delete dataToUpdate[key]; 
        }
    });

    if (Object.keys(dataToUpdate).filter(key => key !== 'updatedAt').length > 0) { 
        await updateDoc(userRef, dataToUpdate);
        revalidatePath(`/profile`);
        revalidatePath(`/profile/settings`);
        revalidatePath(`/admin/user-management`); 
    }
  } catch (error) {
    throw handleFirestoreError(error, `updateAppUserProfile (uid: ${uid})`);
  }
};


export const getAllAppUsers = async (count: number = 50): Promise<AppUser[]> => {
  try {
    const q = query(usersCollection, orderBy('createdAt', 'desc'), limit(count > 0 ? count : 500));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => convertUserTimestampsForClient(doc.data() as AppUser));
  } catch (error) {
     if (error instanceof FirestoreError && error.code === 'failed-precondition') {
        console.warn("Firestore query in getAllAppUsers requires an index on 'createdAt'. Please create this index in your Firebase console: Collection ID: users, Field: createdAt, Order: Descending.", error.message);
    }
    throw handleFirestoreError(error, 'getAllAppUsers');
  }
};

export const updateUserStatusInFirestore = async (uid: string, status: AppUser['status']): Promise<void> => {
  const userRef = doc(usersCollection, uid);
  try {
    const userDoc = await getDoc(userRef);
    if (userDoc.exists() && userDoc.data().email === ADMIN_EMAIL && status === 'banned') {
        throw new Error("The owner account cannot be banned.");
    }
    await updateDoc(userRef, { status: status, updatedAt: serverTimestamp() });
    revalidatePath(`/admin/user-management`);
  } catch (error) {
    throw handleFirestoreError(error, `updateUserStatusInFirestore (uid: ${uid})`);
  }
};


export const updateUserRoleInFirestore = async (uid: string, newRole: AppUserRole): Promise<void> => {
    const userRef = doc(usersCollection, uid);
    try {
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        const currentUserData = userDoc.data() as AppUser;
        if (currentUserData.email === ADMIN_EMAIL && currentUserData.role === 'owner' && newRole !== 'owner') {
          throw new Error("The primary owner's role cannot be changed from 'owner'.");
        }
        if (newRole === 'owner' && currentUserData.email !== ADMIN_EMAIL) {
             throw new Error("Cannot assign 'owner' role to a non-primary owner account.");
        }
      } else {
        throw new Error(`User with UID ${uid} not found.`);
      }
      await updateDoc(userRef, { role: newRole, updatedAt: serverTimestamp() });
      revalidatePath(`/admin/user-management`);
    } catch (error) {
      throw handleFirestoreError(error, `updateUserRoleInFirestore (uid: ${uid})`);
    }
  };

export const getAppUserById = async (uid: string): Promise<AppUser | null> => {
  if (!uid) return null;
  const userRef = doc(usersCollection, uid);
  try {
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
      return convertUserTimestampsForClient(docSnap.data() as AppUser);
    }
    console.warn(`User document for UID ${uid} not found in getAppUserById.`);
    return null;
  } catch (error) {
    throw handleFirestoreError(error, `getAppUserById (uid: ${uid})`);
  }
};

export const getAppUserByUsername = async (username: string): Promise<AppUser | null> => {
  if (!username || username.trim() === '') return null;
  try {
    const q = query(usersCollection, where("username", "==", username), limit(1));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      return convertUserTimestampsForClient(userDoc.data() as AppUser);
    }
    return null;
  } catch (error) {
    if (error instanceof FirestoreError && error.code === 'failed-precondition') {
      console.warn(`Firestore query in getAppUserByUsername requires an index on 'username'. Please create this index. Original error: ${error.message}`);
    }
    throw handleFirestoreError(error, `getAppUserByUsername (username: ${username})`);
  }
};
