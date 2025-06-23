
'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SeasonSelectorProps {
  seasons: number[];
  activeSeason: number;
  onSeasonSelect: (season: number) => void;
}

export default function SeasonSelector({ seasons, activeSeason, onSeasonSelect }: SeasonSelectorProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const checkForScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (el) {
      const { scrollLeft, scrollWidth, clientWidth } = el;
      setCanScrollPrev(scrollLeft > 0);
      setCanScrollNext(scrollLeft < scrollWidth - clientWidth - 1);
    }
  }, []);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (el) {
      checkForScroll();
      el.addEventListener('scroll', checkForScroll, { passive: true });
      return () => el.removeEventListener('scroll', checkForScroll);
    }
  }, [seasons, checkForScroll]);
  
  useEffect(() => {
    const activeItem = document.getElementById(`season-card-${activeSeason}`);
    if(activeItem && scrollContainerRef.current) {
        activeItem.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activeSeason]);


  const handleScroll = (direction: 'prev' | 'next') => {
    const el = scrollContainerRef.current;
    if (el) {
      const scrollAmount = el.clientWidth * 0.75; // Scroll 75% of the visible width
      el.scrollBy({
        left: direction === 'prev' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="relative group/seasonselector">
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "absolute left-0 top-1/2 -translate-y-1/2 z-10 h-full w-10 rounded-none bg-gradient-to-r from-background/80 to-transparent opacity-0 group-hover/seasonselector:opacity-100 transition-opacity hidden md:flex",
          !canScrollPrev && "hidden"
        )}
        onClick={() => handleScroll('prev')}
      >
        <ChevronLeft className="h-6 w-6" />
      </Button>

      <ScrollArea className="w-full">
        <div
          ref={scrollContainerRef}
          className="flex items-center gap-3 p-2 md:p-3 scroll-smooth scrollbar-hide"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {seasons.map((seasonNum, index) => (
            <button
              key={seasonNum}
              id={`season-card-${seasonNum}`}
              onClick={() => onSeasonSelect(seasonNum)}
              className={cn(
                'relative flex-shrink-0 w-28 h-14 md:w-32 md:h-16 p-2 rounded-lg border-2 transition-all duration-300 ease-in-out overflow-hidden animate__animated animate__fadeIn',
                'bg-card/50 backdrop-blur-sm shadow-md hover:scale-105 hover:shadow-primary/20',
                activeSeason === seasonNum
                  ? 'border-primary shadow-xl shadow-primary/30 scale-105'
                  : 'border-border/30',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'
              )}
              style={{
                scrollSnapAlign: 'center',
                animationDelay: `${index * 75}ms`
              }}
            >
              <div
                className={cn(
                  'absolute -inset-2 transition-all duration-500 ease-out',
                  activeSeason === seasonNum
                    ? 'bg-primary/20 opacity-100 scale-110'
                    : 'opacity-0 scale-100'
                )}
                style={{ filter: 'blur(15px)' }}
              />
              <div className="relative z-10 w-full h-full flex flex-col items-center justify-center">
                <span className="text-xs text-muted-foreground">SEASON</span>
                <span className="text-xl md:text-2xl font-bold text-foreground">
                  {String(seasonNum).padStart(2, '0')}
                </span>
              </div>
            </button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" className="md:hidden"/>
      </ScrollArea>
      
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "absolute right-0 top-1/2 -translate-y-1/2 z-10 h-full w-10 rounded-none bg-gradient-to-l from-background/80 to-transparent opacity-0 group-hover/seasonselector:opacity-100 transition-opacity hidden md:flex",
          !canScrollNext && "hidden"
        )}
        onClick={() => handleScroll('next')}
      >
        <ChevronRight className="h-6 w-6" />
      </Button>
    </div>
  );
}
