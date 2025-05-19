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

  const animationDefaults = {
    duration: 0.65, // Slightly increased for smoothness
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

    // Kill ALL tweens on these elements before starting new ones to prevent conflicts
    gsap.killTweensOf([posterEl, numberEl, itemEl, glintOverlayRef.current]);
    if (hoverFloatTlRef.current) {
        hoverFloatTlRef.current.kill();
        hoverFloatTlRef.current = null; // Clear the timeline ref
    }
    // Kill any globally attached repeating animations that might have been started
    gsap.killTweensOf(posterEl, "repeat");
    gsap.killTweensOf(numberEl, "repeat");


    const tl = gsap.timeline({
      defaults: animationDefaults,
      onComplete: () => {
        if (isActive && posterEl && numberEl) { // Check elements again
          // Continuous "breathing" for active card poster
          if (gsap.getTweensOf(posterEl).filter(t => t.vars.repeat === -1).length === 0) { // Avoid duplicate repeating tweens
            gsap.to(posterEl, {
              scale: 1.135, // Slightly more pop than 1.12
              boxShadow: "0px 22px 55px 18px hsla(var(--primary-raw-hsl), 0.50)", // More intense glow
              duration: 1.8, ease: "sine.inOut", repeat: -1, yoyo: true,
            });
          }
          // Neon pulse for active number
           if (gsap.getTweensOf(numberEl).filter(t => t.vars.repeat === -1).length === 0) {
            gsap.to(numberEl, {
              textShadow: `
                0 0 12px hsla(var(--primary-raw-hsl), 0.9),
                0 0 22px hsla(var(--primary-raw-hsl), 0.7),
                0 0 35px hsla(var(--primary-raw-hsl), 0.5),
                1px 1px 0px var(--ranking-number-stroke-color)
              `,
              duration: 1.5, ease: "sine.inOut", repeat: -1, yoyo: true,
            });
          }
        }
      }
    });

    const tiltAngle = isPrev ? -2.0 : (isNext ? 2.0 : 0);

    if (isActive) {
      tl.set(itemEl, { zIndex: 10 }) // Bring active item to front
        .to(posterEl, {
            scale: 1.12,
            y: -15, // Lift the poster
            opacity: 1,
            rotationY: -3, // Subtle 3D tilt
            rotationX: 3,
            rotationZ: 0,
            boxShadow: "0px 20px 50px 15px hsla(var(--primary-raw-hsl), 0.40)", // Themed glow
        }, 0)
        .set(numberEl, { opacity: 0, scale: 0.7, y: 20, x: 0, rotationZ: 0 }, 0); // Initial state for entrance

      // Number Scramble Entrance
      let scrambleCounter = 0;
      tl.to(numberEl, {
        duration: 0.03, // Slightly faster scramble steps
        repeat: 8,    // Fewer repeats for quicker feel
        ease: "none",
        onStart: () => { gsap.set(numberEl, { opacity: 0.85 }); },
        onRepeat: () => {
          let text = "";
          for (let i = 0; i < rankStrLength; i++) text += randomChar();
          if (numberEl) numberEl.textContent = text;
          scrambleCounter++;
        },
        onComplete: () => { if (numberEl) numberEl.textContent = rankStr; }
      }, "<0.1") // Start slightly after poster animation begins
      .to(numberEl, {
        scale: 1.08,
        y: -12, // Number lifted higher on active card
        x: 0,
        opacity: 1,
        ease: "back.out(1.6)", // More dynamic pop
        textShadow: `
            0 0 10px hsla(var(--primary-raw-hsl), 0.8),
            0 0 18px hsla(var(--primary-raw-hsl), 0.6),
            0 0 30px hsla(var(--primary-raw-hsl), 0.4),
            1px 1px 0px var(--ranking-number-stroke-color)
          `,
      }, ">-0.05"); // Overlap slightly with end of scramble

    } else { // INACTIVE STATE
      tl.set(itemEl, { zIndex: isPrev || isNext ? 5 : 1 }) // Side items slightly above others
        .to(posterEl, {
            scale: 0.82,
            y: 0,
            opacity: 0.55, // Less opaque for non-active
            rotationY: 0, // Reset 3D tilt
            rotationX: 0,
            rotationZ: tiltAngle, // Side tilt
            boxShadow: "0 8px 20px hsla(var(--border-raw-hsl), 0.28)", // Muted shadow
        }, 0)
        .to(numberEl, {
            scale: 0.88,
            y: 10, // Number lower on inactive card
            x: 0, // Keep centered horizontally relative to item
            opacity: 0.45, // Less opaque
            rotationZ: tiltAngle / 1.5, // Sync tilt with card
            textShadow: `1px 1px 0px var(--ranking-number-stroke-color)`, // Simpler shadow
            onStart: () => { if (numberEl && numberEl.textContent !== rankStr) numberEl.textContent = rankStr; }
        }, "<0.05");
    }

    return () => {
      tl.kill(); // Kill the main timeline
      // Kill any manually started repeating tweens
      if (posterEl) gsap.killTweensOf(posterEl);
      if (numberEl) gsap.killTweensOf(numberEl);
      if (itemEl) gsap.killTweensOf(itemEl);
      if (glintOverlayRef.current) gsap.killTweensOf(glintOverlayRef.current);
      if (hoverFloatTlRef.current) {
        hoverFloatTlRef.current.kill();
        hoverFloatTlRef.current = null;
      }
    };
  }, [isActive, isPrev, isNext, rankStr, rankStrLength, animationDefaults]);


  // HOVER AND MOUSEMOVE LISTENER SETUP - Runs ONCE
  useEffect(() => {
    const itemElCurrent = itemRef.current;
    const posterElCurrent = posterRef.current;
    const numberElCurrent = numberRef.current;
    const glintOverlayEl = glintOverlayRef.current;

    if (!itemElCurrent || !posterElCurrent || !numberElCurrent || !glintOverlayEl) return;

    let originalBaseY = parseFloat(gsap.getProperty(itemElCurrent, "y") as string) || 0;

    const handleMouseEnter = () => {
      // The `isActive` prop is captured in the closure of this function from the render it was defined in.
      // This is correct because this useEffect runs once, setting up listeners with that initial capture.
      // To get the *current* isActive status if it changes, we'd need to pass isActive as a dependency
      // to this useEffect, but that could lead to re-binding listeners and potentially the max update depth error.
      // For now, this uses the isActive from the initial setup of these listeners.
      // A more robust way might involve a ref updated with isActive or checking class.
      const currentIsActive = itemRef.current?.closest('.swiper-slide-active') !== null || isActive;


      gsap.to(posterElCurrent, {
        scale: currentIsActive ? 1.12 * 1.02 : 0.82 * 1.04, // Relative scale adjustment
        boxShadow: currentIsActive
          ? "0px 25px 60px 20px hsla(var(--primary-raw-hsl), 0.55)"
          : "0 10px 25px hsla(var(--border-raw-hsl), 0.35)",
        duration: 0.25, ease: "power2.out", overwrite: "auto"
      });
       gsap.to(numberElCurrent, {
        scale: currentIsActive ? 1.08 * 1.03 : 0.88 * 1.03, // Relative scale
        textShadow: currentIsActive
          ? `
              0 0 12px hsla(var(--primary-raw-hsl), 0.9),
              0 0 22px hsla(var(--primary-raw-hsl), 0.7),
              0 0 35px hsla(var(--primary-raw-hsl), 0.5),
              1px 1px 0px var(--ranking-number-stroke-color)
            `
          : `
              0 0 5px hsla(var(--accent-raw-hsl), 0.5),
              1px 1px 0px var(--ranking-number-stroke-color)
            `,
        duration: 0.25, ease: "power2.out", overwrite: "auto"
      });

      // Glint effect
      gsap.killTweensOf(glintOverlayEl); // Ensure no previous glint is running
      gsap.set(glintOverlayEl, { x: '-150%', opacity: 0 }); // Reset position and opacity
      gsap.to(glintOverlayEl, {
        x: '150%', // Sweep across
        opacity: 0.7, // Peak opacity of glint
        duration: 0.45, // Speed of sweep
        ease: 'power1.inOut',
        onComplete: () => gsap.to(glintOverlayEl, { opacity: 0, duration: 0.2 }) // Fade out glint
      });

      // Float effect
      if (hoverFloatTlRef.current) hoverFloatTlRef.current.kill();
      originalBaseY = parseFloat(gsap.getProperty(itemElCurrent, "y") as string); // Get current y
      const targetItemYOffset = currentIsActive ? 3 : 2; // Float slightly higher if active
      hoverFloatTlRef.current = gsap.timeline({ repeat: -1, yoyo: true })
        .to(itemElCurrent, { y: originalBaseY - targetItemYOffset, duration: 1.9, ease: "sine.inOut" });
    };

    const handleMouseLeave = () => {
      // Revert hover-specific changes. The main useEffect will handle base active/inactive.
      const currentIsActive = itemRef.current?.closest('.swiper-slide-active') !== null || isActive;

      gsap.to(posterElCurrent, {
        scale: currentIsActive ? 1.12 : 0.82,
        boxShadow: currentIsActive
          ? "0px 20px 50px 15px hsla(var(--primary-raw-hsl), 0.40)"
          : "0 8px 20px hsla(var(--border-raw-hsl), 0.28)",
        // Also revert 3D tilt if it was applied by mousemove on active card
        rotationX: currentIsActive ? 3 : 0,
        rotationY: currentIsActive ? -3 : 0,
        duration: 0.3, ease: "power2.inOut", overwrite: "auto"
      });
      gsap.to(numberElCurrent, {
        scale: currentIsActive ? 1.08 : 0.88,
        textShadow: currentIsActive
          ? `
              0 0 10px hsla(var(--primary-raw-hsl), 0.8),
              0 0 18px hsla(var(--primary-raw-hsl), 0.6),
              0 0 30px hsla(var(--primary-raw-hsl), 0.4),
              1px 1px 0px var(--ranking-number-stroke-color)
            `
          : `1px 1px 0px var(--ranking-number-stroke-color)`,
        duration: 0.3, ease: "power2.inOut", overwrite: "auto"
      });


      if (hoverFloatTlRef.current) {
        hoverFloatTlRef.current.kill();
        hoverFloatTlRef.current = null;
        // Let the main effect restore the y position based on isActive
        const targetY = currentIsActive ? -15 : (isPrev || isNext ? 0 : 0); // Matches main animation targets
        gsap.to(itemElCurrent, { y: targetY, duration: 0.3, ease: "power2.out", overwrite: "auto" });
      }
    };
    
    const handleMouseMoveActiveCard = (event: MouseEvent) => {
        const currentIsActive = itemRef.current?.closest('.swiper-slide-active') !== null || isActive;
      if (!currentIsActive || !itemElCurrent.contains(event.target as Node) || !posterElCurrent) {
        // If not active, or mouse is not over this item, ensure any residual tilt is reset
        if (!currentIsActive && posterElCurrent) { // Added check for posterElCurrent
            gsap.to(posterElCurrent, { rotationX: 0, rotationY: 0, duration: 0.35, ease: "power1.out" });
        }
        return;
      }
      
      const rect = posterElCurrent.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;
      const rotateXVal = 3 + (y / rect.height) * -10; // Keep current rotation for active card
      const rotateYVal = -3 + (x / rect.width) * 8; // Keep current rotation for active card
      gsap.to(posterElCurrent, { rotationX: rotateXVal, rotationY: rotateYVal, duration: 0.35, ease: "power1.out" });
    };

    itemElCurrent.addEventListener('mouseenter', handleMouseEnter);
    itemElCurrent.addEventListener('mouseleave', handleMouseLeave);
    // Changed mousemove to be on itemElCurrent to control scope, checks isActive inside
    itemElCurrent.addEventListener('mousemove', handleMouseMoveActiveCard);


    return () => {
      if (itemElCurrent) {
        itemElCurrent.removeEventListener('mouseenter', handleMouseEnter);
        itemElCurrent.removeEventListener('mouseleave', handleMouseLeave);
        itemElCurrent.removeEventListener('mousemove', handleMouseMoveActiveCard);
      }
      if (hoverFloatTlRef.current) hoverFloatTlRef.current.kill();
      // Kill all tweens on these elements when component unmounts or effect re-runs
      gsap.killTweensOf([itemElCurrent, posterElCurrent, numberElCurrent, glintOverlayEl]);
    };
  }, []); // EMPTY DEPENDENCY ARRAY for listener setup/cleanup

  return (
    <div className="carousel-item-wrapper" ref={itemRef}>
      <div
        className={cn("ranking-number")}
        ref={numberRef}
        style={{ color: 'hsl(var(--accent))' }} // Fallback solid color for text
      >
        {rank}
      </div>
      <Link href={`/anime/${showId}`} passHref legacyBehavior={false} className="show-poster-container-link">
          <div className="show-poster-container" ref={posterRef}>
            <Image
              src={imageUrl || `https://placehold.co/180x270.png`}
              alt={altText}
              fill
              sizes="180px"
              className="show-poster"
              data-ai-hint="anime tvshow poster"
              priority={rank <= 3} // Prioritize loading for first few visible items
            />
            <div className="glint-overlay" ref={glintOverlayRef}></div>
          </div>
      </Link>
    </div>
  );
};
export default CarouselItem;

