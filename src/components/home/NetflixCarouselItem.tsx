
'use client';

import React, { useRef, useEffect, useLayoutEffect, useState } from 'react';
import Image from 'next/image';
import { gsap } from 'gsap';
import { TextPlugin } from 'gsap/TextPlugin';
import type { Anime } from '@/types/anime';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

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

  const [isMounted, setIsMounted] = useState(false);
  const [primaryHSL, setPrimaryHSL] = useState<string | null>(null);
  const [accentHSL, setAccentHSL] = useState<string | null>(null);


  const animationDefaults = {
    duration: 0.6, // Slightly increased for smoother feel
    ease: "power3.out",
  };

  const rankStr = anime.rank.toString();
  const rankStrLength = rankStr.length;

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      const computedPrimaryHSL = getComputedStyle(document.documentElement).getPropertyValue('--primary-raw-hsl').trim();
      const computedAccentHSL = getComputedStyle(document.documentElement).getPropertyValue('--accent-raw-hsl').trim();
      if (computedPrimaryHSL) setPrimaryHSL(computedPrimaryHSL);
      if (computedAccentHSL) setAccentHSL(computedAccentHSL);
    }
  }, []);

  // Main Active/Inactive State Animations
  useLayoutEffect(() => {
    if (!itemRef.current || !posterRef.current || !numberRef.current || !imageRef.current || !isMounted ) return;

    const posterEl = posterRef.current;
    const numberEl = numberRef.current;

    gsap.killTweensOf([posterEl, numberEl]);

    const tl = gsap.timeline({ defaults: animationDefaults });

    if (isActive) {
      // Poster Active Animation
      tl.to(posterEl, {
        scale: 1.1,
        y: -10, // Lifted slightly
        opacity: 1,
        rotationY: -3,
        rotationX: 2,
        boxShadow: primaryHSL ? `0 20px 45px -10px hsla(${primaryHSL}, 0.35)` : "0 15px 35px -8px rgba(139,92,246,0.3)",
        zIndex: 10,
      }, 0);

      // Number Entrance: Digital Cascade Reveal
      gsap.set(numberEl, { opacity: 0, scale: 0.7, y: 30, x: 0 });
      let scrambleCounter = 0;
      const scrambleDuration = 0.03;
      const scrambleRepeats = Math.max(10, rankStrLength * 2); // Ensure enough scrambles

      tl.to(numberEl, {
        duration: scrambleDuration * scrambleRepeats,
        onStart: () => { numberEl.style.color = 'hsl(var(--accent))'; }, // Set color via CSS var
        onUpdate: function() {
          scrambleCounter++;
          if (scrambleCounter < scrambleRepeats) {
            let randomText = "";
            for (let i = 0; i < rankStrLength; i++) {
              randomText += Math.random() > 0.5 ? Math.floor(Math.random() * 10) : "!<>-_#?*".charAt(Math.floor(Math.random() * 8));
            }
            numberEl.textContent = randomText;
          } else {
            numberEl.textContent = rankStr; // Final number
          }
        },
        ease: "none"
      }, "<0.1") // Start scramble slightly after card
      .to(numberEl, {
        opacity: 0.9,
        scale: 1,
        y: -30, // Adjusted active Y position
        x: 0,
        ease: "back.out(1.4)",
        textShadow: accentHSL ? `0 0 10px hsla(${accentHSL}, 0.6), 0 0 20px hsla(${accentHSL}, 0.4)` : '0 0 8px rgba(255,255,255,0.5)',
        onComplete: () => {
          // Continuous subtle pulse for active number's glow
          gsap.to(numberEl, {
            textShadow: accentHSL ? `0 0 15px hsla(${accentHSL}, 0.75), 0 0 30px hsla(${accentHSL}, 0.55)` : '0 0 12px rgba(255,255,255,0.7)',
            duration: 1.5,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut"
          });
        }
      }, `-=${scrambleDuration * scrambleRepeats * 0.3}`); // Overlap pop-in with end of scramble

    } else { // Inactive State
      const tiltAngle = isPrev ? 2.0 : (isNext ? -2.0 : 0);
      // Poster Inactive
      tl.to(posterEl, {
        scale: 0.85,
        y: 0,
        opacity: 0.6,
        rotationY: 0,
        rotationX: 0,
        rotationZ: tiltAngle,
        boxShadow: "0 10px 20px rgba(0,0,0,0.2)",
        zIndex: 1,
      }, 0);

      // Number Inactive
      gsap.killTweensOf(numberEl, "textShadow"); // Stop active pulse
      tl.to(numberEl, {
        opacity: 0,
        scale: 0.8,
        y: 15,
        x: 0, // Keep centered for inactive, tilt is on poster
        textShadow: 'none',
      }, "<0.05");
    }
    return () => {
        gsap.killTweensOf([posterEl, numberEl, itemRef.current, imageRef.current, glintOverlayRef.current]);
        if (hoverFloatTlRef.current) {
            hoverFloatTlRef.current.kill();
            hoverFloatTlRef.current = null;
        }
    }

  }, [isActive, isPrev, isNext, rankStr, rankStrLength, animationDefaults, isMounted, primaryHSL, accentHSL]);


  // Hover Animations
  useEffect(() => {
    if (!itemRef.current || !isMounted) return;

    const itemEl = itemRef.current;
    const posterEl = posterRef.current;
    const imageEl = imageRef.current;
    const numberEl = numberRef.current;
    const glintEl = glintOverlayRef.current;

    const handleMouseEnter = () => {
      if (hoverFloatTlRef.current) hoverFloatTlRef.current.kill();
      hoverFloatTlRef.current = gsap.timeline({ repeat: -1, yoyo: true })
        .to(itemEl, { y: isActive ? "-=2" : "-=3", duration: 1.8, ease: "sine.inOut" });

      gsap.to(posterEl, { scale: isActive ? 1.13 : 0.88, duration: 0.3, ease: "power2.out" });
      gsap.to(imageEl, { scale: 1.03, duration: 0.3, ease: "power2.out" });
      gsap.to(numberEl, { scale: isActive ? 1.03 : 0.91, duration: 0.3, ease: "power2.out" });

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
      if (hoverFloatTlRef.current) {
        hoverFloatTlRef.current.kill();
        gsap.to(itemEl, { y: 0, duration: 0.3, ease: "power2.out" }); // Smoothly return to original y
      }
      gsap.to(posterEl, { scale: isActive ? 1.1 : 0.85, duration: 0.4, ease: "power3.out" });
      gsap.to(imageEl, { scale: 1, duration: 0.4, ease: "power3.out" });
      gsap.to(numberEl, { scale: isActive ? 1 : 0.8, duration: 0.4, ease: "power3.out" });
      if (glintEl) gsap.set(glintEl, { opacity: 0 });
    };

    itemEl.addEventListener('mouseenter', handleMouseEnter);
    itemEl.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      itemEl.removeEventListener('mouseenter', handleMouseEnter);
      itemEl.removeEventListener('mouseleave', handleMouseLeave);
      if (hoverFloatTlRef.current) hoverFloatTlRef.current.kill();
      gsap.killTweensOf([itemEl, posterEl, imageEl, numberEl, glintEl]);
    };
  }, [isActive, isMounted, primaryHSL]);

  const placeholderCover = `https://placehold.co/180x270.png?text=${anime.title.split(' ')[0]}`;

  return (
    <div className="carousel-item-wrapper" ref={itemRef}>
      <div className="ranking-number-overlay" ref={numberRef}>
        {/* Content initially set by CSS, then GSAP TextPlugin */}
        {anime.rank}
      </div>
      <div className="show-poster-container" ref={posterRef}>
        <Image
          ref={imageRef}
          src={anime.coverImage || placeholderCover}
          alt={anime.title}
          fill
          sizes="180px" // Adjust if card size changes significantly
          className="show-poster"
          priority={isActive}
          data-ai-hint="anime series poster"
        />
        <div className="glint-overlay" ref={glintOverlayRef}></div>
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

