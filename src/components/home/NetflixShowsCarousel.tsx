
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectCoverflow, Navigation, Keyboard } from 'swiper/modules';
import NetflixCarouselItem from './NetflixCarouselItem'; // Ensure this path is correct
import type { Anime } from '@/types/anime';
import { cn } from '@/lib/utils';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/autoplay';
import 'swiper/css/navigation';
import 'swiper/css/keyboard';

interface NetflixShowsCarouselProps {
  shows: Anime[];
  title: string;
}

const MAX_CARDS_TO_SHOW = 15;

const NetflixShowsCarousel: React.FC<NetflixShowsCarouselProps> = ({ shows, title }) => {
  const [swiperInstance, setSwiperInstance] = useState<any>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const rankedShows = useMemo(() => {
    return shows
      .slice(0, MAX_CARDS_TO_SHOW)
      .map((show, index) => ({ ...show, rank: index + 1 }));
  }, [shows]);

  if (!isClient || !rankedShows || rankedShows.length === 0) {
    // Render nothing or a placeholder if not client-side or no shows
    return null; 
  }

  return (
    <div className="py-6 md:py-8 netflix-carousel-container-wrapper">
      <h2 className="carousel-title">{title}</h2>
      <div className="netflix-swiper-container"> {/* Changed class from shows-carousel-container */}
        <Swiper
          modules={[Autoplay, EffectCoverflow, Navigation, Keyboard]}
          onSwiper={setSwiperInstance}
          effect="coverflow"
          grabCursor={true}
          centeredSlides={true}
          slidesPerView={'auto'} 
          loop={rankedShows.length > 5} // Loop only if enough slides (e.g., > 5 for a 3-visible setup)
          rewind={rankedShows.length <= 5}
          autoplay={{
            delay: 3000,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }}
          speed={600}
          coverflowEffect={{
            rotate: 25, // Rotation of side slides
            stretch: 10, // Adjust for spacing between slides
            depth: 120,  // Depth offset of side slides
            modifier: 1, // Effect multiplier
            slideShadows: false, 
          }}
          navigation={false} // Using custom or no navigation for now, can be enabled
          keyboard={{
            enabled: true,
          }}
          className="netflix-swiper-container" // Main Swiper class
          breakpoints={{
            // Mobile: show ~2 items, less depth/rotate for clarity
            0: { slidesPerView: 2, spaceBetween: 10, coverflowEffect: { rotate: 15, stretch: -10, depth: 60 } },
            // Tablet: show ~3 items
            768: { slidesPerView: 3, spaceBetween: 15, coverflowEffect: { rotate: 20, stretch: 0, depth: 100 } },
            // Desktop: 'auto' or ~3-5 items
            1024: { slidesPerView: 'auto', spaceBetween: 16, coverflowEffect: { rotate: 25, stretch: 10, depth: 120 } },
          }}
        >
          {rankedShows.map((show, index) => (
            <SwiperSlide key={show.id} className="netflix-swiper-slide">
              {({ isActive, isPrev, isNext }) => (
                <NetflixCarouselItem
                  anime={{...show, rank: show.rank}}
                  isActive={isActive}
                  isPrev={isPrev}
                  isNext={isNext}
                />
              )}
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );
};

export default NetflixShowsCarousel;
