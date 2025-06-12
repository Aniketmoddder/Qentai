
// src/components/anime/MoreLikeThisSection.tsx
'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import type { Anime } from '@/types/anime';
import { getSimilarAnimes } from '@/services/animeService';
import AnimeCard from './anime-card';
import AnimeCardSkeleton from './AnimeCardSkeleton';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ChevronLeft, ChevronRight, Wand2 } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import type { Swiper as SwiperInstance } from 'swiper';
import { Navigation } from 'swiper/modules';
import { gsap } from 'gsap';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // Added import

import 'swiper/css';
import 'swiper/css/navigation';

interface MoreLikeThisSectionProps {
  currentAnime: Anime;
}

export default function MoreLikeThisSection({ currentAnime }: MoreLikeThisSectionProps) {
  const [similarAnimes, setSimilarAnimes] = useState<Anime[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const swiperRef = useRef<SwiperInstance | null>(null);
  const [isBeginning, setIsBeginning] = useState(true);
  const [isEnd, setIsEnd] = useState(false);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const fetchSimilarAnimes = useCallback(async () => {
    if (!currentAnime || !currentAnime.id || !currentAnime.genre) return;
    setIsLoading(true);
    setError(null);
    try {
      const animes = await getSimilarAnimes({
        currentAnimeId: currentAnime.id,
        currentAnimeGenres: currentAnime.genre,
        count: 12,
      });
      setSimilarAnimes(animes);
      // Reset cardRefs array based on new data length
      cardRefs.current = animes.map(() => null);
    } catch (e) {
      console.error('Failed to fetch similar anime:', e);
      setError('Could not load recommendations.');
    } finally {
      setIsLoading(false);
    }
  }, [currentAnime]);

  useEffect(() => {
    fetchSimilarAnimes();
  }, [fetchSimilarAnimes]);

  useEffect(() => {
    if (!isLoading && similarAnimes.length > 0 && cardRefs.current.length > 0) {
      const validCardRefs = cardRefs.current.filter(ref => ref !== null) as HTMLDivElement[];
      if (validCardRefs.length > 0) {
        gsap.fromTo(
          validCardRefs,
          { opacity: 0, y: 20, scale: 0.95 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.6,
            stagger: 0.1,
            ease: 'power2.out',
            scrollTrigger: { // Animate when section scrolls into view
              trigger: validCardRefs[0].closest('.swiper-container') || validCardRefs[0].closest('.group\\/carousel'),
              start: 'top bottom-=100px',
              toggleActions: 'play none none none',
              once: true,
            },
          }
        );
      }
    }
  }, [isLoading, similarAnimes]);

  const handleMouseEnterCard = (el: HTMLDivElement | null) => {
    if (!el) return;
    const imageEl = el.querySelector('img');
    gsap.to(el, { y: -5, scale: 1.05, duration: 0.25, ease: 'power1.out', zIndex:10 });
    if (imageEl) {
      gsap.to(imageEl, { scale: 1.1, duration: 0.3, ease: 'power1.out' });
    }
  };

  const handleMouseLeaveCard = (el: HTMLDivElement | null) => {
    if (!el) return;
    const imageEl = el.querySelector('img');
    gsap.to(el, { y: 0, scale: 1, duration: 0.25, ease: 'power1.out', zIndex:1 });
    if (imageEl) {
      gsap.to(imageEl, { scale: 1, duration: 0.3, ease: 'power1.out' });
    }
  };
  
  const updateNavState = (swiper: SwiperInstance) => {
    setIsBeginning(swiper.isBeginning);
    setIsEnd(swiper.isEnd || swiper.slides.length <= (swiper.params.slidesPerView || 1));
  };


  if (isLoading) {
    return (
      <Card className="shadow-lg border-border/40">
        <CardHeader className="p-3 sm:p-4 pb-2">
          <CardTitle className="text-md font-semibold text-primary flex items-center">
            <Wand2 className="w-5 h-5 mr-2" /> You Might Also Like
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 pt-0">
          <div className="flex space-x-3 pb-2 overflow-hidden">
            {[...Array(4)].map((_, i) => (
              <AnimeCardSkeleton key={i} className="w-[120px] flex-shrink-0" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="shadow-lg border-border/40">
        <CardHeader className="p-3 sm:p-4 pb-2">
          <CardTitle className="text-md font-semibold text-primary flex items-center">
            <Wand2 className="w-5 h-5 mr-2" /> You Might Also Like
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 pt-0">
          <div className="text-destructive text-sm py-4 text-center flex items-center justify-center">
            <AlertTriangle size={18} className="mr-2" /> {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (similarAnimes.length === 0) {
    return (
      <Card className="shadow-lg border-border/40">
         <CardHeader className="p-3 sm:p-4 pb-2">
          <CardTitle className="text-md font-semibold text-primary flex items-center">
            <Wand2 className="w-5 h-5 mr-2" /> You Might Also Like
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 pt-0">
            <p className="text-muted-foreground text-sm py-4 text-center">No similar anime found.</p>
        </CardContent>
      </Card>
    );
  }
  
  const uniqueSwiperNavClassSuffix = `more-like-this-${currentAnime.id}`;

  return (
    <Card className="shadow-lg border-border/40 overflow-hidden">
      <CardHeader className="p-3 sm:p-4 pb-2">
        <CardTitle className="text-md font-semibold text-primary flex items-center">
          <Wand2 className="w-5 h-5 mr-2" /> You Might Also Like
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 pt-0">
        <div className="relative group/carousel">
          <Swiper
            modules={[Navigation]}
            onSwiper={(swiper) => {
              swiperRef.current = swiper;
              updateNavState(swiper);
            }}
            onSlideChange={(swiper) => updateNavState(swiper)}
            slidesPerView="auto"
            spaceBetween={12}
            className="!pb-1 !-mx-1 !px-1" // Small padding to ensure shadows/hovers aren't cut
            navigation={{
              nextEl: `.swiper-button-next-${uniqueSwiperNavClassSuffix}`,
              prevEl: `.swiper-button-prev-${uniqueSwiperNavClassSuffix}`,
              disabledClass: 'opacity-30 cursor-not-allowed',
            }}
          >
            {similarAnimes.map((anime, index) => (
              <SwiperSlide key={anime.id} className="!w-auto">
                <div
                  ref={el => cardRefs.current[index] = el}
                  onMouseEnter={() => handleMouseEnterCard(cardRefs.current[index])}
                  onMouseLeave={() => handleMouseLeaveCard(cardRefs.current[index])}
                  className="opacity-0" // Initial state for GSAP
                >
                  <AnimeCard anime={anime} sizeVariant="small" />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>

          {!isBeginning && (
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "absolute left-0 top-1/2 -translate-y-1/2 z-20",
                "text-foreground/70 hover:text-foreground bg-background/30 hover:bg-background/50 backdrop-blur-sm rounded-full w-8 h-8",
                "opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-300",
                `swiper-button-prev-${uniqueSwiperNavClassSuffix}`
              )}
              onClick={() => swiperRef.current?.slidePrev()}
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          )}
          {!isEnd && (
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "absolute right-0 top-1/2 -translate-y-1/2 z-20",
                "text-foreground/70 hover:text-foreground bg-background/30 hover:bg-background/50 backdrop-blur-sm rounded-full w-8 h-8",
                "opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-300",
                `swiper-button-next-${uniqueSwiperNavClassSuffix}`
              )}
              onClick={() => swiperRef.current?.slideNext()}
              aria-label="Scroll right"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

