
import type { AppUser } from '@/types/appUser';
import { Timestamp } from 'firebase/firestore';

export const convertUserTimestampsForClient = (userData: any): AppUser => {
  const data = { ...userData };

  const convertTimestamp = (field: any): string | undefined => {
    if (field instanceof Timestamp) {
      return field.toDate().toISOString();
    }
    // Handle cases where Timestamps might be plain objects (e.g., from server to client)
    if (typeof field === 'object' && field !== null && 'seconds' in field && 'nanoseconds' in field) {
      if (typeof field.seconds === 'number' && typeof field.nanoseconds === 'number') {
        return new Timestamp(field.seconds, field.nanoseconds).toDate().toISOString();
      }
    }
    // If it's already a string, assume it's ISO or a valid date string
    if (typeof field === 'string') {
        try {
            // Validate if it's a valid date string before returning
            new Date(field).toISOString();
            return field;
        } catch (e) {
            console.warn(`Invalid date string encountered in convertUserTimestampsForClient: ${field}`);
            return undefined; // Or handle as per requirement, e.g., return field as is if preferred
        }
    }
    return undefined;
  };

  data.createdAt = convertTimestamp(data.createdAt);
  data.lastLoginAt = convertTimestamp(data.lastLoginAt);
  data.updatedAt = convertTimestamp(data.updatedAt);

  return data as AppUser;
};
