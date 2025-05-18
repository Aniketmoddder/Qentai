// src/components/home/ShowsCarousel.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectCoverflow } from 'swiper/modules'; // Removed Controller
import CarouselItem from './CarouselItem';
import { cn } from '@/lib/utils';
import type { Anime } from '@/types/anime';

// CSS imports are in globals.css

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
    return null;
  }

  return (
    <section className="py-8 md:py-12">
      <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6 md:mb-8 text-center md:text-left font-zen-dots section-title-bar">
        {title}
      </h2>
      <div className={cn(
        "shows-carousel-container-wrapper", // New wrapper class for potential future styling
        "w-full max-w-screen-lg mx-auto relative" // Centering and max-width
      )}>
        <Swiper
          modules={[Autoplay, EffectCoverflow]} // Removed Controller module
          effect="coverflow"
          grabCursor={true}
          centeredSlides={true}
          slidesPerView={'auto'}
          loop={rankedShows.length > 5} // Loop only if enough slides
          autoplay={{
            delay: 3500, // Slightly increased delay
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }}
          speed={700} // Smooth transition speed
          coverflowEffect={{
            rotate: 25, // Rotation of side slides
            stretch: -20,  // Negative stretch for a tighter feel
            depth: 120,   // Depth offset of side slides
            modifier: 1,  // Effect multiplier
            slideShadows: false, // Disable default shadows if using custom
          }}
          onSlideChange={(swiper) => setActiveSlideIndex(swiper.realIndex)}
          className="shows-swiper-container" // Global CSS class for Swiper instance
        >
          {rankedShows.map((show, index) => ( // Added index for virtualIndex
            <SwiperSlide key={show.id} className="shows-swiper-slide" virtualIndex={index}> {/* Added virtualIndex */}
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
