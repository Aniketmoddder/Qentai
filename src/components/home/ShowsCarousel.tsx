// src/components/home/ShowsCarousel.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectCoverflow, Controller } from 'swiper/modules';
import CarouselItem from './CarouselItem';
import type { Anime } from '@/types/anime';
import { cn } from '@/lib/utils';

import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/autoplay';
// Ensure Carousel.css equivalent styles are in globals.css or a module

interface ShowsCarouselProps {
  tvShows: Anime[];
  title?: string;
}

const ShowsCarousel: React.FC<ShowsCarouselProps> = ({ tvShows, title = "Trending TV Shows" }) => {
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  const rankedShows = useMemo(() =>
    tvShows.map((show, index) => ({ ...show, rank: index + 1 })),
    [tvShows]
  );

  if (!rankedShows || rankedShows.length === 0) {
    return null; // Don't render if no TV shows
  }

  return (
    <section className="py-8 md:py-12">
      <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6 md:mb-8 text-center md:text-left font-zen-dots section-title-bar">
        {title}
      </h2>
      <div className={cn(
        "shows-carousel-container-wrapper", // Use this for global CSS targeting if needed
        "w-full max-w-screen-lg mx-auto relative" // Centering and max-width
      )}>
        <Swiper
          modules={[Autoplay, EffectCoverflow, Controller]}
          effect="coverflow"
          grabCursor={true}
          centeredSlides={true}
          slidesPerView={'auto'}
          loop={rankedShows.length > 5} // Loop only if enough items
          autoplay={{
            delay: 3500,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }}
          speed={700}
          coverflowEffect={{
            rotate: 25,      // Slightly less rotation
            stretch: -20,   // Pull slides slightly closer
            depth: 120,     // More pronounced depth
            modifier: 1,
            slideShadows: false, // We'll use custom styling or Tailwind shadows
          }}
          onSlideChange={(swiper) => setActiveSlideIndex(swiper.realIndex)}
          className="shows-swiper-container" // Use this for global CSS targeting if needed
        >
          {rankedShows.map((show) => (
            <SwiperSlide key={show.id} className="shows-swiper-slide"> {/* Use for global CSS */}
              {({ isActive, isPrev, isNext }) => (
                <CarouselItem
                  rank={show.rank}
                  imageUrl={show.coverImage || `https://placehold.co/180x270.png`}
                  altText={show.title}
                  isActive={isActive}
                  isPrev={isPrev}
                  isNext={isNext}
                  showId={show.id}
                />
              )}
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
};

export default ShowsCarousel;
