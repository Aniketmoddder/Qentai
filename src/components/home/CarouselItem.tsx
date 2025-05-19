
// src/components/home/CarouselItem.tsx
'use client';

import React, { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface CarouselItemProps {
  rank: number;
  imageUrl: string;
  altText: string;
  isActive: boolean;
  isPrev: boolean;
  isNext: boolean;
  showId: string;
}

const CarouselItem: React.FC<CarouselItemProps> = ({ rank, imageUrl, altText, isActive, isPrev, isNext, showId }) => {
  const itemRef = useRef<HTMLDivElement>(null);
  const posterRef = useRef<HTMLDivElement>(null);
  const numberRef = useRef<HTMLDivElement>(null);
  const glintOverlayRef = useRef<HTMLDivElement>(null);
  const hoverFloatTlRef = useRef<gsap.core.Timeline | null>(null);
  const activeNumberPulseTlRef = useRef<gsap.core.Timeline | null>(null);

  const animationDefaults = {
    duration: 0.65, // Slightly longer for smoother feel
    ease: "power3.out",
  };

  const scrambleChars = "!<>-_#?*0123456789";
  const randomChar = () => scrambleChars[Math.floor(Math.random() * scrambleChars.length)];
  const rankStr = rank.toString();
  const rankStrLength = rankStr.length;

  // Main animation based on active/prev/next state
  useEffect(() => {
    const posterEl = posterRef.current;
    const numberEl = numberRef.current;
    const itemEl = itemRef.current;

    if (!posterEl || !numberEl || !itemEl) return;

    gsap.killTweensOf([posterEl, numberEl, itemEl]);
    if (hoverFloatTlRef.current) {
      hoverFloatTlRef.current.kill();
      hoverFloatTlRef.current = null;
    }
    if (activeNumberPulseTlRef.current) {
      activeNumberPulseTlRef.current.kill();
      activeNumberPulseTlRef.current = null;
    }

    const tl = gsap.timeline({
      defaults: animationDefaults,
      onComplete: () => {
        if (isActive && posterEl && numberEl) {
          // Continuous "breathing" glow for active card's poster
          if (gsap.getTweensOf(posterEl).filter(t => t.vars.repeat === -1).length === 0) {
            const primaryHSL = getComputedStyle(document.documentElement).getPropertyValue('--primary-raw-hsl').trim() || '262 89% 66%'; // Fallback HSL
            gsap.to(posterEl, {
              boxShadow: `0px 25px 65px 22px hsla(${primaryHSL}, 0.45)`, // Slightly more intense glow
              scale: 1.135, // Active scale pop
              duration: 1.9,
              ease: "sine.inOut",
              repeat: -1,
              yoyo: true,
            });
          }
          // Continuous "neon pulse" for active number's text shadow
          if (gsap.getTweensOf(numberEl).filter(t => t.vars.repeat === -1).length === 0) {
            activeNumberPulseTlRef.current = gsap.timeline({ repeat: -1, yoyo: true })
              .to(numberEl, {
                textShadow: `
                  0 0 5px hsla(var(--primary-raw-hsl, 260 100% 70%), 0.9),
                  0 0 10px hsla(var(--primary-raw-hsl, 260 100% 70%), 0.7),
                  0 0 15px hsla(var(--primary-raw-hsl, 260 100% 70%), 0.5),
                  0 0 20px hsla(var(--primary-raw-hsl, 260 100% 70%), 0.3)
                `,
                duration: 1.3,
                ease: "sine.inOut"
              })
              .to(numberEl, { // Return to a base active glow
                textShadow: `
                  0 0 3px hsla(var(--primary-raw-hsl, 260 100% 70%), 0.7),
                  0 0 6px hsla(var(--primary-raw-hsl, 260 100% 70%), 0.5)
                `,
                duration: 1.3,
                ease: "sine.inOut"
              }, ">");
          }
        }
      }
    });

    const tiltAngle = isPrev ? -2.0 : (isNext ? 2.0 : 0); // Reduced tilt

    if (isActive) {
      tl.set(itemEl, { zIndex: 10 })
        .to(posterEl, {
          scale: 1.12, y: -15, opacity: 1,
          rotationY: -3, rotationX: 3, rotationZ: 0, // 3D Perspective Tilt
          boxShadow: `0px 22px 55px 18px hsla(var(--primary-raw-hsl, 260 100% 70%), 0.35)`, // Themed Glow
        }, 0)
        .set(numberEl, { opacity: 0, scale: 0.7, y: 20, x: 0, rotationZ: 0, color: 'hsl(var(--accent))', webkitTextFillColor: 'hsl(var(--accent))'  }, 0);

      // Digital Cascade Reveal for number
      let scrambleCounter = 0;
      const scrambleDuration = 0.03;
      const scrambleRepeats = 8;

      tl.to(numberEl, {
        duration: scrambleDuration,
        repeat: scrambleRepeats,
        ease: "none",
        onStart: () => { gsap.set(numberEl, { opacity: 0.85 }); },
        onRepeat: () => {
          let text = "";
          for (let i = 0; i < rankStrLength; i++) text += randomChar();
          if (numberEl) numberEl.textContent = text;
          scrambleCounter++;
        },
        onComplete: () => { if (numberEl) numberEl.textContent = rankStr; }
      }, "<0.05") // Start scramble slightly after poster starts moving
      .to(numberEl, {
        scale: 1.08, y: -12, x: 0, opacity: 1, // Pop-in effect, ensure y is adjusted
        ease: "back.out(1.6)",
        textShadow: `1px 1px 0px var(--ranking-number-stroke-color)`, // Initial active shadow
        color: 'hsl(var(--accent))',
        webkitTextFillColor: 'hsl(var(--accent))'
      }, `>${scrambleDuration * scrambleRepeats - 0.1}`); // Ensure pop-in happens right after scramble completes

    } else { // INACTIVE STATE
      tl.set(itemEl, { zIndex: isPrev || isNext ? 5 : 1 })
        .to(posterEl, {
          scale: 0.82, y: 0, opacity: 0.55,
          rotationY: 0, rotationX: 0, rotationZ: tiltAngle,
          boxShadow: "0 8px 20px hsla(var(--border-raw-hsl, 240 5% 13%), 0.28)", // Default shadow for inactive
        }, 0)
        .to(numberEl, {
          scale: 0.88, y: 10, x: 0, opacity: 0.45, rotationZ: tiltAngle / 1.5,
          textShadow: `1px 1px 0px var(--ranking-number-stroke-color)`, // Simpler shadow for inactive
          color: 'hsl(var(--accent))',
          webkitTextFillColor: 'hsl(var(--accent))',
          onStart: () => { if (numberEl && numberEl.textContent !== rankStr) numberEl.textContent = rankStr; }
        }, "<0.05");
    }

    return () => {
      tl.kill();
      if (posterEl) gsap.killTweensOf(posterEl);
      if (numberEl) gsap.killTweensOf(numberEl);
      if (itemEl) gsap.killTweensOf(itemEl);
      if (glintOverlayRef.current) gsap.killTweensOf(glintOverlayRef.current);
      if (hoverFloatTlRef.current) {
        hoverFloatTlRef.current.kill();
        hoverFloatTlRef.current = null;
      }
      if (activeNumberPulseTlRef.current) {
        activeNumberPulseTlRef.current.kill();
        activeNumberPulseTlRef.current = null;
      }
    };
  }, [isActive, isPrev, isNext, rankStr, rankStrLength, animationDefaults]); // Added dependencies

  // HOVER AND MOUSEMOVE LISTENER SETUP
  useEffect(() => {
    const itemElCurrent = itemRef.current;
    const posterElCurrent = posterRef.current;
    const numberElCurrent = numberRef.current;
    const glintOverlayEl = glintOverlayRef.current;

    if (!itemElCurrent || !posterElCurrent || !numberElCurrent || !glintOverlayEl) return;

    let originalBaseY = 0;

    const handleMouseEnter = () => {
      const currentIsActive = itemElCurrent.classList.contains('swiper-slide-active') || isActive; // Check both ways
      const primaryHSL = getComputedStyle(document.documentElement).getPropertyValue('--primary-raw-hsl').trim() || '262 89% 66%';
      
      gsap.to(posterElCurrent, {
        scale: currentIsActive ? 1.12 * 1.02 : 0.82 * 1.04, // Subtle scale pop on hover
        boxShadow: currentIsActive
          ? `0px 25px 60px 20px hsla(${primaryHSL}, 0.45)`
          : "0 10px 25px hsla(var(--border-raw-hsl, 240 5% 13%), 0.35)",
        duration: 0.25, ease: "power2.out", overwrite: "auto"
      });
      gsap.to(numberElCurrent, {
        scale: currentIsActive ? 1.08 * 1.03 : 0.88 * 1.03,
        duration: 0.25, ease: "power2.out", overwrite: "auto"
      });

      // Glint Effect
      gsap.killTweensOf(glintOverlayEl);
      gsap.set(glintOverlayEl, { x: '-150%', opacity: 0 }); // Start off-screen
      gsap.to(glintOverlayEl, {
        x: '150%', // Sweep across
        opacity: 0.7, // Make it visible
        duration: 0.45,
        ease: 'power1.inOut',
        onComplete: () => gsap.to(glintOverlayEl, { opacity: 0, duration: 0.2 }) // Fade out
      });

      // Continuous Float on Item Hover
      if (hoverFloatTlRef.current) hoverFloatTlRef.current.kill();
      originalBaseY = parseFloat(gsap.getProperty(itemElCurrent, "y") as string) || (currentIsActive ? -15 : 0) ;
      const targetItemYOffset = currentIsActive ? 3 : 2; // Smaller float for active items
      hoverFloatTlRef.current = gsap.timeline({ repeat: -1, yoyo: true })
        .to(itemElCurrent, { y: originalBaseY - targetItemYOffset, duration: 1.9, ease: "sine.inOut" });
    };

    const handleMouseLeave = () => {
      const currentIsActive = itemElCurrent.classList.contains('swiper-slide-active') || isActive;
      const primaryHSL = getComputedStyle(document.documentElement).getPropertyValue('--primary-raw-hsl').trim() || '262 89% 66%';

      gsap.to(posterElCurrent, {
        scale: currentIsActive ? 1.12 : 0.82, // Revert to base active/inactive scale
        boxShadow: currentIsActive
          ? `0px 22px 55px 18px hsla(${primaryHSL}, 0.35)`
          : "0 8px 20px hsla(var(--border-raw-hsl, 240 5% 13%), 0.28)",
        rotationX: currentIsActive ? 3 : 0, // Revert 3D tilt if it was modified by mousemove
        rotationY: currentIsActive ? -3 : 0,
        duration: 0.3, ease: "power2.inOut", overwrite: "auto"
      });
      gsap.to(numberElCurrent, {
        scale: currentIsActive ? 1.08 : 0.88, // Revert to base active/inactive scale
        duration: 0.3, ease: "power2.inOut", overwrite: "auto"
      });

      if (hoverFloatTlRef.current) {
        hoverFloatTlRef.current.kill();
        hoverFloatTlRef.current = null;
        // Revert item to its base Y position
        const targetY = currentIsActive ? -15 : 0; // Base Y for active/inactive
        gsap.to(itemElCurrent, { y: targetY, duration: 0.3, ease: "power2.out", overwrite: "auto" });
      }
    };
    
    // Dynamic 3D Tilt on Active Card Hover
    const handleMouseMoveActiveCard = (event: MouseEvent) => {
        const currentIsActive = itemElCurrent.classList.contains('swiper-slide-active') || isActive;
        if (!currentIsActive || !itemElCurrent.contains(event.target as Node) || !posterElCurrent) {
          // If not active or mouse is not over the card, reset any dynamic tilt
          if (!currentIsActive && posterElCurrent) { // Ensure poster exists
             gsap.to(posterElCurrent, { rotationX: 0, rotationY: 0, duration: 0.35, ease: "power1.out" });
          }
          return;
        }
        
        const rect = posterElCurrent.getBoundingClientRect();
        const x = event.clientX - rect.left - rect.width / 2;
        const y = event.clientY - rect.top - rect.height / 2;

        // More pronounced tilt for active card, base tilt comes from main animation
        const rotateXVal = 3 + (y / rect.height) * -10; // Max additional +/-5 deg
        const rotateYVal = -3 + (x / rect.width) * 8;  // Max additional +/-4 deg
        gsap.to(posterElCurrent, { rotationX: rotateXVal, rotationY: rotateYVal, duration: 0.35, ease: "power1.out" });
    };

    itemElCurrent.addEventListener('mouseenter', handleMouseEnter);
    itemElCurrent.addEventListener('mouseleave', handleMouseLeave);
    itemElCurrent.addEventListener('mousemove', handleMouseMoveActiveCard);

    return () => {
      if (itemElCurrent) { // Check if still mounted
        itemElCurrent.removeEventListener('mouseenter', handleMouseEnter);
        itemElCurrent.removeEventListener('mouseleave', handleMouseLeave);
        itemElCurrent.removeEventListener('mousemove', handleMouseMoveActiveCard);
      }
      if (hoverFloatTlRef.current) hoverFloatTlRef.current.kill();
      gsap.killTweensOf([itemElCurrent, posterElCurrent, numberElCurrent, glintOverlayEl]);
    };
  }, [isActive, isPrev, isNext, animationDefaults]); // Added animationDefaults as it's used in this effect

  return (
    <div className="carousel-item-wrapper" ref={itemRef}>
      <div
        className={cn("ranking-number")}
        ref={numberRef}
      >
        {rank}
      </div>
      <Link href={`/anime/${showId}`} passHref legacyBehavior={false} className="show-poster-container-link">
          <div className="show-poster-container" ref={posterRef}>
            <Image
              src={imageUrl || `https://placehold.co/180x270.png`} // Default placeholder
              alt={altText}
              fill
              sizes="180px" // A common size for these cards
              className="show-poster"
              data-ai-hint="anime tvshow poster"
              priority={rank <= 3} // Prioritize loading for first few items
            />
            <div className="glint-overlay" ref={glintOverlayRef}></div>
          </div>
      </Link>
    </div>
  );
};
export default CarouselItem;
