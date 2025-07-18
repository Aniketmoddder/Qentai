
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import type { Swiper as SwiperInstance } from 'swiper';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Volume2, VolumeX, Play, Info, Tv, Film, ListVideo } from 'lucide-react';
import { cn } from '@/lib/utils';
import Container from '../layout/container';
import { Skeleton } from '../ui/skeleton';
import type { SpotlightSlide } from '@/types/spotlight';
import type { Anime } from '@/types/anime';
import { gsap } from 'gsap';

type EnrichedSpotlightSlide = Anime & SpotlightSlide;

interface SpotlightSliderProps {
  slides: EnrichedSpotlightSlide[];
  isLoading: boolean;
}

const SpotlightSlider: React.FC<SpotlightSliderProps> = ({ slides, isLoading }) => {
  const [swiper, setSwiper] = useState<SwiperInstance | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [videoVisibility, setVideoVisibility] = useState<Record<number, boolean>>({});

  const videoRefs = useRef<(HTMLVideoElement | HTMLIFrameElement | null)[]>([]);
  const slideChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isAnimating = useRef(false);

  useEffect(() => {
    try {
      const storedMuteState = localStorage.getItem('qentai-spotlight-muted');
      if (storedMuteState !== null) setIsMuted(JSON.parse(storedMuteState));
    } catch (error) {
      console.warn("Could not read mute state from localStorage", error);
    }
  }, []);

  useEffect(() => {
    if (slides.length > 0 && !isLoading) {
      const initialLoadTimeout = setTimeout(() => {
        setVideoVisibility(prev => ({ ...prev, 0: true }));
      }, 6000); 
      return () => clearTimeout(initialLoadTimeout);
    }
  }, [slides.length, isLoading]);
  
  const animateSlideChange = useCallback((swiperInstance: SwiperInstance) => {
    if (isAnimating.current) return;
    isAnimating.current = true;
    
    const slidesElements = swiperInstance.slides;
    const currentSlideEl = slidesElements[swiperInstance.activeIndex];
    const prevSlideEl = slidesElements[swiperInstance.previousIndex];

    const currentBg = currentSlideEl.querySelector('[data-spotlight="background"]');
    const currentContent = currentSlideEl.querySelector('[data-spotlight="content"]');
    const prevBg = prevSlideEl.querySelector('[data-spotlight="background"]');
    const prevContent = prevSlideEl.querySelector('[data-spotlight="content"]');
    
    const isNext = (swiperInstance.realIndex > activeIndex && !(activeIndex === slides.length - 1 && swiperInstance.realIndex === 0)) || (activeIndex === slides.length - 1 && swiperInstance.realIndex === 0);

    gsap.set([currentBg, currentContent, prevBg, prevContent], { clearProps: "all" });

    const tl = gsap.timeline({
        onComplete: () => {
            isAnimating.current = false;
        }
    });

    // Exit animation for previous slide
    if (prevBg && prevContent) {
        tl.to(prevContent, { xPercent: isNext ? -120 : 120, opacity: 0, duration: 0.8, ease: 'expo.inOut' }, 0);
        tl.to(prevBg, { xPercent: isNext ? -100 : 100, scale: 1.1, opacity: 0.5, duration: 1, ease: 'expo.inOut' }, 0);
    }
    
    // Enter animation for current slide
    if (currentBg && currentContent) {
        tl.fromTo(currentBg, 
            { xPercent: isNext ? 100 : -100, scale: 1.1, opacity: 0.5 },
            { xPercent: 0, scale: 1, opacity: 1, duration: 1, ease: 'expo.inOut' },
            0.1 // Stagger start time
        );
        tl.fromTo(currentContent,
            { xPercent: isNext ? 120 : -120, opacity: 0 },
            { xPercent: 0, opacity: 1, duration: 0.8, ease: 'expo.inOut' },
            0.2 // Stagger start time
        );
    }
  }, [activeIndex, slides.length]);


  const handleSlideChangeStart = useCallback((swiperInstance: SwiperInstance) => {
    const oldVideo = videoRefs.current[activeIndex];
    if (oldVideo && 'pause' in oldVideo) (oldVideo as HTMLVideoElement).pause();
    
    animateSlideChange(swiperInstance);

    if (slideChangeTimeoutRef.current) clearTimeout(slideChangeTimeoutRef.current);
    setVideoVisibility(prev => ({ ...prev, [swiperInstance.realIndex]: false }));
  }, [activeIndex, animateSlideChange]);

  const handleSlideChangeEnd = useCallback((swiperInstance: SwiperInstance) => {
    const newIndex = swiperInstance.realIndex;

    slideChangeTimeoutRef.current = setTimeout(() => {
      setVideoVisibility(prev => ({ ...prev, [newIndex]: true }));
    }, 3500);

    setActiveIndex(newIndex);
  }, []);

  useEffect(() => {
    const currentVideo = videoRefs.current[activeIndex];
    if (currentVideo && videoVisibility[activeIndex]) {
        if ('play' in currentVideo) {
            (currentVideo as HTMLVideoElement).muted = isMuted;
            (currentVideo as HTMLVideoElement).currentTime = 0;
            const playPromise = (currentVideo as HTMLVideoElement).play();
            if (playPromise !== undefined) {
                playPromise.catch(err => console.warn("Video autoplay was prevented:", err));
            }
        }
    }
  }, [videoVisibility, activeIndex, isMuted]);

  const toggleMute = () => {
    const newMuteState = !isMuted;
    setIsMuted(newMuteState);
    try {
      localStorage.setItem('qentai-spotlight-muted', JSON.stringify(newMuteState));
    } catch (error) {
      console.warn("Could not save mute state to localStorage", error);
    }
    const currentVideo = videoRefs.current[activeIndex];
    if (currentVideo && 'muted' in currentVideo) {
        (currentVideo as HTMLVideoElement).muted = newMuteState;
    }
  };

  if (isLoading) {
    return (
      <section className="relative h-[55vh] md:h-[70vh] w-full bg-[#0e0e0e] flex items-center justify-center">
        <Skeleton className="absolute inset-0" />
      </section>
    );
  }

  if (slides.length === 0) {
    return (
      <section className="relative h-[55vh] md:h-[70vh] w-full bg-[#0e0e0e] text-white overflow-hidden flex items-center justify-center">
        <Container className="relative z-10 text-center">
          <Tv className="mx-auto h-16 w-16 text-primary/50 mb-4" />
          <h1 className="text-3xl md:text-4xl font-bold font-orbitron">Spotlight</h1>
          <p className="mt-2 text-muted-foreground">No featured content has been added yet.</p>
        </Container>
      </section>
    );
  }

  const typeIconMap: Record<string, JSX.Element> = {
    TV: <Tv className="w-4 h-4" />,
    Movie: <Film className="w-4 h-4" />,
    OVA: <ListVideo className="w-4 h-4" />,
    Special: <ListVideo className="w-4 h-4" />,
    Default: <Info className="w-4 h-4" />
  };

  return (
    <section 
        className="relative h-[55vh] md:h-[70vh] w-full bg-[#0e0e0e] text-white overflow-hidden"
    >
      <Swiper
        onSwiper={setSwiper}
        onSlideChangeTransitionStart={handleSlideChangeStart}
        onSlideChangeTransitionEnd={handleSlideChangeEnd}
        spaceBetween={0}
        slidesPerView={1}
        loop={slides.length > 1}
        allowTouchMove={slides.length > 1}
        className="w-full h-full"
        speed={0} // We let GSAP handle all animation duration
      >
        {slides.map((slide, index) => {
          const firstEpisodeId = slide.episodes?.[0]?.id || '';
          const watchNowUrl = `/play/${slide.id}${firstEpisodeId ? `?episode=${firstEpisodeId}` : ''}`;
          const moreInfoUrl = `/anime/${slide.id}`;
          const videoUrl = slide.trailerUrl;
          const backgroundUrl = slide.backgroundImageUrl;
          const Icon = typeIconMap[slide.type || 'Default'] || typeIconMap.Default;
          const isYouTube = videoUrl?.includes('youtube.com') || videoUrl?.includes('youtu.be');
          const shouldShowVideo = videoVisibility[index] === true;

          const getYouTubeVideoId = (url: string) => {
              try {
                  const urlObj = new URL(url);
                  if (urlObj.hostname === 'youtu.be') return urlObj.pathname.slice(1);
                  if (urlObj.hostname.includes('youtube.com')) return urlObj.searchParams.get('v');
              } catch (e) { /* ignore */ }
              return null;
          }
          const youtubeId = isYouTube ? getYouTubeVideoId(videoUrl) : null;

          return (
            <SwiperSlide key={slide.spotlightId} className="relative !bg-transparent overflow-hidden">
              <div data-spotlight="background" className="absolute inset-0 w-full h-full">
                <Image
                  src={backgroundUrl}
                  alt={slide.title}
                  fill
                  className="w-full h-full object-cover transition-opacity duration-500"
                  style={{ opacity: shouldShowVideo ? 0 : 1, objectFit: 'cover' }}
                  data-ai-hint="anime background scene"
                  priority={index === 0}
                />

                {shouldShowVideo && (
                  isYouTube && youtubeId ? (
                    <iframe
                      ref={el => videoRefs.current[index] = el}
                      src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=${isMuted ? 1 : 0}&loop=1&playlist=${youtubeId}&controls=0&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1&playsinline=1`}
                      title={slide.title}
                      className="absolute w-full h-full object-cover"
                      style={{ border: 0, transform: 'scale(1.5)', objectFit: 'cover' }} 
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : videoUrl ? (
                    <video
                      ref={el => videoRefs.current[index] = el}
                      src={videoUrl}
                      muted
                      loop
                      playsInline
                      autoPlay
                      className="w-full h-full object-cover"
                      style={{objectFit: 'cover'}}
                    />
                  ) : null
                )}
                
                <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e0e]/90 via-[#0e0e0e]/30 to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-[#0e0e0e]/50 via-transparent to-transparent"></div>
              </div>

              <div data-spotlight="content" className="relative z-10 h-full">
                <Container className="h-full flex flex-col justify-end pb-12 md:pb-20">
                  <div className="max-w-xl space-y-3">
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold font-orbitron leading-tight" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
                      {slide.title}
                    </h1>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-neutral-300 font-medium">
                      <span className="flex items-center gap-1.5">{slide.year}</span>
                      <span className="flex items-center gap-1.5">{Icon} {slide.type}</span>
                      <span className="flex items-center gap-1.5">{slide.episodesCount || slide.episodes?.length || 'N/A'} Episodes</span>
                    </div>
                    <p className="text-sm md:text-base text-neutral-300 line-clamp-3 font-light leading-relaxed">
                      {slide.synopsis}
                    </p>
                    <div className="flex items-center gap-3 pt-2">
                      <Button asChild className="btn-spotlight-gradient rounded-full px-5 h-11 text-sm md:text-base">
                        <Link href={watchNowUrl}>
                          <Play className="mr-2 h-5 w-5 fill-current" /> Watch Now
                        </Link>
                      </Button>
                      <Button asChild variant="outline" className="rounded-full px-5 h-11 text-sm md:text-base bg-white/10 text-white border-white/30 hover:bg-white/20 hover:text-white">
                        <Link href={moreInfoUrl}>
                          <Info className="mr-2 h-5 w-5" /> More Info
                        </Link>
                      </Button>
                    </div>
                  </div>
                </Container>
              </div>
            </SwiperSlide>
          );
        })}
      </Swiper>

      <div className="hidden md:flex absolute inset-y-0 left-4 z-20 items-center">
        <Button variant="ghost" size="icon" onClick={() => swiper?.slidePrev()} className="w-12 h-12 rounded-full bg-white/10 text-white hover:bg-white/20 hover:text-primary transition-colors">
          <ChevronLeft className="h-6 w-6" />
        </Button>
      </div>
      <div className="hidden md:flex absolute inset-y-0 right-4 z-20 items-center">
        <Button variant="ghost" size="icon" onClick={() => swiper?.slideNext()} className="w-12 h-12 rounded-full bg-white/10 text-white hover:bg-white/20 hover:text-primary transition-colors">
          <ChevronRight className="h-6 w-6" />
        </Button>
      </div>

      <div className="absolute bottom-6 right-6 md:bottom-8 md:right-8 z-20">
        <Button variant="ghost" size="icon" onClick={toggleMute} className="w-11 h-11 rounded-full bg-black/30 text-white hover:bg-black/50 hover:text-primary transition-colors backdrop-blur-sm">
          {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </Button>
      </div>
    </section>
  );
};

export default SpotlightSlider;
