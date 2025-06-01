
import type { Timestamp } from 'firebase/firestore';

export type ReportIssueType =
  | 'video-not-playing'
  | 'wrong-video-episode'
  | 'audio-issue'
  | 'subtitle-issue'
  | 'buffering-lagging'
  | 'other';

export interface Report {
  id: string; // Firestore document ID
  userId?: string | null; // UID of the reporting user, null if anonymous
  userEmail?: string | null; // Email of reporting user, if available
  animeId: string;
  animeTitle?: string; // For easier identification in admin panel
  episodeId?: string | null;
  episodeTitle?: string | null; // For easier identification
  sourceUrl?: string | null;
  sourceLabel?: string | null;
  issueType: ReportIssueType;
  description: string;
  status: 'open' | 'in-progress' | 'resolved' | 'wont-fix';
  createdAt: Timestamp | string; // Firestore Timestamp or ISO string for client
  updatedAt?: Timestamp | string;
  notes?: string; // Admin notes
}
