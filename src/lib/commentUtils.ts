
// src/lib/commentUtils.ts
import type { Comment } from '@/types/comment';
import { Timestamp } from 'firebase/firestore';

// Helper to convert Firestore Timestamps to ISO strings for client components
export const convertCommentTimestampsForClient = (commentData: any): Comment => {
  const data = { ...commentData };

  const convertTimestamp = (field: any): string | undefined => {
    if (!field) return undefined;
    if (field instanceof Timestamp) {
      return field.toDate().toISOString();
    }
    if (typeof field === 'object' && field !== null && 'seconds' in field && 'nanoseconds' in field) {
      if (typeof field.seconds === 'number' && typeof field.nanoseconds === 'number') {
        return new Timestamp(field.seconds, field.nanoseconds).toDate().toISOString();
      }
    }
    if (typeof field === 'string') {
      try {
        return new Date(field).toISOString();
      } catch (e) {
        console.warn(`Invalid date string for conversion in commentUtils: ${field}`, e);
        return undefined; 
      }
    }
    console.warn(`Unexpected date/timestamp format for conversion in commentUtils: ${JSON.stringify(field)}`);
    return undefined;
  };

  data.createdAt = convertTimestamp(data.createdAt);
  data.updatedAt = convertTimestamp(data.updatedAt);
  
  return data as Comment;
};
