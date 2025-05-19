
'use client';

import React, { useState, useMemo } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectCoverflow, Navigation, Keyboard } from 'swiper/modules';
import NetflixCarouselItem from './NetflixCarouselItem';
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
  const [swiperInstance, setSwiperInstance] = useState<any>(null); // Swiper instance type can be complex

  const rankedShows = useMemo(() => {
    return shows
      .slice(0, MAX_CARDS_TO_SHOW)
      .map((show, index) => ({ ...show, rank: index + 1 }));
  }, [shows]);

  if (!rankedShows || rankedShows.length === 0) {
    return null;
  }

  return (
    <div className="py-6 md:py-8 netflix-carousel-container-wrapper">
      <h2 className="carousel-title">{title}</h2>
      <div className="shows-carousel-container">
        <Swiper
          modules={[Autoplay, EffectCoverflow, Navigation, Keyboard]}
          onSwiper={setSwiperInstance}
          effect="coverflow"
          grabCursor={true}
          centeredSlides={true}
          slidesPerView={'auto'} // Let Coverflow effect and item width determine this
          loop={rankedShows.length > 3} // Loop only if enough slides for it to make sense
          rewind={rankedShows.length <=3} // Use rewind if not looping
          autoplay={{
            delay: 3000,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }}
          speed={600}
          coverflowEffect={{
            rotate: 25,
            stretch: 10, // Adjust for spacing
            depth: 120,
            modifier: 1,
            slideShadows: false, // Custom shadows if needed
          }}
          navigation={false} // We'll use GSAP or custom buttons if needed, Owl uses 'nav'
          keyboard={{
            enabled: true,
          }}
          className="shows-swiper-container"
          breakpoints={{
            0: { slidesPerView: 2, spaceBetween: 10, coverflowEffect: { rotate: 20, stretch: 0, depth: 80 } }, // Mobile
            768: { slidesPerView: 3, spaceBetween: 16, coverflowEffect: { rotate: 25, stretch: 5, depth: 100 } }, // Tablet
            1024: { slidesPerView: 'auto', spaceBetween: 16, coverflowEffect: { rotate: 25, stretch: 10, depth: 120 } }, // Desktop (default)
          }}
        >
          {rankedShows.map((show) => (
            <SwiperSlide key={show.id} className="shows-swiper-slide">
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
