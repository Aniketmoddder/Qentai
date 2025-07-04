// src/components/home/HomeClientContent.tsx
'use client';

import React, { useState, useEffect, useMemo, Suspense, lazy } from 'react';
import Container from '@/components/layout/container';
import AnimeCarousel from '@/components/anime/anime-carousel';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ChevronRight, AlertTriangle, Loader2 } from 'lucide-react';
import type { Anime } from '@/types/anime';
import TopAnimeListItem from '@/components/anime/TopAnimeListItem';
import SpotlightSlider from './SpotlightSlider';
import AnimeCardSkeleton from '@/components/anime/AnimeCardSkeleton';
import HomePageGenreSection from './HomePageGenreSection';
import { convertAnimeTimestampsForClient } from '@/lib/animeUtils';
import { Skeleton } from '@/components/ui/skeleton';

const RecommendationsSection = lazy(() => import('../anime/recommendations-section'));

export interface HomeClientProps {
  initialAllAnimeData: Anime[];
  initialSpotlightData: any[]; // Changed from initialFeaturedAnimes
  fetchError: string | null;
}

const ARTIFICIAL_SKELETON_DELAY = 750;

export default function HomeClient({
    initialAllAnimeData: rawInitialAllAnimeData,
    initialSpotlightData,
    fetchError: initialFetchError
}: HomeClientProps) {
  const [allAnime, setAllAnime] = useState<Anime[]>(() => rawInitialAllAnimeData.map(convertAnimeTimestampsForClient));
  const [spotlightSlides, setSpotlightSlides] = useState<any[]>(() => initialSpotlightData);
  const [fetchError, setFetchError] = useState<string | null>(initialFetchError);

  const [isArtificiallyLoading, setIsArtificiallyLoading] = useState(true);
  const [isDataActuallyLoading, setIsDataActuallyLoading] = useState(
    !rawInitialAllAnimeData || rawInitialAllAnimeData.length === 0
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsArtificiallyLoading(false);
    }, ARTIFICIAL_SKELETON_DELAY);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (initialFetchError) {
      setFetchError(initialFetchError);
      setAllAnime([]);
      setSpotlightSlides([]);
      setIsDataActuallyLoading(false);
    } else {
      setAllAnime(rawInitialAllAnimeData.map(convertAnimeTimestampsForClient));
      setSpotlightSlides(initialSpotlightData);
      setFetchError(null);
      setIsDataActuallyLoading(rawInitialAllAnimeData.length === 0 && initialSpotlightData.length === 0 && !initialFetchError);
    }
  }, [rawInitialAllAnimeData, initialSpotlightData, initialFetchError]);


  const trendingAnime = useMemo(() => {
    return allAnime.length > 0 ? [...allAnime].sort((a,b) => (b.popularity || 0) - (a.popularity || 0)).slice(0, 15) : [];
  }, [allAnime]);

  const popularAnime = useMemo(() => {
    return allAnime.length > 0
    ? [...allAnime]
        .filter(a => a.averageRating !== undefined && a.averageRating !== null && a.averageRating >= 7.0)
        .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
        .slice(0, 15)
    : [];
  }, [allAnime]);

  const recentlyAddedAnime = useMemo(() => {
    return allAnime.length > 0
    ? [...allAnime].sort((a,b) => {
        const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
        const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
        return dateB - dateA;
      }).slice(0,15)
    : [];
  }, [allAnime]);

  const topAnimeList = useMemo(() => {
    return allAnime.length > 0 ? [...allAnime]
    .filter(a => a.averageRating !== undefined && a.averageRating !== null)
    .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
    .slice(0, 10) : [];
  }, [allAnime]);
  
  const showSkeleton = isArtificiallyLoading || (isDataActuallyLoading && !fetchError);

  if (showSkeleton) {
    return (
      <>
        <SpotlightSlider slides={[]} /> 
        <Container className="py-8">
          {/* Skeletons for AnimeCarousels */}
          {[...Array(2)].map((_, i) => (
            <div key={`carousel-skeleton-${i}`} className="mb-8">
              <Skeleton className="h-8 w-1/3 mb-4 rounded bg-muted/50" />
              <div className="flex overflow-x-auto pb-4 gap-3 sm:gap-4 scrollbar-hide">
                {[...Array(5)].map((_, j) => (
                  <div key={`card-skeleton-${i}-${j}`} className="flex-shrink-0">
                    <AnimeCardSkeleton />
                  </div>
                ))}
              </div>
            </div>
          ))}
           <div className="mb-8">
            <Skeleton className="h-8 w-1/3 mb-6 rounded bg-muted/50" />
            <div className="space-y-3">
                {[...Array(5)].map((_, k) => (
                    <Skeleton key={`top-item-skeleton-${k}`} className="h-28 w-full rounded-lg bg-muted/50" />
                ))}
            </div>
          </div>
           <div className="mb-8">
            <Skeleton className="h-8 w-1/3 mb-4 rounded bg-muted/50" />
             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
                {[...Array(6)].map((_, l) => (
                    <Skeleton key={`genre-skeleton-${l}`} className="h-[100px] md:h-[120px] rounded-lg bg-muted/50" />
                ))}
            </div>
          </div>
           <div className="mb-8">
            <Skeleton className="h-8 w-1/3 mb-4 rounded bg-muted/50" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3 place-items-center sm:place-items-stretch">
                {[...Array(5)].map((_, m) => (
                  <AnimeCardSkeleton key={`reco-skeleton-${m}`} />
                ))}
            </div>
          </div>
        </Container>
      </>
    );
  }

  if (fetchError) {
    return (
      <Container className="flex flex-col items-center justify-center min-h-[calc(100vh-var(--header-height,4rem)-var(--footer-height,0px)-1px)] py-12 text-center">
        <AlertTriangle className="mx-auto h-16 w-16 text-destructive mb-6" />
        <h1 className="text-3xl font-bold text-destructive mb-3 font-zen-dots">Error Loading Content</h1>
        <p className="text-lg text-muted-foreground mb-4 font-orbitron">We encountered an issue fetching anime data.</p>
        <p className="text-md text-foreground/80 mb-6 whitespace-pre-line max-w-2xl">{fetchError}</p>
        <p className="text-sm text-muted-foreground font-poppins">
          Please try refreshing the page. If the problem persists, ensure your Firebase setup is correct (including Firestore indexes and OAuth authorized domains for login features) and check your internet connection.
        </p>
        <Button onClick={() => window.location.reload()} className="mt-8 btn-primary-gradient">
          Refresh Page
        </Button>
      </Container>
    );
  }

  const noContentAvailable = !isDataActuallyLoading && !fetchError && !isArtificiallyLoading && allAnime.length === 0 && spotlightSlides.length === 0;

  return (
    <>
      <SpotlightSlider slides={spotlightSlides} />

      <Container className="py-8">
        {noContentAvailable && (
           <div className="my-8 p-6 bg-card border border-border rounded-lg text-center">
            <h3 className="font-semibold text-xl font-orbitron">No Anime Found</h3>
            <p className="text-muted-foreground font-poppins">It looks like there's no anime in the database yet. An admin can add some via the admin panel.</p>
          </div>
        )}

        {trendingAnime.length > 0 && <AnimeCarousel title="Trending Now" animeList={trendingAnime} />}

        <HomePageGenreSection />

        {popularAnime.length > 0 && <AnimeCarousel title="Popular This Season" animeList={popularAnime} />}
        {recentlyAddedAnime.length > 0 && <AnimeCarousel title="Latest Additions" animeList={recentlyAddedAnime} />}

        {topAnimeList.length > 0 && (
          <section className="py-6 md:py-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground section-title-bar font-orbitron">Top Anime</h2>
              <div className="flex items-center gap-2">
                <Button variant="link" asChild className="text-primary hover:text-primary/80 font-poppins">
                  <Link href="/browse?sort=top">View More <ChevronRight className="w-4 h-4 ml-1"/></Link>
                </Button>
              </div>
            </div>
            <div className="space-y-3">
              {topAnimeList.map((anime, index) => (
                <TopAnimeListItem key={anime.id} anime={anime} rank={index + 1} />
              ))}
            </div>
          </section>
        )}
         <Suspense fallback={<Skeleton className="h-72 w-full rounded-lg bg-muted" />}>
          <RecommendationsSection allAnimesCache={allAnime} />
         </Suspense>
      </Container>
    </>
  );
}
