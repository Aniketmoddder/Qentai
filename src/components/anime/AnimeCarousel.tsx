// src/components/anime/anime-carousel.tsx
'use client';

import type { Anime } from '@/types/anime';
import AnimeCard from './anime-card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import React, { useState, useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import type { Swiper as SwiperInstance } from 'swiper';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import { cn } from '@/lib/utils';

interface AnimeCarouselProps {
  title: string;
  animeList: Anime[];
}

const MAX_CARDS_TO_SHOW = 15;

export default function AnimeCarousel({ title, animeList }: AnimeCarouselProps) {
  const swiperRef = useRef<SwiperInstance | null>(null);
  const [isBeginning, setIsBeginning] = useState(true);
  const [isEnd, setIsEnd] = useState(false);

  const displayedAnime = animeList.slice(0, MAX_CARDS_TO_SHOW);

  if (!displayedAnime || displayedAnime.length === 0) {
    return null;
  }

  const updateNavState = (swiper: SwiperInstance) => {
    setIsBeginning(swiper.isBeginning);
    setIsEnd(swiper.isEnd);
  };

  return (
    <section className="py-6 md:py-8 relative group/carousel mt-2">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl md:text-2xl font-bold text-foreground section-title-bar">{title}</h2>
      </div>
      
      <div className="relative group">
        <Swiper
          modules={[Navigation]}
          onSwiper={(swiper) => {
            swiperRef.current = swiper;
            updateNavState(swiper);
          }}
          onSlideChange={(swiper) => updateNavState(swiper)}
          spaceBetween={12} // Corresponds to gap-3
          slidesPerView="auto"
          className="!pb-1" // Add some padding for potential shadow visibility
          navigation={{
            nextEl: `.swiper-button-next-${title.replace(/\s+/g, '-')}`,
            prevEl: `.swiper-button-prev-${title.replace(/\s+/g, '-')}`,
            disabledClass: 'swiper-button-disabled-custom', // Custom class to hide disabled
          }}
        >
          {displayedAnime.map((anime) => (
            <SwiperSlide key={anime.id} className="!w-auto"> {/* Use !w-auto to let AnimeCard define its width */}
              <AnimeCard anime={anime} />
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Custom Navigation Arrows */}
        {!isBeginning && (
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "absolute left-0 top-1/2 -translate-y-1/2 z-20",
              "text-white w-10 h-16 md:w-12 md:h-20 p-0", // Sharp edges
              "bg-transparent", // No background
              "opacity-100", // Always visible when active
              "focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none",
              "flex items-center justify-center",
              `swiper-button-prev-${title.replace(/\s+/g, '-')}` // Unique class for Swiper
            )}
            onClick={() => swiperRef.current?.slidePrev()}
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-7 w-7 md:h-8 md:w-8" />
          </Button>
        )}
        {!isEnd && (
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "absolute right-0 top-1/2 -translate-y-1/2 z-20",
              "text-white w-10 h-16 md:w-12 md:h-20 p-0", // Sharp edges
              "bg-transparent", // No background
              "opacity-100", // Always visible when active
              "focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none",
              "flex items-center justify-center",
              `swiper-button-next-${title.replace(/\s+/g, '-')}` // Unique class for Swiper
            )}
            onClick={() => swiperRef.current?.slideNext()}
            aria-label="Scroll right"
          >
            <ChevronRight className="h-7 w-7 md:h-8 md:w-8" />
          </Button>
        )}
      </div>
    </section>
  );
}