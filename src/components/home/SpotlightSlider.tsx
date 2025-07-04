
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import type { Swiper as SwiperInstance } from 'swiper';
import 'swiper/css';
import { gsap } from 'gsap';
import Image from 'next/image';

import type { SpotlightSlide } from '@/types/spotlight';
import type { Anime } from '@/types/anime';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Volume2, VolumeX, Play, Info, Tv, Film, ListVideo, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Container from '../layout/container';
import Link from 'next/link';
import { Skeleton } from '../ui/skeleton';
import PlyrComponent from 'plyr-react';
import type Plyr from 'plyr';
import 'plyr/dist/plyr.css';


type EnrichedSpotlightSlide = Anime & SpotlightSlide;

interface SpotlightSliderProps {
  slides: EnrichedSpotlightSlide[];
  isLoading: boolean;
}

const SpotlightSlider: React.FC<SpotlightSliderProps> = ({ slides, isLoading }) => {
  const [swiper, setSwiper] = useState<SwiperInstance | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const videoRefs = useRef<(Plyr | null)[]>([]);
  const slideContentRefs = useRef<(HTMLDivElement | null)[]>([]);
  const slideBackgroundRefs = useRef<(HTMLDivElement | null)[]>([]);
  const activeIndexRef = useRef(0);

  const handleSlideChange = useCallback((swiperInstance: SwiperInstance) => {
    const newIndex = swiperInstance.realIndex;
    const oldIndex = activeIndexRef.current;

    // Pause the old video
    const oldVideo = videoRefs.current[oldIndex];
    if (oldVideo && typeof oldVideo.pause === 'function') {
      try {
        oldVideo.pause();
        oldVideo.currentTime = 0;
      } catch (e) {
        console.warn(`Could not pause video at index ${oldIndex}`, e);
      }
    }
    
    // Animate new slide content
    const currentSlideContent = slideContentRefs.current[newIndex];
    if (currentSlideContent) {
      const contentElements = currentSlideContent.children;
      gsap.fromTo(contentElements, 
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, stagger: 0.15, duration: 0.6, delay: 0.2, ease: "power3.out" }
      );
    }
    
    // Animate new slide background
    const currentBackground = slideBackgroundRefs.current[newIndex];
    if (currentBackground) {
        gsap.fromTo(currentBackground, { scale: 1.15 }, { scale: 1, duration: 8, ease: 'power1.inOut' });
    }

    // Play the new video after a delay
    const newVideo = videoRefs.current[newIndex];
    if (newVideo) {
      setTimeout(() => {
        // Re-check the current active index before playing, to avoid playing on a stale slide
        if (activeIndexRef.current === newIndex && typeof newVideo.play === 'function') {
          const playPromise = newVideo.play();
          if (playPromise !== undefined) {
            playPromise.catch(err => console.warn("Video autoplay was prevented:", err));
          }
        }
      }, 1500);
    }

    // Update active index state and ref
    setActiveIndex(newIndex);
    activeIndexRef.current = newIndex;
  }, []);

  useEffect(() => {
    // This effect runs once to set the initial mute state from localStorage
    try {
      const storedMuteState = localStorage.getItem('qentai-spotlight-muted');
      if (storedMuteState !== null) {
        setIsMuted(JSON.parse(storedMuteState));
      }
    } catch (error) {
      console.warn("Could not read mute state from localStorage", error)
    }
  }, []);

  const toggleMute = () => {
    const newMuteState = !isMuted;
    setIsMuted(newMuteState);
     try {
      localStorage.setItem('qentai-spotlight-muted', JSON.stringify(newMuteState));
    } catch (error)       {
       console.warn("Could not save mute state to localStorage", error)
    }
  };

  useEffect(() => {
    // This effect now ONLY handles muting the current video when isMuted state changes
    const currentVideo = videoRefs.current[activeIndex];
    if (currentVideo) {
      currentVideo.muted = isMuted;
      gsap.to(currentVideo, { volume: isMuted ? 0 : 1, duration: 0.5 });
    }
  }, [isMuted, activeIndex]);
  
  if (isLoading) {
    return (
      <section className="relative h-[60vh] md:h-[75vh] w-full bg-[#0e0e0e] flex items-center justify-center">
        <Skeleton className="absolute inset-0" />
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </section>
    );
  }
  
  if (slides.length === 0) {
    return (
      <section className="relative h-[60vh] md:h-[75vh] w-full bg-[#0e0e0e] text-white overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e0e] via-[#0e0e0e]/70 to-transparent"></div>
        <Container className="relative z-10 text-center">
          <Tv className="mx-auto h-16 w-16 text-primary/50 mb-4" />
          <h1 className="text-3xl md:text-4xl font-bold font-orbitron">Spotlight</h1>
          <p className="mt-2 text-muted-foreground">No featured content has been added yet.</p>
          <p className="text-sm text-muted-foreground/70">An administrator can add slides in the Spotlight Manager.</p>
        </Container>
      </section>
    );
  }

  const typeIconMap: Record<string, JSX.Element> = {
    TV: <Tv className="w-4 h-4" />,
    Movie: <Film className="w-4 h-4" />,
    OVA: <ListVideo className="w-4 h-4" />,
    Special: <ListVideo className="w-4 h-4" />,
    Default: <Info className="w-4 h-4"/>
  };

  return (
    <section className="relative h-[60vh] md:h-[75vh] w-full bg-[#0e0e0e] text-white overflow-hidden">
      <Swiper
        onSwiper={setSwiper}
        onSlideChangeTransitionEnd={handleSlideChange}
        spaceBetween={0}
        slidesPerView={1}
        loop={slides.length > 1}
        allowTouchMove={true}
        className="w-full h-full"
      >
        {slides.map((slide, index) => {
          const firstEpisodeId = slide.episodes?.[0]?.id || '';
          const watchNowUrl = `/play/${slide.id}${firstEpisodeId ? `?episode=${firstEpisodeId}` : ''}`;
          const moreInfoUrl = `/anime/${slide.id}`;
          const videoUrl = slide.trailerUrl;
          const backgroundUrl = slide.backgroundImageUrl;
          const Icon = typeIconMap[slide.type || 'Default'] || typeIconMap.Default;
          const isYoutubeVideo = videoUrl && (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be'));

          return (
            <SwiperSlide key={slide.spotlightId} className="relative">
              <div 
                ref={el => slideBackgroundRefs.current[index] = el}
                className="absolute inset-0 w-full h-full overflow-hidden"
              >
                 {videoUrl ? (
                    isYoutubeVideo ? (
                        <div className="youtube-background-player w-full h-full opacity-30">
                            <PlyrComponent
                                ref={(r) => { if (r) videoRefs.current[index] = r.plyr; }}
                                source={{
                                    type: 'video',
                                    sources: [{ src: videoUrl, provider: 'youtube' }],
                                }}
                                options={{
                                    autoplay: false, // handled by useEffect
                                    muted: isMuted,
                                    loop: { active: true },
                                    controls: [],
                                    clickToPlay: false,
                                    fullscreen: { enabled: false, fallback: false, iosNative: false },
                                    tooltips: { controls: false, seek: false },
                                    youtube: { noCookie: true, rel: 0, showinfo: 0, iv_load_policy: 3, modestbranding: 1 }
                                }}
                            />
                        </div>
                    ) : (
                        <video
                            ref={el => videoRefs.current[index] = el}
                            src={videoUrl}
                            muted={isMuted}
                            loop
                            playsInline
                            preload="metadata"
                            className="w-full h-full object-cover opacity-30"
                        />
                    )
                ) : (
                  <Image 
                    src={backgroundUrl}
                    alt={slide.title}
                    fill
                    className="object-cover opacity-30"
                    data-ai-hint="anime background scene"
                    priority={index === 0}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e0e] via-[#0e0e0e]/50 to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-[#0e0e0e]/70 via-transparent to-transparent"></div>
              </div>
              <Container className="relative z-10 h-full flex flex-col justify-end pb-12 md:pb-20">
                <div ref={el => slideContentRefs.current[index] = el} className="max-w-xl space-y-3">
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold font-orbitron leading-tight" style={{textShadow: '0 2px 10px rgba(0,0,0,0.5)'}}>
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
                    <Button asChild variant="outline" className="rounded-full px-5 h-11 text-sm md:text-base bg-transparent text-white border-primary hover:bg-primary/10 hover:text-white">
                        <Link href={moreInfoUrl}>
                            <Info className="mr-2 h-5 w-5" /> More Info
                        </Link>
                    </Button>
                  </div>
                </div>
              </Container>
            </SwiperSlide>
          );
        })}
      </Swiper>

      {/* Desktop Chevrons */}
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
      
      {/* Audio Toggle */}
      <div className="absolute bottom-6 right-6 md:bottom-8 md:right-8 z-20">
        <Button variant="ghost" size="icon" onClick={toggleMute} className="w-11 h-11 rounded-full bg-black/30 text-white hover:bg-black/50 hover:text-primary transition-colors backdrop-blur-sm">
          {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </Button>
      </div>
    </section>
  );
};

export default SpotlightSlider;
