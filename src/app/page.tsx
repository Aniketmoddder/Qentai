// src/app/page.tsx
import HomeClient from '@/components/home/HomeClientContent';
import type { Anime } from '@/types/anime';
import { getAllAnimes, getFeaturedAnimes } from '@/services/animeService';
import { convertAnimeTimestampsForClient } from '@/lib/animeUtils';
import { FirestoreError } from 'firebase/firestore';


export default async function HomePageWrapper() {
  let allAnimeData: Anime[] = [];
  let featuredAnimesData: Anime[] = [];
  let fetchError: string | null = null;

  try {
    // Fetch all data concurrently
    const [allAnimesRaw, featuredAnimesRawInitial] = await Promise.all([
      getAllAnimes({ count: 100, filters: { sortBy: 'updatedAt', sortOrder: 'desc' } }),
      getFeaturedAnimes({ count: 10, sortBy: 'popularity', sortOrder: 'desc' })
    ]);

    // Process all anime data
    allAnimeData = allAnimesRaw.map(a => convertAnimeTimestampsForClient(a));

    // Process featured animes
    let tempFeaturedAnimes = featuredAnimesRawInitial.map(a => convertAnimeTimestampsForClient(a));

    if (tempFeaturedAnimes.length > 0) {
        // Already sorted by popularity from service
        featuredAnimesData = tempFeaturedAnimes.slice(0,5); // Take top 5 for featured section
    }

    // Fallback for hero section if no explicit featured animes, but other anime exist
    // This ensures the hero section always tries to show something if content is available.
    if (featuredAnimesData.length === 0 && allAnimeData.length > 0) {
      // Sort all anime by popularity and pick the top one for hero banner
      // Ensure we are creating a new array for sorting to avoid mutating allAnimeData
      const sortedForHeroFallback = [...allAnimeData].sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
      if (sortedForHeroFallback.length > 0) {
        // If featuredAnimesData was previously empty, it's now populated with the hero.
        // If it wasn't (e.g., had less than 2 items for the FeaturedAnimeCard grid),
        // this doesn't strictly replace it but rather provides the hero logic.
        // The HomeClient will use featuredAnimesData[0] for the hero.
        // Ensure featuredAnimesData for the FeaturedAnimeCard section is correctly handled.
        // If featuredAnimesData is used for BOTH hero AND the grid, ensure this logic is sound.
        // For now, let's assume `featuredAnimesData` is primarily for the hero if it's derived here.
        // The actual "Featured Anime" section in HomeClient will use its own slice of this or a separate prop if needed.
        // This current logic prioritizes `getFeaturedAnimes` results, then picks a hero.
        // Re-check HomeClient: it takes `initialFeaturedAnimes` which becomes `featuredAnimesList`.
        // `heroAnime` is `featuredAnimesList[0]`.
        // The "Featured Anime" carousel/grid in HomeClient uses `featuredAnimesList.slice(0, 2)`.
        // So, if featuredAnimesData is populated by this fallback, it'll only have 1 item for the grid.

        // If `getFeaturedAnimes` returned some, but less than 2, and we want a different hero:
        // This logic ensures `featuredAnimesData` is set for the hero.
        // The `FeaturedAnimeCard` grid in `HomeClient` might show this single hero again.
        // This is acceptable if `featuredAnimesData` is the source for both.

        featuredAnimesData = [sortedForHeroFallback[0]];
      }
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
    featuredAnimesData = [];
  }

  return (
    <HomeClient
      initialAllAnimeData={allAnimeData}
      initialFeaturedAnimes={featuredAnimesData}
      fetchError={fetchError}
    />
  );
}
