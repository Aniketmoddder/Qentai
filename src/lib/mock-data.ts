
import type { Anime, Episode } from '@/types/anime';

// This file will no longer be the primary source of anime data.
// Data will be fetched from Firestore via animeService.ts.
// You can use this for local testing or initial data seeding scripts if needed.

// Example structure, but not actively used by the app's main fetching logic anymore.
const commonEpisodes: Episode[] = [
  { id: 'ep1-common', title: 'The Journey Unfolds', episodeNumber: 1, url: 'https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-576p.mp4', duration: '24min', thumbnail: 'https://picsum.photos/seed/ep1commonthumb/320/180' },
  { id: 'ep2-common', title: 'Secrets Revealed', episodeNumber: 2, url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', duration: '23min', thumbnail: 'https://picsum.photos/seed/ep2commonthumb/320/180' },
  { id: 'ep3-common', title: 'The Final Confrontation', episodeNumber: 3, url: 'https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-1080p.mp4', duration: '25min', thumbnail: 'https://picsum.photos/seed/ep3commonthumb/320/180' },
];

export const mockAnimeData: Anime[] = []; // Empty array, data will be fetched from Firestore.
