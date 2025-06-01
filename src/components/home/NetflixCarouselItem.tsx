
'use client';

import React, { useRef, useEffect, useState } // Changed useLayoutEffect to useEffect
import Image from 'next/image';
import { gsap } from 'gsap';
import { TextPlugin } from 'gsap/TextPlugin';
import type { Anime } from '@/types/anime';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

gsap.registerPlugin(TextPlugin);

interface NetflixCarouselItemProps {
  anime: Anime & { rank: number };
  isActive: boolean;
  isPrev: boolean;
  isNext: boolean;
}

const NetflixCarouselItem: React.FC<NetflixCarouselItemProps> = ({ anime, isActive, isPrev, isNext }) => {
  const itemRef = useRef<HTMLDivElement>(null);
  const posterRef = useRef<HTMLDivElement>(null);
  const numberRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const glintOverlayRef = useRef<HTMLDivElement>(null);
  
  const hoverFloatTlRef = useRef<gsap.core.Timeline | null>(null);
  const activeNumberPulseTlRef = useRef<gsap.core.Timeline | null>(null);

  const [isMounted, setIsMounted] = useState(false);
  const [primaryHSLString, setPrimaryHSLString] = useState<string | null>(null);
  const [accentHSLString, setAccentHSLString] = useState<string | null>(null);
  const [currentRankText, setCurrentRankText] = useState(""); // For text scramble

  const rankStr = anime.rank.toString();
  const rankStrLength = rankStr.length;

  const animationDefaults = {
    duration: 0.6, // Slightly longer for smoother feel
    ease: "power3.out",
  };

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      const computedPrimaryHSL = getComputedStyle(document.documentElement).getPropertyValue('--primary-raw-hsl').trim();
      const computedAccentHSL = getComputedStyle(document.documentElement).getPropertyValue('--accent-raw-hsl').trim();
      
      setPrimaryHSLString(computedPrimaryHSL || null);
      setAccentHSLString(computedAccentHSL || null);
    }
  }, []);

  useEffect(() => { // Changed from useLayoutEffect
    if (!itemRef.current || !posterRef.current || !numberRef.current || !isMounted) return;

    const itemEl = itemRef.current;
    const posterEl = posterRef.current;
    const numberEl = numberRef.current;

    gsap.killTweensOf([itemEl, posterEl, numberEl]);
    if (activeNumberPulseTlRef.current) {
      activeNumberPulseTlRef.current.kill();
      activeNumberPulseTlRef.current = null;
    }
    
    const tl = gsap.timeline({ defaults: animationDefaults });

    if (isActive) {
      tl.to(posterEl, {
        scale: 1.1, 
        y: -15,
        opacity: 1,
        rotationY: -5, 
        boxShadow: primaryHSLString ? `0px 18px 40px -10px hsla(${primaryHSLString}, 0.35)` : "0px 18px 40px -10px rgba(139,92,246,0.3)",
        zIndex: 2, 
      }, 0);

      gsap.set(numberEl, { opacity: 0, scale: 0.8, y: 0, x:0, rotationZ:0 }); 
      
      tl.to(numberEl, {
        duration: 0.8, 
        text: {
          value: rankStr,
          delimiter: "", 
        },
        ease: "power2.inOut",
        onStart: () => { numberEl.style.opacity = "0"; }, 
        onComplete: () => { 
          gsap.to(numberEl, {
            opacity: 0.9, 
            scale: 1,
            filter: "blur(0px)",
            duration: 0.4,
            ease: "power3.out"
          });
        }
      }, "<0.1") 
      .to(numberEl, { 
          filter: "blur(5px)", 
          opacity:0, 
          duration:0, 
          immediateRender: true
      }, "<0.1");


      if (accentHSLString) {
         activeNumberPulseTlRef.current = gsap.timeline({ repeat: -1, yoyo: true, delay: 1 })
          .to(numberEl, {
            webkitTextStrokeColor: `hsla(${accentHSLString}, 0.8)`,
            duration: 1.5,
            ease: "sine.inOut"
          })
          .to(numberEl, {
            webkitTextStrokeColor: `hsl(var(--ranking-number-stroke-color, hsl(var(--foreground))))`, 
            duration: 1.5,
            ease: "sine.inOut"
          }, ">");
      }

    } else { 
      const tiltAngle = isPrev ? 10 : (isNext ? -10 : 0); 
      tl.to(posterEl, {
        scale: 0.9, 
        y: 0,
        opacity: 0.5, 
        rotationY: tiltAngle,
        boxShadow: "0 8px 24px rgba(0,0,0,0.4)", 
        zIndex: 0,
      }, 0);

      if (activeNumberPulseTlRef.current) {
        activeNumberPulseTlRef.current.kill();
        gsap.set(numberEl, { webkitTextStrokeColor: `hsl(var(--ranking-number-stroke-color, hsl(var(--foreground))))`});
      }
      tl.to(numberEl, {
        opacity: 0, 
        scale: 0.8,
        filter: "blur(5px)",
        x:0, y:0, 
        rotationZ: 0,
      }, "<0.05");
    }
    return () => {
      gsap.killTweensOf([itemEl, posterEl, numberEl, imageRef.current, glintOverlayRef.current]);
      if (hoverFloatTlRef.current) hoverFloatTlRef.current.kill();
      if (activeNumberPulseTlRef.current) activeNumberPulseTlRef.current.kill();
    }
  }, [isActive, isPrev, isNext, rankStr, animationDefaults, isMounted, primaryHSLString, accentHSLString]);

  useEffect(() => { 
    if (!itemRef.current || !posterRef.current || !numberRef.current || !glintOverlayRef.current || !isMounted) return;

    const itemEl = itemRef.current;
    const posterEl = posterRef.current;
    const glintEl = glintOverlayRef.current;

    const handleMouseEnter = () => {
      const currentIsActive = itemRef.current?.closest('.swiper-slide-active') !== null;
      
      if(hoverFloatTlRef.current) hoverFloatTlRef.current.kill();
      hoverFloatTlRef.current = gsap.timeline({repeat: -1, yoyo: true})
        .to(posterEl, { y: currentIsActive ? (gsap.getProperty(posterEl, "y") as number) - 3 : (gsap.getProperty(posterEl, "y") as number) - 4, duration: 2, ease: "sine.inOut" });

      gsap.to(posterEl, { 
        scale: currentIsActive ? 1.12 : 0.92, 
        duration: 0.25, 
        ease: "power2.out" 
      });
      
      gsap.set(glintEl, { x: "-120%", opacity: 0.6 });
      gsap.to(glintEl, {
        x: "120%",
        duration: 0.7,
        ease: "power2.inOut",
        onComplete: () => gsap.set(glintEl, { opacity: 0 })
      });
    };

    const handleMouseLeave = () => {
      const currentIsActive = itemRef.current?.closest('.swiper-slide-active') !== null;
      if (hoverFloatTlRef.current) {
        hoverFloatTlRef.current.kill();
        gsap.to(posterEl, { y: currentIsActive ? -15 : 0, duration: 0.3, ease: "power2.out" });
      }
      gsap.to(posterEl, { 
        scale: currentIsActive ? 1.1 : 0.9, 
        duration: 0.4, 
        ease: "power3.out" 
      });
      gsap.set(glintEl, { opacity: 0 });
    };
    
    if (itemEl) {
        itemEl.addEventListener('mouseenter', handleMouseEnter);
        itemEl.addEventListener('mouseleave', handleMouseLeave);
    }

    return () => {
      if (itemEl) {
          itemEl.removeEventListener('mouseenter', handleMouseEnter);
          itemEl.removeEventListener('mouseleave', handleMouseLeave);
      }
      if (hoverFloatTlRef.current) hoverFloatTlRef.current.kill();
    };
  }, [isMounted, isActive]); // isActive dependency ensures hover base positions are correct

  const placeholderCover = `https://placehold.co/180x270.png`;

  return (
    <div className="netflix-carousel-item-wrapper" ref={itemRef}>
      <div className="netflix-ranking-number-overlay" ref={numberRef}>
        {/* Content set by GSAP TextPlugin */}
      </div>
      <div className="netflix-show-poster-container" ref={posterRef}>
        <Image
          ref={imageRef}
          src={anime.coverImage || placeholderCover}
          alt={anime.title}
          fill
          sizes="180px"
          className="netflix-show-poster"
          priority={isActive}
          data-ai-hint="anime series poster"
        />
        <div className="netflix-glint-overlay" ref={glintOverlayRef}></div>
        {(isActive && (anime.isFeatured || (anime.rank !== undefined && anime.rank <=3))) && (
          <div className="absolute top-2 right-2 z-10 flex flex-col gap-1.5 items-end">
            {anime.isFeatured && <Badge variant="secondary" className="text-xs bg-yellow-500/90 text-black shadow-md">Featured</Badge>}
            {(anime.rank !== undefined && anime.rank <= 10) && <Badge variant="default" className="text-xs bg-primary/90 text-primary-foreground shadow-md">Top {anime.rank}</Badge>}
          </div>
        )}
      </div>
    </div>
  );
};

export default NetflixCarouselItem;
