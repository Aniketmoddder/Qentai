
'use client';

import React, { useRef, useEffect, useLayoutEffect, useState } from 'react';
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

  const rankStr = anime.rank.toString();
  const rankStrLength = rankStr.length;

  const animationDefaults = {
    duration: 0.6,
    ease: "power3.out",
  };

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      const computedPrimaryHSL = getComputedStyle(document.documentElement).getPropertyValue('--primary-raw-hsl').trim();
      const computedAccentHSL = getComputedStyle(document.documentElement).getPropertyValue('--accent-raw-hsl').trim();
      if (computedPrimaryHSL) setPrimaryHSLString(computedPrimaryHSL);
      if (computedAccentHSL) setAccentHSLString(computedAccentHSL);
    }
  }, []);

  useLayoutEffect(() => {
    if (!itemRef.current || !posterRef.current || !numberRef.current || !imageRef.current || !isMounted) return;

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
        scale: 1.12,
        y: -15,
        opacity: 1,
        rotationY: -3,
        rotationX: 3,
        boxShadow: primaryHSLString ? `0px 15px 35px -5px hsla(${primaryHSLString}, 0.3)` : "0px 15px 35px -5px rgba(139,92,246,0.25)",
        zIndex: 10,
      }, 0);

      gsap.set(numberEl, { opacity: 0, scale: 0.7, y: 30, x: 0 });
      let scrambleCounter = 0;
      const scrambleDuration = 0.025;
      const scrambleRepeats = Math.max(8, rankStrLength * 2);

      tl.to(numberEl, {
        duration: scrambleDuration * scrambleRepeats,
        onStart: () => { numberEl.style.color = accentHSLString ? `hsl(${accentHSLString})` : 'hsl(var(--accent))'; },
        onUpdate: function() {
          scrambleCounter++;
          if (scrambleCounter < scrambleRepeats) {
            let randomText = "";
            for (let i = 0; i < rankStrLength; i++) {
              randomText += Math.random() > 0.5 ? Math.floor(Math.random() * 10) : "!<>-_#?*".charAt(Math.floor(Math.random() * 8));
            }
            numberEl.textContent = randomText;
          } else {
            numberEl.textContent = rankStr;
          }
        },
        ease: "none"
      }, "<0.1")
      .to(numberEl, {
        opacity: 1, 
        scale: 1.0, 
        y: -15, // Adjusted y for active number
        x: 0,
        ease: "back.out(1.2)",
        onComplete: () => {
          if (activeNumberPulseTlRef.current) activeNumberPulseTlRef.current.kill();
            activeNumberPulseTlRef.current = gsap.timeline({ repeat: -1, yoyo: true })
            .to(numberEl, {
                textShadow: primaryHSLString ? `0 0 8px hsla(${primaryHSLString},0.5), 0 0 15px hsla(${primaryHSLString},0.3)` : `0 0 8px rgba(139,92,246,0.4), 0 0 15px rgba(139,92,246,0.25)`,
                duration: 1.5,
                ease: "sine.inOut"
            });
        }
      }, `-=${scrambleDuration * scrambleRepeats * 0.2}`);

    } else {
      const tiltAngle = isPrev ? -2.0 : (isNext ? 2.0 : 0);
      tl.to(posterEl, {
        scale: 0.82,
        y: 0,
        opacity: 0.55,
        rotationY: 0,
        rotationX: 0,
        rotationZ: tiltAngle,
        boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
        zIndex: 1,
      }, 0);

      if (activeNumberPulseTlRef.current) {
        activeNumberPulseTlRef.current.kill();
         gsap.set(numberEl, {textShadow: '1px 1px 0px transparent'}); // Reset shadow immediately
      }
      tl.to(numberEl, {
        opacity: 0,
        scale: 0.8,
        y: 10,
        x: 0, 
      }, "<0.05");
    }
    return () => {
      gsap.killTweensOf([itemEl, posterEl, numberEl, imageRef.current, glintOverlayRef.current]);
      if (hoverFloatTlRef.current) hoverFloatTlRef.current.kill();
      if (activeNumberPulseTlRef.current) activeNumberPulseTlRef.current.kill();
    }
  }, [isActive, isPrev, isNext, rankStr, rankStrLength, animationDefaults, isMounted, primaryHSLString, accentHSLString]);

  useEffect(() => {
    if (!itemRef.current || !isMounted) return;

    const itemEl = itemRef.current;
    const posterEl = posterRef.current;
    const glintEl = glintOverlayRef.current;

    const handleMouseEnter = () => {
      const currentIsActive = itemRef.current?.closest('.swiper-slide-active') !== null || isActive;
      if (hoverFloatTlRef.current) hoverFloatTlRef.current.kill();
      hoverFloatTlRef.current = gsap.timeline({ repeat: -1, yoyo: true })
        .to(itemEl, { y: currentIsActive ? "-=3" : "-=4", duration: 1.5, ease: "sine.inOut" });

      gsap.to(posterEl, {
        scale: currentIsActive ? 1.15 : 0.85,
        boxShadow: currentIsActive 
            ? (primaryHSLString ? `0px 18px 40px -2px hsla(${primaryHSLString}, 0.35)`: "0px 18px 40px -2px rgba(139,92,246,0.3)")
            : "0 10px 28px rgba(0,0,0,0.45)",
        duration: 0.3, 
        ease: "power2.out" 
      });
      
      if (glintEl) {
        gsap.set(glintEl, { x: "-120%", opacity: 0.6 });
        gsap.to(glintEl, {
          x: "120%",
          duration: 0.7,
          ease: "power2.inOut",
          onComplete: () => gsap.set(glintEl, { opacity: 0 })
        });
      }
    };

    const handleMouseLeave = () => {
      const currentIsActive = itemRef.current?.closest('.swiper-slide-active') !== null || isActive;
      if (hoverFloatTlRef.current) {
        hoverFloatTlRef.current.kill();
        gsap.to(itemEl, { y: 0, duration: 0.3, ease: "power2.out" });
      }
      gsap.to(posterEl, { 
        scale: currentIsActive ? 1.12 : 0.82,
        boxShadow: currentIsActive 
            ? (primaryHSLString ? `0px 15px 35px -5px hsla(${primaryHSLString}, 0.3)` : "0px 15px 35px -5px rgba(139,92,246,0.25)")
            : "0 8px 24px rgba(0,0,0,0.4)",
        duration: 0.4, 
        ease: "power3.out" 
      });
      if (glintEl) gsap.set(glintEl, { opacity: 0 });
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
  }, [isActive, isMounted, primaryHSLString, accentHSLString]); // Added accentHSLString

  const placeholderCover = `https://placehold.co/180x270.png`;

  return (
    <div className="netflix-carousel-item-wrapper" ref={itemRef}>
      <div className="netflix-ranking-number-overlay" ref={numberRef}>
        {/* Initial content can be empty or rank; GSAP will animate it */}
      </div>
      <div className="netflix-show-poster-container" ref={posterRef}>
        <Image
          ref={imageRef}
          src={anime.coverImage || placeholderCover}
          alt={anime.title}
          fill
          sizes="180px"
          className="netflix-show-poster"
          priority={isActive} // Prioritize loading active slide image
          data-ai-hint="anime series poster"
        />
        <div className="netflix-glint-overlay" ref={glintOverlayRef}></div>
        {/* Badges can be added here if needed, absolutely positioned relative to posterRef */}
        {isActive && (
          <div className="absolute top-2 right-2 z-10 flex flex-col gap-1.5">
            {anime.isFeatured && <Badge variant="secondary" className="text-xs bg-yellow-500/90 text-black shadow-md">Featured</Badge>}
            <Badge variant="default" className="text-xs bg-primary/90 text-primary-foreground shadow-md">Top {anime.rank}</Badge>
          </div>
        )}
      </div>
    </div>
  );
};

export default NetflixCarouselItem;
