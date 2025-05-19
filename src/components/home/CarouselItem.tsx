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

  const animationDefaults = {
    duration: 0.65, // Slightly longer for smoother feel
    ease: "power3.out",
  };

  const rankStr = rank.toString();
  const rankStrLength = rankStr.length;
  const scrambleChars = "!<>-_#?*0123456789";
  const randomChar = () => scrambleChars[Math.floor(Math.random() * scrambleChars.length)];

  // Main animation effect for active/inactive states
  useEffect(() => {
    const itemEl = itemRef.current;
    const posterEl = posterRef.current;
    const numberEl = numberRef.current;

    if (!itemEl || !posterEl || !numberEl || !document.documentElement) return;

    gsap.killTweensOf([posterEl, numberEl, itemEl]);

    const rootStyle = getComputedStyle(document.documentElement);
    const primaryHSLString = rootStyle.getPropertyValue('--primary-raw-hsl').trim();
    // const accentHSLString = rootStyle.getPropertyValue('--accent-raw-hsl').trim(); // For number fill
    // const strokeHSLString = rootStyle.getPropertyValue('--ranking-number-stroke-color-raw-hsl').trim(); // For number stroke

    const tl = gsap.timeline({
      defaults: animationDefaults,
      onComplete: () => {
        if (isActive) {
          // Subtle continuous breathing for active card's poster glow
          gsap.to(posterEl, {
            boxShadow: primaryHSLString ? `0px 28px 70px 22px hsla(${primaryHSLString}, 0.5)` : "0 25px 60px rgba(139,92,246,0.45)",
            scale: 1.13, // Slight scale variation for breathing
            duration: 2.2,
            ease: "sine.inOut",
            repeat: -1,
            yoyo: true,
          });
        }
      }
    });

    const tiltAngle = isPrev ? -2.5 : (isNext ? 2.5 : 0);

    if (isActive) {
      gsap.set(itemEl, { zIndex: 10 });
      tl.to(posterEl, {
        scale: 1.12, y: -15, opacity: 1,
        rotationY: -3, rotationX: 3, rotationZ: 0,
        boxShadow: primaryHSLString ? `0px 25px 65px 18px hsla(${primaryHSLString}, 0.45)` : "0px 20px 50px 15px rgba(139,92,246,0.4)",
      }, 0);

      // Number Entrance: Digital Cascade Reveal
      gsap.set(numberEl, { textContent: rankStr, opacity: 0, scale: 0.7, y: 20, x:0 });
      let scrambleCounter = 0;
      const scrambleDuration = 0.025;
      const scrambleRepeats = Math.max(10, rankStrLength * 3); // More scrambles for longer numbers

      tl.to(numberEl, { // Start of scramble visibility
        opacity: 0.85,
        duration: 0.01,
      }, "<0.05")
      .to(numberEl, { // The scramble itself
        duration: scrambleDuration,
        repeat: scrambleRepeats,
        ease: "none",
        onRepeat: () => {
          let text = "";
          for (let i = 0; i < rankStrLength; i++) text += randomChar();
          if (numberEl) numberEl.textContent = text;
          scrambleCounter++;
        },
        onComplete: () => { if (numberEl) numberEl.textContent = rankStr; }
      }, ">")
      .to(numberEl, { // Pop-in after scramble
        scale: 1.0, y: -12, x: 0, opacity: 1,
        ease: "back.out(1.4)", // More impactful ease
        // color: `hsl(var(--accent))`, // Ensured by CSS
        // webkitTextFillColor: 'transparent', // If using gradient text, otherwise remove
      }, `>${scrambleDuration * (scrambleRepeats -1) }`); // Ensure it starts as scramble finishes

    } else { // INACTIVE STATE
      gsap.set(itemEl, { zIndex: isPrev || isNext ? 5 : 1 });
      gsap.set(numberEl, { textContent: rankStr }); // Ensure correct number shown for inactive
      tl.to(posterEl, {
        scale: 0.82, y: 0, opacity: 0.55,
        rotationY: 0, rotationX: 0, rotationZ: tiltAngle,
        boxShadow: "0 8px 20px hsla(var(--border-raw-hsl, 240 5% 13%), 0.28)",
      }, 0)
      .to(numberEl, {
        scale: 0.88, y: 10, x: 0, opacity: 0.65, // Slightly more visible inactive number
        rotationZ: tiltAngle / 1.5,
        // color: `hsl(var(--accent))`, // Ensured by CSS
      }, "<0.05");
    }
    return () => {
      tl.kill();
      gsap.killTweensOf([posterEl, numberEl, itemEl]);
    };
  }, [isActive, isPrev, isNext, rankStr, rankStrLength, animationDefaults]);


  // HOVER AND MOUSEMOVE LISTENER SETUP
  useEffect(() => {
    const itemElCurrent = itemRef.current;
    const posterElCurrent = posterRef.current;
    const numberElCurrent = numberRef.current;
    const glintOverlayEl = glintOverlayRef.current;

    if (!itemElCurrent || !posterElCurrent || !numberElCurrent || !glintOverlayEl) return;

    let hoverFloatTl: gsap.core.Timeline | null = null;
    let originalBaseY = 0;

    const handleMouseEnter = () => {
      const isCurrentlyActive = itemElCurrent.closest('.swiper-slide-active') !== null || isActive;
      const rootStyle = getComputedStyle(document.documentElement);
      const primaryHSLString = rootStyle.getPropertyValue('--primary-raw-hsl').trim();

      gsap.to(posterElCurrent, {
        scale: isCurrentlyActive ? 1.12 * 1.03 : 0.82 * 1.05, // Slightly different pop based on active state
        boxShadow: isCurrentlyActive
          ? (primaryHSLString ? `0px 28px 75px 25px hsla(${primaryHSLString}, 0.55)` : "0 25px 60px rgba(139,92,246,0.5)")
          : "0 12px 35px hsla(var(--border-raw-hsl, 240 5% 13%), 0.45)",
        duration: 0.3, ease: "power2.out", overwrite: "auto"
      });
      gsap.to(numberElCurrent, {
        scale: isCurrentlyActive ? 1.0 * 1.03 : 0.88 * 1.05,
        duration: 0.3, ease: "power2.out", overwrite: "auto"
      });

      // Glint effect
      gsap.killTweensOf(glintOverlayEl);
      gsap.set(glintOverlayEl, { x: '-150%', opacity: 0 });
      gsap.to(glintOverlayEl, {
        x: '150%', opacity: 0.6, duration: 0.5, ease: 'power1.inOut',
        onComplete: () => gsap.to(glintOverlayEl, { opacity: 0, duration: 0.25 })
      });

      // Float effect
      if (hoverFloatTl) hoverFloatTl.kill();
      originalBaseY = parseFloat(gsap.getProperty(itemElCurrent, "y") as string) || (isCurrentlyActive ? -15 : 0) ;
      const targetItemYOffset = isCurrentlyActive ? 2.5 : 1.5;
      hoverFloatTl = gsap.timeline({ repeat: -1, yoyo: true })
        .to(itemElCurrent, { y: originalBaseY - targetItemYOffset, duration: 2.1, ease: "sine.inOut" });
    };

    const handleMouseLeave = () => {
      const isCurrentlyActive = itemElCurrent.closest('.swiper-slide-active') !== null || isActive;
      const rootStyle = getComputedStyle(document.documentElement);
      const primaryHSLString = rootStyle.getPropertyValue('--primary-raw-hsl').trim();
      
      gsap.to(posterElCurrent, {
        scale: isCurrentlyActive ? 1.12 : 0.82, // Revert to base active/inactive scale
        boxShadow: isCurrentlyActive
          ? (primaryHSLString ? `0px 25px 65px 18px hsla(${primaryHSLString}, 0.45)` : "0px 20px 50px 15px rgba(139,92,246,0.4)")
          : "0 8px 20px hsla(var(--border-raw-hsl, 240 5% 13%), 0.28)",
        rotationX: isCurrentlyActive ? 3 : 0, // Revert 3D tilt if it was only on hover
        rotationY: isCurrentlyActive ? -3 : 0,
        duration: 0.35, ease: "power2.inOut", overwrite: "auto"
      });
      gsap.to(numberElCurrent, {
        scale: isCurrentlyActive ? 1.0 : 0.88, // Revert to base active/inactive scale
        duration: 0.35, ease: "power2.inOut", overwrite: "auto"
      });

      if (hoverFloatTl) {
        hoverFloatTl.kill();
        hoverFloatTl = null;
        const targetY = isCurrentlyActive ? -15 : 0; // Revert to base active/inactive y
        gsap.to(itemElCurrent, { y: targetY, duration: 0.35, ease: "power2.out", overwrite: "auto" });
      }
    };
    
    const handleMouseMoveActiveCard = (event: MouseEvent) => {
        const isCurrentlyActive = itemElCurrent.closest('.swiper-slide-active') !== null || isActive;
        if (!isCurrentlyActive || !itemElCurrent.contains(event.target as Node) || !posterElCurrent) {
           if (!isCurrentlyActive && posterElCurrent) { // Reset non-active card tilt if mouse moves off it
             gsap.to(posterElCurrent, { rotationX: 0, rotationY: 0, duration: 0.4, ease: "power1.out" });
           }
           return;
        }
        
        const rect = posterElCurrent.getBoundingClientRect();
        const x = event.clientX - rect.left - rect.width / 2;
        const y = event.clientY - rect.top - rect.height / 2;

        // More pronounced 3D tilt reacting to mouse
        const rotateXVal = 3 + (y / rect.height) * -12; // Increased multiplier for more tilt
        const rotateYVal = -3 + (x / rect.width) * 10;  // Increased multiplier
        gsap.to(posterElCurrent, { rotationX: rotateXVal, rotationY: rotateYVal, duration: 0.4, ease: "power1.out" });
    };

    itemElCurrent.addEventListener('mouseenter', handleMouseEnter);
    itemElCurrent.addEventListener('mouseleave', handleMouseLeave);
    itemElCurrent.addEventListener('mousemove', handleMouseMoveActiveCard);

    return () => {
      if (itemElCurrent) {
        itemElCurrent.removeEventListener('mouseenter', handleMouseEnter);
        itemElCurrent.removeEventListener('mouseleave', handleMouseLeave);
        itemElCurrent.removeEventListener('mousemove', handleMouseMoveActiveCard);
      }
      if (hoverFloatTl) hoverFloatTl.kill();
      gsap.killTweensOf([itemElCurrent, posterElCurrent, numberElCurrent, glintOverlayEl]);
    };
  }, [isActive, isPrev, isNext, animationDefaults]); // Ensure dependencies are correct for listener setup logic


  return (
    <div className="carousel-item-wrapper" ref={itemRef}>
      <div
        className={cn("ranking-number")} // Styled by globals.css for font, color, stroke
        ref={numberRef}
      >
        {rank}
      </div>
      <Link href={`/anime/${showId}`} passHref legacyBehavior={false} className="show-poster-container-link">
          <div className="show-poster-container" ref={posterRef}>
            <Image
              src={imageUrl || `https://placehold.co/180x270.png`}
              alt={altText}
              fill
              sizes="180px" // Fixed size for these cards
              className="show-poster"
              data-ai-hint="anime tvshow poster"
              priority={rank <= 3} // Prioritize loading images for initially visible or important items
            />
            <div className="glint-overlay" ref={glintOverlayRef}></div>
          </div>
      </Link>
    </div>
  );
};
export default CarouselItem;