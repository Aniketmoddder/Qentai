// src/components/anime/CharacterCarousel.tsx
'use client';

import type { Character } from '@/types/anime';
import CharacterCard from './CharacterCard';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Users } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import type { Swiper as SwiperInstance } from 'swiper';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import { cn } from '@/lib/utils';

interface CharacterCarouselProps {
  characters?: Character[];
}

const MAX_CHARACTERS_TO_SHOW = 15;

export default function CharacterCarousel({ characters }: CharacterCarouselProps) {
  const swiperRef = useRef<SwiperInstance | null>(null);
  const [isBeginning, setIsBeginning] = useState(true);
  const [isEnd, setIsEnd] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const displayedCharacters = characters ? characters.slice(0, MAX_CHARACTERS_TO_SHOW) : [];
  
  if (!isClient) { 
    return (
        <div className="py-6 text-center text-muted-foreground mt-3 sm:mt-4">
            <Users size={32} className="mx-auto mb-2 opacity-50 animate-pulse" />
            <p>Loading characters...</p>
        </div>
    );
  }

  if (displayedCharacters.length === 0) {
    return (
        <div className="py-6 text-center text-muted-foreground mt-3 sm:mt-4">
            <Users size={32} className="mx-auto mb-2 opacity-50" />
            <p>No character information available for this title yet.</p>
        </div>
    );
  }
  
  const updateNavState = (swiper: SwiperInstance) => {
    setIsBeginning(swiper.isBeginning);
    setIsEnd(swiper.isEnd);
  };

  return (
    <div className="relative py-4 mt-1 sm:mt-2 group">
      <Swiper
        modules={[Navigation]}
        onSwiper={(swiper) => {
          swiperRef.current = swiper;
          updateNavState(swiper);
        }}
        onSlideChange={(swiper) => updateNavState(swiper)}
        spaceBetween={10} // Spacing for character cards
        slidesPerView="auto"
        className="!px-1" // Allow some space for shadows or card outlines
        navigation={{
          nextEl: '.swiper-button-next-character',
          prevEl: '.swiper-button-prev-character',
          disabledClass: 'swiper-button-disabled-custom',
        }}
      >
        {displayedCharacters.map((character) => (
          <SwiperSlide key={character.id} className="!w-auto flex justify-center">
            <CharacterCard character={character} />
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
              "text-white w-8 h-12 md:w-10 md:h-16 p-0",
              "bg-transparent",
              "opacity-100 focus:opacity-100",
              "focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none",
              "flex items-center justify-center swiper-button-prev-character"
            )}
            onClick={() => swiperRef.current?.slidePrev()}
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
      )}
      {!isEnd && (
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "absolute right-0 top-1/2 -translate-y-1/2 z-20",
              "text-white w-8 h-12 md:w-10 md:h-16 p-0",
              "bg-transparent",
              "opacity-100 focus:opacity-100",
              "focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none",
              "flex items-center justify-center swiper-button-next-character"
            )}
            onClick={() => swiperRef.current?.slideNext()}
            aria-label="Scroll right"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
      )}
    </div>
  );
}