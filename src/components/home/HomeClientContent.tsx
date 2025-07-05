// src/components/home/HomeClientContent.tsx
'use client';

import React, { useState, useEffect, useMemo, Suspense, lazy } from 'react';
import Container from '@/components/layout/container';
import AnimeCarousel from '@/components/anime/anime-carousel';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ChevronRight, AlertTriangle, Star } from 'lucide-react';
import type { Anime } from '@/types/anime';
import TopAnimeListItem from '@/components/anime/TopAnimeListItem';
import SpotlightSlider from './SpotlightSlider';
import HomePageGenreSection from './HomePageGenreSection';
import { convertAnimeTimestampsForClient } from '@/lib/animeUtils';
import { Skeleton } from '@/components/ui/skeleton';
import FeaturedAnimeCard from '../anime/FeaturedAnimeCard';
import AnimeCardSkeleton from '../anime/AnimeCardSkeleton';

const RecommendationsSection = lazy(() => import('../anime/recommendations-section'));

export interface HomeClientProps {
  initialAllAnimeData: Anime[];
  initialSpotlightData: any[];
  initialFeaturedAnimeData: Anime[];
  fetchError: string | null;
}

function HomePageSkeleton() {
  return (
    <>
      <Skeleton className="relative h-[55vh] md:h-[70vh] w-full" />
      <Container className="py-8">
        <div className="py-6 md:py-8 space-y-4">
          <Skeleton className="h-8 w-48" />
          <div className="flex space-x-4 overflow-hidden">
            {[...Array(6)].map((_, i) => (
              <AnimeCardSkeleton key={i} className="w-[140px] flex-shrink-0" />
            ))}
          </div>
        </div>

        <div className="py-6 md:py-8 space-y-6">
          <Skeleton className="h-8 w-56" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            <Skeleton className="aspect-[16/10] sm:aspect-[16/9] rounded-xl" />
            <Skeleton className="aspect-[16/10] sm:aspect-[16/9] rounded-xl hidden lg:block" />
            <Skeleton className="aspect-[16/10] sm:aspect-[16/9] rounded-xl hidden md:block" />
          </div>
        </div>
        
        <div className="py-6 md:py-8 space-y-4">
          <Skeleton className="h-8 w-64" />
          <div className="flex space-x-4 overflow-hidden">
            {[...Array(6)].map((_, i) => (
              <AnimeCardSkeleton key={i} className="w-[140px] flex-shrink-0" />
            ))}
          </div>
        </div>
      </Container>
    </>
  );
}


export default function HomeClient({
    initialAllAnimeData: rawInitialAllAnimeData,
    initialSpotlightData,
    initialFeaturedAnimeData,
    fetchError: initialFetchError
}: HomeClientProps) {
  const [allAnime, setAllAnime] = useState<Anime[]>(() => rawInitialAllAnimeData.map(convertAnimeTimestampsForClient));
  const [spotlightSlides, setSpotlightSlides] = useState<any[]>(() => initialSpotlightData);
  const [featuredAnime, setFeaturedAnime] = useState<Anime[]>(() => initialFeaturedAnimeData);
  const [fetchError, setFetchError] = useState<string | null>(initialFetchError);
  
  const [isClientReady, setIsClientReady] = useState(false);
  
  const isDataActuallyLoading = useMemo(() => 
      !rawInitialAllAnimeData || rawInitialAllAnimeData.length === 0
  , [rawInitialAllAnimeData]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsClientReady(true);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (initialFetchError) {
      setFetchError(initialFetchError);
      setAllAnime([]);
      setSpotlightSlides([]);
      setFeaturedAnime([]);
    } else {
      setAllAnime(rawInitialAllAnimeData.map(convertAnimeTimestampsForClient));
      setSpotlightSlides(initialSpotlightData);
      setFeaturedAnime(initialFeaturedAnimeData);
      setFetchError(null);
    }
  }, [rawInitialAllAnimeData, initialSpotlightData, initialFeaturedAnimeData, initialFetchError]);

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
  
  const showSkeleton = !isClientReady || (isDataActuallyLoading && !fetchError);

  if (showSkeleton && !fetchError) {
    return <HomePageSkeleton />;
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

  const noContentAvailable = !isDataActuallyLoading && !fetchError && isClientReady && allAnime.length === 0 && spotlightSlides.length === 0;

  return (
    <>
      <SpotlightSlider slides={spotlightSlides} isLoading={showSkeleton} />
      
      <Container className="py-8">
        {noContentAvailable && (
           <div className="my-8 p-6 bg-card border border-border rounded-lg text-center">
            <h3 className="font-semibold text-xl font-orbitron">No Anime Found</h3>
            <p className="text-muted-foreground font-poppins">It looks like there's no anime in the database yet. An admin can add some via the admin panel.</p>
          </div>
        )}

        {trendingAnime.length > 0 && <AnimeCarousel title="Trending Now" animeList={trendingAnime} />}

        {featuredAnime.length > 0 && (
          <section className="py-6 md:py-8">
             <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground section-title-bar font-orbitron flex items-center">
                <Star className="w-6 h-6 mr-2 text-yellow-400 fill-current" /> Featured Picks
              </h2>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {featuredAnime.map(anime => (
                  <FeaturedAnimeCard key={anime.id} anime={anime} />
                ))}
             </div>
          </section>
        )}

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
