// src/components/home/ShowsCarousel.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectCoverflow } from 'swiper/modules';
import CarouselItem from './CarouselItem';
import { cn } from '@/lib/utils';
import type { Anime } from '@/types/anime';

// Swiper styles from globals.css are applied via className="shows-swiper-container"
// and specific .swiper-slide styling within globals.css if needed.

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
        "shows-carousel-container-wrapper", 
        "w-full max-w-screen-lg mx-auto relative" 
      )}>
        <Swiper
          modules={[Autoplay, EffectCoverflow]}
          effect="coverflow"
          grabCursor={true}
          centeredSlides={true}
          slidesPerView={'auto'} 
          loop={rankedShows.length > 5} 
          autoplay={{
            delay: 3500,
            disableOnInteraction: false, 
            pauseOnMouseEnter: true,
          }}
          speed={700} 
          coverflowEffect={{
            rotate: 25, 
            stretch: -20, 
            depth: 120,  
            modifier: 1, 
            slideShadows: false, 
          }}
          onSlideChange={(swiper) => setActiveSlideIndex(swiper.realIndex)}
          className="shows-swiper-container" // Class for global styles
        >
          {rankedShows.map((show) => ( 
            <SwiperSlide key={show.id} className="shows-swiper-slide"> {/* Removed virtualIndex as per last attempt */}
              {({ isActive, isPrev, isNext }) => (
                <> {/* Explicit React.Fragment */}
                  <CarouselItem
                    rank={show.rank}
                    imageUrl={show.coverImage || `https://placehold.co/180x270.png`}
                    altText={show.title}
                    isActive={isActive}
                    isPrev={isPrev}
                    isNext={isNext}
                    showId={show.id}
                  />
                </>
              )}
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
};
export default ShowsCarousel;
