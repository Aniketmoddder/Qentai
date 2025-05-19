// src/components/home/NetflixCarouselItem.tsx
'use client';

import React, { useRef, useEffect, useLayoutEffect, useState } from 'react';
import Image from 'next/image';
import { gsap } from 'gsap';
import { TextPlugin } from 'gsap/TextPlugin';
import type { Anime } from '@/types/anime';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge'; // For category badges

gsap.registerPlugin(TextPlugin);

interface NetflixCarouselItemProps {
  anime: Anime & { rank: number }; // Add rank directly to anime object for convenience
  isActive: boolean;
  isPrev: boolean;
  isNext: boolean;
}

const NetflixCarouselItem: React.FC<NetflixCarouselItemProps> = ({ anime, isActive, isPrev, isNext }) => {
  const itemRef = useRef<HTMLDivElement>(null);
  const posterRef = useRef<HTMLDivElement>(null);
  const numberRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null); // For image yoyo on hover
  const shimmerRef = useRef<HTMLDivElement>(null); // For shimmer effect

  const [isMounted, setIsMounted] = useState(false);
  const [primaryColorVar, setPrimaryColorVar] = useState('262 89% 66%'); // Default HSL

  useEffect(() => {
    setIsMounted(true);
    // Fetch theme color once mounted
    if (typeof window !== 'undefined') {
        const computedColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-raw-hsl').trim();
        if (computedColor) {
            setPrimaryColorVar(computedColor);
        }
    }
  }, []);

  useLayoutEffect(() => {
    if (!itemRef.current || !posterRef.current || !numberRef.current || !imageRef.current || !shimmerRef.current || !isMounted) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { duration: 0.6, ease: "power3.out" },
      });

      // --- Active State Animations ---
      if (isActive) {
        // Card Animation
        tl.to(posterRef.current, {
          scale: 1.1,
          opacity: 1,
          rotationY: -5, // Subtle 3D tilt
          boxShadow: `0 12px 30px hsla(${primaryColorVar}, 0.25), 0 0 15px hsla(${primaryColorVar}, 0.15)`,
          zIndex: 10,
        }, 0);

        // Number Entrance & Active State
        gsap.set(numberRef.current, { opacity: 0, scale: 0.5, y: 30, filter: 'blur(5px)' });
        tl.to(numberRef.current, {
          duration: 0.8,
          textContent: anime.rank.toString(),
          roundProps: "textContent", // For whole number counting
          ease: "power2.inOut",
          delay: 0.1, // Slight delay after card starts animating
        }, "<0.1")
        .to(numberRef.current, {
          opacity: 0.9,
          scale: 1,
          y: 0,
          filter: 'blur(0px)',
          ease: "back.out(1.2)",
        }, "-=0.5");
        
        // Continuous Number Glow (Loop)
        gsap.to(numberRef.current, {
            color: `hsla(${primaryColorVar}, 0.7)`,
            textShadow: `0 0 8px hsla(${primaryColorVar}, 0.5), 0 0 16px hsla(${primaryColorVar}, 0.3)`,
            duration: 1.5,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
            delay: 1 // Start glow after initial animations
        });

      } else { // --- Inactive State Animations ---
        // Card Animation
        tl.to(posterRef.current, {
          scale: 0.9,
          opacity: 0.6,
          rotationY: isPrev ? 10 : (isNext ? -10 : 0), // Tilt based on position
          boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
          zIndex: 1,
        }, 0);

        // Number Animation
        tl.to(numberRef.current, {
          opacity: 0,
          scale: 0.8,
          y: 20,
          filter: 'blur(3px)',
          textContent: anime.rank.toString(), // Keep current number but fade out
        }, "<0.1");
        gsap.killTweensOf(numberRef.current, "color,textShadow"); // Stop active glow
        gsap.set(numberRef.current, {color: 'transparent'}); // Re-ensure base style if needed

      }
    }, itemRef); // Scope animations to this component instance

    return () => ctx.revert(); // Cleanup GSAP animations on unmount

  }, [isActive, isPrev, isNext, anime.rank, isMounted, primaryColorVar]);


  // Hover Animations (apply to the main itemRef for easier event handling)
  useEffect(() => {
    if (!itemRef.current || !posterRef.current || !imageRef.current || !shimmerRef.current || !isMounted) return;

    const itemEl = itemRef.current;
    const posterEl = posterRef.current;
    const imageEl = imageRef.current;
    const shimmerEl = shimmerRef.current;

    let hoverTimeline: gsap.core.Timeline | null = null;

    const handleMouseEnter = () => {
        gsap.killTweensOf([posterEl, imageEl, shimmerEl]); // Kill any ongoing tweens on these elements

        hoverTimeline = gsap.timeline();

        // Card Float & Scale
        hoverTimeline.to(posterEl, {
            y: isActive ? -7 : -4, // Less float if already active & lifted
            scale: isActive ? 1.12 : 0.92, // Slight extra scale
            duration: 0.4,
            ease: "power2.out",
        }, 0);

        // Image yoyo zoom
        hoverTimeline.to(imageEl, {
            scale: 1.05,
            duration: 1,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut"
        }, 0);

        // Shimmer effect
        gsap.set(shimmerEl, { left: '-150%', opacity: 0 });
        hoverTimeline.to(shimmerEl, {
            left: '150%',
            opacity: 1,
            duration: 0.7,
            ease: "power2.inOut",
            onComplete: () => gsap.set(shimmerEl, { opacity: 0 }) // Hide after sweep
        }, 0.1);
    };

    const handleMouseLeave = () => {
        if (hoverTimeline) {
            hoverTimeline.kill(); // Stop all animations in the hover timeline
            hoverTimeline = null;
        }
        // Animate back to the current active/inactive state values
        // This requires knowing what the current target values are from the main useLayoutEffect
        // For simplicity, we can rely on the main useLayoutEffect to re-apply the correct base state
        // when isActive/isPrev/isNext changes, or explicitly tween back.
        
        // Explicitly tween back to base state for poster and image
        gsap.to(posterEl, {
            y: isActive ? -15 : 0, // Re-apply based on active status from props
            scale: isActive ? 1.1 : 0.9,
            duration: 0.5,
            ease: "power3.out",
        });
        gsap.to(imageEl, {
            scale: 1,
            duration: 0.5,
            ease: "power3.out"
        });
        gsap.set(shimmerEl, { opacity: 0, left: '-150%' });
    };

    itemEl.addEventListener('mouseenter', handleMouseEnter);
    itemEl.addEventListener('mouseleave', handleMouseLeave);

    return () => {
        itemEl.removeEventListener('mouseenter', handleMouseEnter);
        itemEl.removeEventListener('mouseleave', handleMouseLeave);
        if (hoverTimeline) {
            hoverTimeline.kill();
        }
        gsap.killTweensOf([posterEl, imageEl, shimmerEl, numberRef.current]); // Kill all tweens on cleanup
    };
  }, [isActive, isMounted, primaryColorVar]); // Re-run if isActive changes to adjust hover targets


  const placeholderCover = `https://placehold.co/180x270.png?text=${anime.title.split(' ')[0]}`;

  return (
    <div ref={itemRef} className="netflix-carousel-item">
      {/* Ranking Number Overlay - only shown and animated for active card */}
      <div ref={numberRef} className="netflix-ranking-number-overlay">
        {/* Content set by GSAP TextPlugin */}
      </div>

      <div ref={posterRef} className="netflix-item-poster-container">
        <Image
          ref={imageRef}
          src={anime.coverImage || placeholderCover}
          alt={anime.title}
          fill
          sizes="180px"
          className="netflix-item-poster-img"
          priority={isActive} // Prioritize loading active image
          data-ai-hint="anime series poster"
        />
        {/* Gradient overlay on hover (applied via CSS on .netflix-item-poster-container:hover::before) */}
        {/* Shimmer effect overlay */}
        <div ref={shimmerRef} className="netflix-item-shimmer-overlay"></div>

        {/* Placeholder for Category Badges */}
        {isActive && (
          <div className="absolute top-2 right-2 z-10 flex flex-col gap-1">
            {anime.isFeatured && <Badge variant="secondary" className="text-xs bg-yellow-500/80 text-black">Featured</Badge>}
            {/* Add more badges like "Top 10", "New" based on data */}
            <Badge variant="default" className="text-xs">Top {anime.rank}</Badge>
          </div>
        )}
      </div>
    </div>
  );
};

export default NetflixCarouselItem;