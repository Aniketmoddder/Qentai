import type { Timestamp } from 'firebase/firestore';

export type AppUserRole = 'owner' | 'admin' | 'member';

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null; // This can serve as a default if fullName is not set
  photoURL: string | null;
  bannerImageUrl?: string | null; // Added banner image URL
  username?: string; // Optional username
  fullName?: string; // Optional full name
  role: AppUserRole;
  status: 'active' | 'banned' | 'pending'; // Example statuses
  createdAt?: Timestamp | string; // Firestore Timestamp or ISO string
  lastLoginAt?: Timestamp | string; // Firestore Timestamp or ISO string
  updatedAt?: Timestamp | string; // Added updatedAt field
}
