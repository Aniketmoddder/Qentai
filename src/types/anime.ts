import type { Timestamp } from 'firebase/firestore';

export interface VoiceActor {
  id?: number; // AniList voice actor ID
  name: string | null;
  image: string | null; // URL
  language?: string; // e.g., JAPANESE, ENGLISH
}

export interface CharacterNode { // From AniList structure
  id: number;
  name: {
    full: string | null;
    native?: string | null;
    userPreferred?: string | null;
  } | null;
  image: {
    large: string | null;
    medium?: string | null;
  } | null;
}

export interface CharacterEdge { // From AniList structure
  node: CharacterNode;
  role?: 'MAIN' | 'SUPPORTING' | 'BACKGROUND'; // Role of the character in the media
  voiceActors?: { 
    id: number;
    name: {
      full: string | null;
      native?: string | null;
      userPreferred?: string | null;
    } | null;
    image: {
      large: string | null;
      medium?: string | null;
    } | null;
    languageV2?: string; 
  }[];
}


export interface Character {
  id: number; 
  name: string | null;
  role?: 'MAIN' | 'SUPPORTING' | 'BACKGROUND' | string; 
  image: string | null; 
  voiceActors?: VoiceActor[]; 
}

export interface Anime {
  id: string; 
  tmdbId?: string;
  aniListId?: number;
  title: string;
  coverImage: string; // Prioritize AniList large/extraLarge, then TMDB poster
  bannerImage?: string; // Prioritize AniList banner, then TMDB backdrop
  year: number;
  genre: string[];
  status: 'Ongoing' | 'Completed' | 'Upcoming' | 'Unknown' | 'Airing' | 'Not Yet Aired' | 'Cancelled' | 'Hiatus'; // Expanded for AniList statuses
  synopsis: string;
  averageRating?: number; // TMDB: 0-10, AniList: 0-10 (derived from 0-100)
  episodes?: Episode[];
  type?: 'TV' | 'Movie' | 'OVA' | 'Special' | 'Unknown' | 'ONA' | 'Music'; // Consistent with Firestore enum
  sourceAdmin?: 'tmdb' | 'manual' | 'tmdb_anilist' | 'anilist';
  isFeatured?: boolean;
  trailerUrl?: string; // YouTube URL
  downloadPageUrl?: string; // New field for download page link
  characters?: Character[];
  createdAt?: string; // ISO string on client
  updatedAt?: string; // ISO string on client
  
  // Fields enriched or primarily from AniList
  season?: 'WINTER' | 'SPRING' | 'SUMMER' | 'FALL' | string | null; // AniList specific season, allow string for flexibility
  seasonYear?: number;
  countryOfOrigin?: string | null; // ISO 3166-1 alpha-2 code
  studios?: { id: number; name: string; isAnimationStudio: boolean; }[];
  source?: 'ORIGINAL' | 'MANGA' | 'LIGHT_NOVEL' | 'VISUAL_NOVEL' | 'VIDEO_GAME' | 'OTHER' | 'NOVEL' | 'DOUJINSHI' | 'ANIME' | 'WEB_NOVEL' | 'LIVE_ACTION' | 'GAME' | 'COMIC' | 'MULTIMEDIA_PROJECT' | 'PICTURE_BOOK' | string | null; // Allow string
  popularity?: number;
  format?: 'TV' | 'TV_SHORT' | 'MOVIE' | 'SPECIAL' | 'OVA' | 'ONA' | 'MUSIC' | 'MANGA' | 'NOVEL' | 'ONE_SHOT' | string | null; // From AniList, allow string
  duration?: number | null; // Episode duration in minutes
  airedFrom?: string | null; // ISO date string (YYYY-MM-DD)
  airedTo?: string | null; // ISO date string (YYYY-MM-DD)
  episodesCount?: number | null; // Total number of episodes from AniList/TMDB
}

export interface Episode {
  id: string; 
  tmdbEpisodeId?: number;
  title: string;
  episodeNumber: number;
  seasonNumber: number;
  thumbnail?: string;
  duration?: string | number; // Can be string like "24min" or number of minutes
  url?: string | null; // Ensure it can be null
  airDate?: string | null; // ISO date string (YYYY-MM-DD)
  overview?: string;
}

// Season type might not be directly stored if episodes array contains all info.
// Kept for potential future structure or TMDB direct season mapping.
export interface Season {
  id: string;
  tmdbSeasonId?: number;
  seasonNumber: number;
  title?: string;
  episodes: Episode[];
  airDate?: string;
  posterPath?: string;
  overview?: string;
}

export interface AnimeRecommendation {
  id: string;
  title: string;
  coverImage: string;
  reason?: string;
}