// src/components/home/HomeClientContent.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Container from '@/components/layout/container';
import AnimeCarousel from '@/components/anime/anime-carousel';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, AlertTriangle, Play, Plus, Tv, Calendar, ListVideo, Star as StarIcon, Volume2, VolumeX, Loader2 } from 'lucide-react';
import type { Anime } from '@/types/anime';
import FeaturedAnimeCard from '@/components/anime/FeaturedAnimeCard';
import TopAnimeListItem from '@/components/anime/TopAnimeListItem';
import { Badge } from '@/components/ui/badge';
import HeroSkeleton from '@/components/home/HeroSkeleton';
import AnimeCardSkeleton from '@/components/anime/AnimeCardSkeleton';
import HomePageGenreSection from './HomePageGenreSection';
import RecommendationsSection from '../anime/recommendations-section';


const shuffleArray = <T,>(array: T[]): T[] => {
  if (!array || array.length === 0) return [];
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const getYouTubeVideoId = (url?: string): string | null => {
  if (!url) return null;
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname === 'youtu.be') {
      return urlObj.pathname.slice(1);
    }
    if (urlObj.hostname === 'www.youtube.com' || urlObj.hostname === 'youtube.com') {
      if (urlObj.pathname === '/watch') {
        return urlObj.searchParams.get('v');
      }
      if (urlObj.pathname.startsWith('/embed/')) {
        return urlObj.pathname.split('/embed/')[1].split('?')[0];
      }
    }
  } catch (e) {
    return null;
  }
  return null;
};

export interface HomeClientProps {
  initialAllAnimeData?: Anime[];
  initialFeaturedAnimes?: Anime[];
  fetchError: string | null;
}

const ARTIFICIAL_SKELETON_DELAY = 750; 

export default function HomeClient({
    initialAllAnimeData,
    initialFeaturedAnimes,
    fetchError: initialFetchError
}: HomeClientProps) {
  const [allAnime, setAllAnime] = useState<Anime[]>(initialAllAnimeData || []);
  const [featuredAnimesList, setFeaturedAnimesList] = useState<Anime[]>(initialFeaturedAnimes || []);
  const [fetchError, setFetchError] = useState<string | null>(initialFetchError);
  const [isLoadingData, setIsLoadingData] = useState(!initialAllAnimeData || !initialFeaturedAnimes);
  const [isInitialSkeletonPhase, setIsInitialSkeletonPhase] = useState(true);

  const [playTrailer, setPlayTrailer] = useState(false);
  const [isTrailerMuted, setIsTrailerMuted] = useState(true);

  useEffect(() => {
    // This effect handles the initial data setting and error state.
    // If initial props are provided, data loading might be considered complete.
    if (initialFetchError) {
      setFetchError(initialFetchError);
      setAllAnime([]);
      setFeaturedAnimesList([]);
      setIsLoadingData(false);
    } else if (initialAllAnimeData && initialFeaturedAnimes) {
      setAllAnime(initialAllAnimeData);
      setFeaturedAnimesList(initialFeaturedAnimes);
      setFetchError(null);
      setIsLoadingData(false); 
    } else {
      // This case means initial data was not provided, so actual fetching might be needed
      // or it's an empty state.
      setIsLoadingData(true); // Or true if you intend to fetch client-side as fallback
    }
  }, [initialAllAnimeData, initialFeaturedAnimes, initialFetchError]);


  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialSkeletonPhase(false);
    }, ARTIFICIAL_SKELETON_DELAY);
    return () => clearTimeout(timer);
  }, []);


  const heroAnime = useMemo(() => {
    return featuredAnimesList[0] || (allAnime.length > 0 ? shuffleArray([...allAnime])[0] : undefined);
  }, [featuredAnimesList, allAnime]);

  const youtubeVideoId = useMemo(() => {
    return heroAnime?.trailerUrl ? getYouTubeVideoId(heroAnime.trailerUrl) : null;
  }, [heroAnime]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (heroAnime && youtubeVideoId && !playTrailer && !fetchError && !isLoadingData && !isInitialSkeletonPhase) {
      timer = setTimeout(() => {
        setPlayTrailer(true);
      }, 3000); 
    }
    return () => clearTimeout(timer);
  }, [heroAnime, youtubeVideoId, playTrailer, fetchError, isLoadingData, isInitialSkeletonPhase]);

  const trendingAnime = useMemo(() => {
    return allAnime.length > 0 ? shuffleArray([...allAnime]).slice(0, 15) : []; // Max 15 for carousel
  }, [allAnime]);

  const popularAnime = useMemo(() => {
    return allAnime.length > 0
    ? [...allAnime]
        .filter(a => a.averageRating !== undefined && a.averageRating !== null && a.averageRating >= 7.0)
        .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
        .slice(0, 15) // Max 15
    : [];
  }, [allAnime]);

  const recentlyAddedAnime = useMemo(() => {
    return allAnime.length > 0
    ? [...allAnime].sort((a,b) => {
        const dateAValue = a.updatedAt || a.createdAt || (a.year ? new Date(a.year, 0, 1).toISOString() : '1970-01-01T00:00:00.000Z');
        const dateBValue = b.updatedAt || b.createdAt || (a.year ? new Date(a.year, 0, 1).toISOString() : '1970-01-01T00:00:00.000Z');
        const dateA = new Date(dateAValue).getTime();
        const dateB = new Date(dateBValue).getTime();
        return dateB - dateA;
      }).slice(0,15) // Max 15
    : [];
  }, [allAnime]);

  const topAnimeList = useMemo(() => {
    return allAnime.length > 0 ? [...allAnime]
    .filter(a => a.averageRating !== undefined && a.averageRating !== null)
    .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
    .slice(0, 10) : []; // Top 10 for list view
  }, [allAnime]);

  const showSkeleton = isInitialSkeletonPhase || (isLoadingData && !fetchError);

  if (showSkeleton) {
    return (
      <>
        <HeroSkeleton />
        <Container className="py-8">
          <div className="mb-8">
            <AnimeCardSkeleton className="h-8 w-1/3 mb-4 rounded-md bg-muted/50" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <AnimeCardSkeleton className="aspect-[16/10] sm:aspect-[16/9] rounded-xl bg-muted/50" />
                <AnimeCardSkeleton className="aspect-[16/10] sm:aspect-[16/9] rounded-xl bg-muted/50 hidden md:block" />
            </div>
          </div>
          {[...Array(3)].map((_, i) => (
            <div key={`carousel-skeleton-${i}`} className="mb-8">
              <AnimeCardSkeleton className="h-8 w-1/3 mb-4 rounded-md bg-muted/50" />
              <div className="flex overflow-x-auto pb-4 gap-3 sm:gap-4 md:gap-x-5 scrollbar-hide">
                {[...Array(5)].map((_, j) => (
                  <div key={`card-skeleton-${i}-${j}`} className="flex-shrink-0">
                    <AnimeCardSkeleton />
                  </div>
                ))}
              </div>
            </div>
          ))}
           <div className="mb-8">
            <AnimeCardSkeleton className="h-8 w-1/3 mb-6 rounded-md bg-muted/50" />
            <div className="space-y-3">
                {[...Array(5)].map((_, k) => (
                    <AnimeCardSkeleton key={`top-item-skeleton-${k}`} className="h-28 w-full rounded-lg bg-muted/50" />
                ))}
            </div>
          </div>
           <div className="mb-8">
            <AnimeCardSkeleton className="h-8 w-1/3 mb-4 rounded-md bg-muted/50" />
             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
                {[...Array(6)].map((_, l) => (
                    <AnimeCardSkeleton key={`genre-skeleton-${l}`} className="h-[100px] md:h-[120px] rounded-lg bg-muted/50" />
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

  const noContentAvailable = !isLoadingData && !fetchError && !isInitialSkeletonPhase && allAnime.length === 0 && featuredAnimesList.length === 0 && !heroAnime;

  return (
    <>
      {heroAnime && (
        <section className="relative h-[65vh] md:h-[80vh] w-full flex items-end -mt-[calc(var(--header-height,4rem)+1px)] overflow-hidden">
          <div className="absolute inset-0">
            {playTrailer && youtubeVideoId ? (
              <div className="absolute inset-0 w-full h-full pointer-events-none">
                <iframe
                  src={`https://www.youtube.com/embed/${youtubeVideoId}?autoplay=1&mute=${isTrailerMuted ? 1 : 0}&controls=0&showinfo=0&loop=1&playlist=${youtubeVideoId}&modestbranding=1&iv_load_policy=3&fs=0&disablekb=1&vq=hd1080`}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full scale-[2] sm:scale-[1.8] md:scale-[1.5] object-cover"
                ></iframe>
              </div>
            ) : (
              <Image
                src={heroAnime.bannerImage || `https://picsum.photos/seed/${heroAnime.id}-hero/1600/900`}
                alt={`${heroAnime.title} banner`}
                fill
                style={{ objectFit: 'cover' }}
                className="opacity-40"
                priority
                data-ai-hint="anime landscape epic"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent"></div>
          </div>

          <Container className="relative z-10 pb-12 md:pb-20 text-foreground">
            <div className="max-w-2xl">
              {heroAnime.isFeatured ? (
                <Badge className="bg-yellow-500/90 text-background text-xs font-semibold px-2.5 py-1 rounded-md mb-3">
                  <StarIcon className="w-3 h-3 mr-1.5 fill-current"/> Featured Pick
                </Badge>
              ) : (
                 <Badge className="bg-primary text-primary-foreground text-xs font-semibold px-2.5 py-1 rounded-md mb-3">
                    #1 Trending
                </Badge>
              )}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-3 leading-tight font-zen-dots">
                {heroAnime.title}
              </h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mb-5">
                {heroAnime.type && <span className="flex items-center"><Tv className="w-4 h-4 mr-1.5" /> {heroAnime.type}</span>}
                {heroAnime.episodes && heroAnime.episodes.length > 0 &&
                  <span className="flex items-center"><ListVideo className="w-4 h-4 mr-1.5" /> {heroAnime.episodes.length} Episodes</span>
                }
                 <span className="flex items-center"><Calendar className="w-4 h-4 mr-1.5" /> {heroAnime.year}</span>
              </div>
              <p className="text-base md:text-lg text-muted-foreground mb-6 line-clamp-3 font-poppins">
                {heroAnime.synopsis}
              </p>
              <div className="flex flex-wrap gap-3 sm:gap-4 items-center">
                <Button asChild size="lg" className="btn-primary-gradient rounded-full px-8 py-3 text-base">
                  <Link href={`/play/${heroAnime.id}${heroAnime.episodes && heroAnime.episodes.length > 0 ? `?episode=${heroAnime.episodes[0].id}` : ''}`}>
                    <Play className="mr-2 h-5 w-5 fill-current" /> Watch Now
                  </Link>
                </Button>
                 <Button asChild variant="outline" size="lg" className="rounded-full px-8 py-3 text-base border-foreground/30 text-foreground hover:bg-foreground/10 hover:border-foreground/50">
                  <Link href={`/anime/${heroAnime.id}`}>
                    <Plus className="mr-2 h-5 w-5" /> More Info
                  </Link>
                </Button>
                {playTrailer && youtubeVideoId && (
                  <div className="ml-auto sm:ml-0 mt-2 sm:mt-0 sm:ml-auto self-center">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                        e.stopPropagation();
                        setIsTrailerMuted(!isTrailerMuted);
                        }}
                        className="text-white/70 hover:text-white hover:bg-black/30 rounded-full w-10 h-10"
                        aria-label={isTrailerMuted ? "Unmute trailer" : "Mute trailer"}
                    >
                        {isTrailerMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </Container>
        </section>
      )}

      <Container className="py-8"> {/* Removed overflow-x-clip */}
        {noContentAvailable && (
           <div className="my-8 p-6 bg-card border border-border rounded-lg text-center">
            <h3 className="font-semibold text-xl font-orbitron">No Anime Found</h3>
            <p className="text-muted-foreground font-poppins">It looks like there's no anime in the database yet. An admin can add some via the admin panel.</p>
          </div>
        )}

        {featuredAnimesList.length > 0 && (
          <section className="py-6 md:py-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground section-title-bar font-orbitron">Featured Anime</h2>
              <Button variant="link" asChild className="text-primary hover:text-primary/80 font-poppins">
                <Link href="/browse?filter=featured">View More <ChevronRight className="w-4 h-4 ml-1"/></Link>
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {featuredAnimesList.slice(0, 2).map(anime => (
                <FeaturedAnimeCard key={anime.id} anime={anime} />
              ))}
            </div>
          </section>
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
         <RecommendationsSection allAnimesCache={allAnime} />
      </Container>
    </>
  );
}
