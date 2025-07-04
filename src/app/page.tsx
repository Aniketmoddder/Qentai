// src/app/page.tsx
import HomeClient from '@/components/home/HomeClientContent';
import type { Anime } from '@/types/anime';
import { getAllAnimes, getAnimesByIds } from '@/services/animeService';
import { getSpotlightSlides } from '@/services/spotlightService';
import { convertAnimeTimestampsForClient } from '@/lib/animeUtils';
import { FirestoreError } from 'firebase/firestore';
import type { SpotlightSlide } from '@/types/spotlight';


export default async function HomePageWrapper() {
  let allAnimeData: Anime[] = [];
  let spotlightData: any[] = [];
  let fetchError: string | null = null;

  try {
    // Fetch all data concurrently
    const [allAnimesRaw, spotlightSlidesRaw] = await Promise.all([
      getAllAnimes({ count: 100, filters: { sortBy: 'updatedAt', sortOrder: 'desc' } }),
      getSpotlightSlides()
    ]);

    // Process all anime data
    allAnimeData = allAnimesRaw.map(a => convertAnimeTimestampsForClient(a));

    // Process spotlight slides
    const liveSlides = spotlightSlidesRaw.filter(s => s.status === 'live');
    if (liveSlides.length > 0) {
      const animeIds = liveSlides.map(s => s.animeId);
      const animesForSpotlight = await getAnimesByIds(animeIds);
      const animesMap = new Map(animesForSpotlight.map(a => [a.id, a]));

      spotlightData = liveSlides
        .map(slide => {
          const anime = animesMap.get(slide.animeId);
          if (!anime) return null;

          return {
            ...anime, // Base anime data
            spotlightId: slide.id,
            order: slide.order,
            // Overrides from spotlight slide document
            title: slide.overrideTitle || anime.title,
            synopsis: slide.overrideDescription || anime.synopsis,
            // Custom URLs from spotlight slide document
            trailerUrl: slide.trailerUrl,
            backgroundImageUrl: slide.backgroundImageUrl,
          };
        })
        .filter((s): s is (Anime & SpotlightSlide) => s !== null) // Type guard to filter out nulls
        .sort((a, b) => a.order - b.order);
    }


  } catch (error) {
    console.error("HomePageWrapper: Failed to fetch initial anime data:", error);
     if (error instanceof FirestoreError && error.code === 'failed-precondition' && error.message.includes("index")) {
        fetchError = `DATABASE SETUP REQUIRED: A Firestore index is missing for optimal performance. Please check the Firebase console for a link to create the missing index. Details: ${error.message}`;
    } else if (error instanceof Error) {
      fetchError = `Error fetching data: ${error.message}.`;
    } else {
      fetchError = "An unknown error occurred while fetching anime data. Please ensure Firebase services are correctly configured and reachable.";
    }
    // Ensure data arrays are empty on error
    allAnimeData = [];
    spotlightData = [];
  }

  return (
    <HomeClient
      initialAllAnimeData={allAnimeData}
      initialSpotlightData={spotlightData}
      fetchError={fetchError}
    />
  );
}
