'use client';

import type { ReactNode, Dispatch, SetStateAction } from 'react';
import React, { createContext, useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';
import Container from '@/components/layout/container';
import Logo from '@/components/common/logo';
import { upsertAppUserInFirestore, getAppUserById } from '@/services/appUserService';
import type { AppUser } from '@/types/appUser';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

export interface AuthContextType {
  user: FirebaseUser | null;
  appUser: AppUser | null | undefined; 
  loading: boolean; 
  setLoading: Dispatch<SetStateAction<boolean>>; 
  refreshAppUser: () => Promise<void>;
  isInitializing: boolean; // Exposed for potential use by consumers
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null | undefined>(undefined);
  const [loading, setLoading] = useState(false); // General loading state, initially false
  const [isInitializing, setIsInitializing] = useState(true); // For the very first auth check

  const refreshAppUser = useCallback(async () => {
    if (auth.currentUser) {
      setLoading(true); 
      try {
        const fetchedAppUser = await getAppUserById(auth.currentUser.uid);
        setAppUser(fetchedAppUser);
      } catch (error) {
        console.error("Error refreshing app user data:", error);
        setAppUser(null);
      } finally {
        setLoading(false);
      }
    } else {
      setAppUser(null);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Don't set global `setLoading(true)` here for appUser fetch to avoid prolonged full-screen loader
        // The `isInitializing` flag handles the initial full-screen loader.
        try {
          let userDoc = await getAppUserById(firebaseUser.uid);

          if (userDoc) {
            const updates: Partial<AppUser> = {
              lastLoginAt: serverTimestamp() as any,
              updatedAt: serverTimestamp() as any,
            };
            let needsFirestoreUpdate = false;

            if (firebaseUser.displayName && firebaseUser.displayName !== userDoc.displayName) {
              updates.displayName = firebaseUser.displayName;
              if (!userDoc.fullName || userDoc.fullName === userDoc.displayName) {
                updates.fullName = firebaseUser.displayName;
              }
              needsFirestoreUpdate = true;
            }
            if (firebaseUser.photoURL && firebaseUser.photoURL !== userDoc.photoURL) {
              updates.photoURL = firebaseUser.photoURL;
              needsFirestoreUpdate = true;
            }

            if (needsFirestoreUpdate || !userDoc.lastLoginAt || !userDoc.updatedAt) {
              await updateDoc(doc(db, 'users', firebaseUser.uid), updates);
              userDoc = await getAppUserById(firebaseUser.uid); 
            } else {
               userDoc = {
                 ...userDoc,
                 lastLoginAt: new Date().toISOString(),
                 updatedAt: new Date().toISOString(),
               }
            }
            setAppUser(userDoc);
          } else {
            const newAppUserData = await upsertAppUserInFirestore({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
            });
            setAppUser(newAppUserData);
          }
        } catch (error) {
          console.error("Failed to process AppUser in AuthProvider:", error);
          setAppUser(null);
        }
      } else {
        setAppUser(null);
      }
      setIsInitializing(false); // Mark initial auth check as complete
    });

    return () => unsubscribe();
  }, []);

  if (isInitializing) { // Show preloader only during the very first auth state check
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
        <Container className="text-center">
          <div className="mx-auto mb-6" style={{ width: '100px', height: '100px' }}>
            <Logo iconSize={27} />
          </div>
          <Loader2 className="w-16 h-16 mx-auto animate-spin text-primary mb-6" />
          <p className="text-xl font-semibold text-foreground/90 font-orbitron">Loading Qentai</p>
          <p className="text-muted-foreground font-poppins">Please wait while we prepare your experience.</p>
        </Container>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, appUser, loading, setLoading, refreshAppUser, isInitializing }}>
      {children}
    </AuthContext.Provider>
  );
};