// src/components/home/ShowsCarousel.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectCoverflow, Controller } from 'swiper/modules';
import CarouselItem from './CarouselItem';
import { cn } from '@/lib/utils';
import type { Anime } from '@/types/anime';

// CSS imports are in globals.css as per previous instruction
// import 'swiper/css';
// import 'swiper/css/effect-coverflow';
// import 'swiper/css/autoplay';

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
          modules={[Autoplay, EffectCoverflow, Controller]}
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
          className="shows-swiper-container"
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