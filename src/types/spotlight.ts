
import type { Timestamp } from 'firebase/firestore';

export interface SpotlightSlide {
  id: string; // Firestore document ID
  order: number;
  status: 'live' | 'draft';
  animeId: string; // Reference to an anime document ID
  
  // Overridable fields
  overrideTitle: string | null;
  overrideDescription: string | null;

  // Custom URLs
  trailerUrl: string;
  backgroundImageUrl: string;

  // Timestamps
  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;
}

    