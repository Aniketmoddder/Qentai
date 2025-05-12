
import type { Anime } from '@/types/anime';
import type { AniListMedia } from '@/types/anilist';
import { Timestamp } from 'firebase/firestore';

// Helper to convert Firestore Timestamps to ISO strings for client components
export const convertAnimeTimestampsForClient = (animeData: any): Omit<Anime, 'createdAt' | 'updatedAt' | 'airedFrom' | 'airedTo'> & { createdAt?: string; updatedAt?: string; airedFrom?: string; airedTo?: string; } => {
  const data = { ...animeData };

  const convertTimestampToISO = (field: any): string | undefined => {
    if (!field) return undefined;
    if (field instanceof Timestamp) {
      return field.toDate().toISOString();
    }
    // Handle cases where Timestamps might be plain objects (e.g., from server to client)
    if (typeof field === 'object' && field !== null && 'seconds' in field && 'nanoseconds' in field) {
      if (typeof field.seconds === 'number' && typeof field.nanoseconds === 'number') {
        return new Timestamp(field.seconds, field.nanoseconds).toDate().toISOString();
      }
    }
    // If it's already a string, try to parse and reformat to ensure consistency, or return if valid ISO
    if (typeof field === 'string') {
      try {
        // Attempt to parse and re-serialize to ensure it's a valid ISO string
        return new Date(field).toISOString();
      } catch (e) {
        // If parsing fails, it might not be a valid date string
        console.warn(`Invalid date string encountered for conversion: ${field}`, e);
        return undefined; 
      }
    }
    console.warn(`Unexpected date/timestamp format for conversion: ${JSON.stringify(field)}`);
    return undefined;
  };
  
  const convertTimestampToDateOnlyISO = (field: any): string | undefined => {
    const isoString = convertTimestampToISO(field);
    return isoString ? isoString.split('T')[0] : undefined;
  };


  data.createdAt = convertTimestampToISO(data.createdAt);
  data.updatedAt = convertTimestampToISO(data.updatedAt);
  data.airedFrom = convertTimestampToDateOnlyISO(data.airedFrom);
  data.airedTo = convertTimestampToDateOnlyISO(data.airedTo);
  
  if (data.episodes && Array.isArray(data.episodes)) {
    data.episodes = data.episodes.map((ep: any) => {
      const episode = { ...ep };
      episode.airDate = convertTimestampToDateOnlyISO(episode.airDate);
      return episode;
    });
  }
  return data as Omit<Anime, 'createdAt' | 'updatedAt' | 'airedFrom' | 'airedTo'> & { createdAt?: string; updatedAt?: string; airedFrom?: string; airedTo?: string; };
};


export function mapAniListStatusToAppStatus(aniListStatus?: AniListMedia['status'] | null): Anime['status'] {
  if (!aniListStatus) return 'Unknown';
  switch (aniListStatus) {
    case 'FINISHED':
      return 'Completed';
    case 'RELEASING':
      return 'Ongoing';
    case 'NOT_YET_RELEASED':
      return 'Upcoming';
    case 'CANCELLED':
      return 'Cancelled'; 
    case 'HIATUS':
      return 'Hiatus'; 
    default:
      return 'Unknown';
  }
}

export function mapAniListFormatToAppType(aniListFormat?: AniListMedia['format'] | null): Anime['type'] {
    if (!aniListFormat) return 'Unknown';
    switch (aniListFormat) {
        case 'TV': return 'TV';
        case 'TV_SHORT': return 'TV'; 
        case 'MOVIE': return 'Movie';
        case 'SPECIAL': return 'Special';
        case 'OVA': return 'OVA';
        case 'ONA': return 'OVA'; 
        case 'MUSIC': return 'Music';
        default: return 'Unknown';
    }
}
