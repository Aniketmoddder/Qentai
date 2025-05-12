// Raw types matching AniList GraphQL API response structure
// This helps in parsing the direct response before transforming it to our app's Character/VoiceActor types.

export interface AniListName {
  full: string | null;
  native?: string | null;
  userPreferred?: string | null;
}

export interface AniListImage {
  large: string | null;
  medium?: string | null;
}

export interface AniListCharacterNode {
  id: number;
  name: AniListName | null;
  image: AniListImage | null;
}

export interface AniListVoiceActorNode {
  id: number;
  name: AniListName | null;
  image: AniListImage | null;
  languageV2?: string; // e.g. JAPANESE, ENGLISH
}

export interface AniListCharacterEdge {
  node: AniListCharacterNode;
  role?: 'MAIN' | 'SUPPORTING' | 'BACKGROUND'; // Role of the character in this specific media
  voiceActors?: AniListVoiceActorNode[];
}

export interface AniListCharacterConnection {
  edges: AniListCharacterEdge[];
}

export interface AniListMediaTitle {
  romaji?: string | null;
  english?: string | null;
  native?: string | null;
  userPreferred?: string | null;
}

export interface AniListMediaCoverImage {
  extraLarge?: string | null;
  large?: string | null;
  medium?: string | null;
  color?: string | null;
}

export interface AniListStudioNode {
    id: number;
    name: string;
    isAnimationStudio: boolean;
}

export interface AniListStudioEdge {
    id?: number; // Edge ID if available
    isMain: boolean;
    node: AniListStudioNode;
}
export interface AniListStudioConnection {
    edges: AniListStudioEdge[];
}

export interface AniListTrailer {
    id: string | null; // YouTube ID or similar
    site: string | null; // e.g., "youtube"
    thumbnail: string | null; // URL
}

export interface AniListDate {
    year: number | null;
    month: number | null; // 1-12
    day: number | null; // 1-31
}

export interface AniListMedia {
  id: number;
  idMal?: number | null; // MyAnimeList ID
  title?: AniListMediaTitle | null;
  bannerImage?: string | null;
  coverImage?: AniListMediaCoverImage | null;
  characters?: AniListCharacterConnection | null;
  description?: string | null; 
  genres?: string[] | null;
  status?: 'FINISHED' | 'RELEASING' | 'NOT_YET_RELEASED' | 'CANCELLED' | 'HIATUS' | null; 
  averageScore?: number | null; // 0-100 scale
  popularity?: number | null;
  season?: 'WINTER' | 'SPRING' | 'SUMMER' | 'FALL' | null;
  seasonYear?: number | null;
  format?: 'TV' | 'TV_SHORT' | 'MOVIE' | 'SPECIAL' | 'OVA' | 'ONA' | 'MUSIC' | 'MANGA' | 'NOVEL' | 'ONE_SHOT' | null; 
  duration?: number | null; // episode duration in minutes
  countryOfOrigin?: string | null; // ISO 3166-1 alpha-2 code
  source?: 'ORIGINAL' | 'MANGA' | 'LIGHT_NOVEL' | 'VISUAL_NOVEL' | 'VIDEO_GAME' | 'OTHER' | 'NOVEL' | 'DOUJINSHI' | 'ANIME' | 'WEB_NOVEL' | 'LIVE_ACTION' | 'GAME' | 'COMIC' | 'MULTIMEDIA_PROJECT' | 'PICTURE_BOOK' | null; // AniList source type
  studios?: AniListStudioConnection | null;
  episodes?: number | null; // Total number of episodes
  trailer?: AniListTrailer | null;
  startDate?: AniListDate | null;
  endDate?: AniListDate | null;
}

export interface AniListGraphQLResponse<T> {
  data: T;
  errors?: { message: string }[];
}

export interface AniListMediaData {
  Media: AniListMedia | null;
}
