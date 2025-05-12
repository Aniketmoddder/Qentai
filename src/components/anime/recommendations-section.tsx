"use client";

import { useEffect, useState, useCallback } from 'react';
import { generateAnimeRecommendations } from '@/ai/flows/generate-anime-recommendations';
import type { Anime } from '@/types/anime';
import AnimeCard from './anime-card';
import AnimeCardSkeleton from './AnimeCardSkeleton'; 
import { Button } from '@/components/ui/button';
import { Loader2, Wand2, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getAllAnimes } from '@/services/animeService'; 
import { getUniqueGenres } from '@/services/animeService';

let dynamicMockWatchHistoryTitles: string[] = []; 

interface RecommendationsSectionProps {
  allAnimesCache: Anime[]; 
}

export default function RecommendationsSection({ allAnimesCache: initialAllAnimesCache }: RecommendationsSectionProps) {
  const [recommendations, setRecommendations] = useState<Anime[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [internalAnimeCatalog, setInternalAnimeCatalog] = useState<Anime[]>(initialAllAnimesCache || []);

  const ensureAnimeCatalog = useCallback(async () => {
    if (internalAnimeCatalog.length === 0) {
      try {
        const animes = await getAllAnimes({ count: -1, filters: {} }); 
        setInternalAnimeCatalog(animes);
        return animes;
      } catch (e) {
        console.error("Failed to fetch internal anime catalog:", e);
        setError("Could not load anime catalog for recommendations.");
        return [];
      }
    }
    return internalAnimeCatalog;
  }, [internalAnimeCatalog]);

  const prepareWatchHistory = useCallback(async () => {
    if (dynamicMockWatchHistoryTitles.length === 0) {
        try {
            const uniqueGenres = await getUniqueGenres();
            if (uniqueGenres.length > 0) {
                dynamicMockWatchHistoryTitles = uniqueGenres.slice(0, 3).map(genre => `Anime with ${genre} genre`);
            } else {
                dynamicMockWatchHistoryTitles = ['Attack on Titan', 'Solo Leveling', 'One Punch Man']; 
            }
        } catch (genreError) {
            console.warn("Could not fetch genres for mock history, using default:", genreError);
            dynamicMockWatchHistoryTitles = ['Attack on Titan', 'Solo Leveling', 'One Punch Man'];
        }
    }
    return dynamicMockWatchHistoryTitles;
  }, []);


  const fetchRecommendations = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const catalog = await ensureAnimeCatalog();
    if (catalog.length === 0) {
      setError("Anime catalog is not available to generate recommendations.");
      setIsLoading(false);
      return;
    }
    
    const watchHistory = await prepareWatchHistory();

    try {
      const availableAnimeTitles = catalog.map(anime => anime.title);
      const result = await generateAnimeRecommendations({ 
        watchHistory: watchHistory,
        availableAnimeTitles 
      });
      
      const detailedRecommendations = result.recommendations
        .map(title => {
          const normalizedRecTitle = title.toLowerCase().trim();
          return catalog.find(anime => 
            anime.title.toLowerCase().trim() === normalizedRecTitle
          );
        })
        .filter((anime): anime is Anime => anime !== undefined); 

      setRecommendations(detailedRecommendations.slice(0, 5)); 
    } catch (e: any) {
      console.error("Failed to fetch recommendations:", e);
      let errorMessage = "Could not load recommendations. Please try again.";
      if (e && e.message) {
        if (e.message.includes("503") || e.message.toLowerCase().includes("service unavailable")) {
          errorMessage = "The recommendation service is temporarily unavailable. Please try again later.";
        } else if (e.message.includes("API key not valid")) {
          errorMessage = "AI API key is invalid. Please check your configuration.";
        }
         else {
          errorMessage = e.message;
        }
      }
      setError(errorMessage);
      setRecommendations([]); 
    } finally {
      setIsLoading(false);
    }
  }, [ensureAnimeCatalog, prepareWatchHistory]); 

  useEffect(() => {
    if (recommendations.length === 0 && !error && !isLoading) { 
      fetchRecommendations();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 


  return (
    <section className="py-6 md:py-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground flex items-center section-title-bar">
          <Wand2 className="w-7 h-7 mr-2 text-primary" />
          Recommended For You
        </h2>
        <Button 
          variant="ghost" 
          onClick={fetchRecommendations} 
          disabled={isLoading}
        >
          {isLoading && recommendations.length === 0 ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} 
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading && recommendations.length === 0 && !error && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3 place-items-center sm:place-items-stretch">
          {[...Array(5)].map((_, index) => (
            <AnimeCardSkeleton key={index} />
          ))}
        </div>
      )}

      {!isLoading && recommendations.length === 0 && !error && internalAnimeCatalog.length > 0 && (
         <div className="text-center py-8 text-muted-foreground">
          <p>No recommendations available right now. Explore more anime to get personalized suggestions!</p>
          <p className="text-xs mt-1">(Or ensure the recommendation AI is working correctly and the anime catalog is loaded.)</p>
        </div>
      )}
      
      {!isLoading && internalAnimeCatalog.length === 0 && !error && (
         <div className="text-center py-8 text-muted-foreground">
          <p>Loading anime catalog to generate recommendations...</p>
        </div>
      )}


      {recommendations.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3 place-items-center sm:place-items-stretch">
          {recommendations.map((anime) => (
            <AnimeCard key={anime.id} anime={anime} sizeVariant="small" />
          ))}
        </div>
      )}
    </section>
  );
}
