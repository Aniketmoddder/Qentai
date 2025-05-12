'use server';

import { db } from '@/lib/firebase';
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

const usersCollection = collection(db, 'users');
const ADMIN_EMAIL = 'ninjax.desi@gmail.com';

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
  userData: Partial<Omit<AppUser, 'createdAt' | 'lastLoginAt' | 'updatedAt' | 'bannerImageUrl'>> & { uid: string; photoURL?: string | null; bannerImageUrl?: string | null }
): Promise<AppUser> => {
  const userRef = doc(usersCollection, userData.uid);
  try {
    const userSnap = await getDoc(userRef);
    let role: AppUserRole;
    let finalStatus: AppUser['status'];
    let finalUserDataForDb: any;

    const defaultUsername = userData.email ? userData.email.split('@')[0] : `user_${userData.uid.substring(0,5)}`;
    const defaultFullName = userData.displayName || null;

    if (userSnap.exists()) {
      const existingData = userSnap.data() as AppUser;
      role = existingData.role;
      finalStatus = existingData.status;

      if (userData.email === ADMIN_EMAIL && existingData.role !== 'owner') {
        role = 'owner';
      } else if (userData.email === ADMIN_EMAIL && existingData.role === 'owner') {
        // Role remains 'owner' if already owner
        role = 'owner';
      }


      finalUserDataForDb = {
        email: userData.email || existingData.email,
        displayName: userData.displayName !== undefined ? userData.displayName : existingData.displayName, 
        photoURL: userData.photoURL !== undefined ? userData.photoURL : existingData.photoURL,
        bannerImageUrl: userData.bannerImageUrl !== undefined ? userData.bannerImageUrl : existingData.bannerImageUrl,
        username: userData.username || existingData.username || defaultUsername,
        fullName: userData.fullName !== undefined ? userData.fullName : (existingData.fullName || defaultFullName),
        role,
        status: finalStatus,
        lastLoginAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      // Ensure photoURL and bannerImageUrl are explicitly set to null if provided as such or empty string
      if (userData.photoURL === '' || userData.photoURL === null) finalUserDataForDb.photoURL = null;
      if (userData.bannerImageUrl === '' || userData.bannerImageUrl === null) finalUserDataForDb.bannerImageUrl = null;


      Object.keys(finalUserDataForDb).forEach(key => finalUserDataForDb[key] === undefined && key !== 'photoURL' && key !== 'bannerImageUrl' && delete finalUserDataForDb[key]);
      // Ensure photoURL and bannerImageUrl are kept if explicitly null

      await updateDoc(userRef, finalUserDataForDb);
      const updatedData = { 
        ...existingData, 
        ...finalUserDataForDb, 
        uid: userData.uid,
        lastLoginAt: new Date().toISOString(), 
        updatedAt: new Date().toISOString() 
      };
       return convertUserTimestampsForClient(updatedData);

    } else {
      role = userData.email === ADMIN_EMAIL ? 'owner' : 'member';
      finalStatus = 'active';

      finalUserDataForDb = {
        uid: userData.uid,
        email: userData.email || null,
        displayName: userData.displayName !== undefined ? userData.displayName : null, 
        photoURL: userData.photoURL !== undefined ? userData.photoURL : null,
        bannerImageUrl: userData.bannerImageUrl !== undefined ? userData.bannerImageUrl : null,
        username: userData.username || defaultUsername,
        fullName: userData.fullName !== undefined ? userData.fullName : defaultFullName,
        role: role,
        status: finalStatus,
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      if (userData.photoURL === '' || userData.photoURL === null) finalUserDataForDb.photoURL = null;
      if (userData.bannerImageUrl === '' || userData.bannerImageUrl === null) finalUserDataForDb.bannerImageUrl = null;

      await setDoc(userRef, finalUserDataForDb);
      const newUserDataForClient = {
        ...finalUserDataForDb,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
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
    
    // Clean undefined keys, but preserve explicit nulls for photoURL and bannerImageUrl
    Object.keys(dataToUpdate).forEach(key => {
        if (dataToUpdate[key] === undefined && key !== 'photoURL' && key !== 'bannerImageUrl') { 
             delete dataToUpdate[key]; 
        }
    });

    if (Object.keys(dataToUpdate).length > 1 || (Object.keys(dataToUpdate).length === 1 && !dataToUpdate.hasOwnProperty('updatedAt'))) { 
        await updateDoc(userRef, dataToUpdate);
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
