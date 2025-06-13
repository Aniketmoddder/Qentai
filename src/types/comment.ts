
// src/types/comment.ts
import type { Timestamp } from 'firebase/firestore';

export interface Comment {
  id: string; // Firestore document ID
  animeId: string;
  episodeId: string;
  userId: string;
  userDisplayName: string | null;
  userUsername?: string | null; // Added username
  userPhotoURL: string | null;
  text: string;
  parentId?: string | null; // For replies
  createdAt: Timestamp | string; // Firestore Timestamp or ISO string for client
  updatedAt?: Timestamp | string;
  likes: number;
  likedBy: string[]; // Array of user UIDs who liked
  dislikes: number;
  dislikedBy: string[]; // Array of user UIDs who disliked
  replyCount?: number; // To show number of replies without fetching all
  isEdited?: boolean;
  isDeleted?: boolean; // Soft delete
}
