
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
    duration: 0.65,
    ease: "power3.out",
  };

  const rankStr = rank.toString();
  const scrambleChars = "!<>-_#?*0123456789";
  const randomChar = () => scrambleChars[Math.floor(Math.random() * scrambleChars.length)];

  // Main animation based on active/prev/next state
  useEffect(() => {
    const itemEl = itemRef.current;
    const posterEl = posterRef.current;
    const numberEl = numberRef.current;

    if (!itemEl || !posterEl || !numberEl || !document.documentElement) return;

    gsap.killTweensOf([posterEl, numberEl, itemEl]);
    if (activeNumberPulseTlRef.current) {
      activeNumberPulseTlRef.current.kill();
      activeNumberPulseTlRef.current = null;
    }

    const rootStyle = getComputedStyle(document.documentElement);
    const primaryHSLString = rootStyle.getPropertyValue('--primary-raw-hsl').trim();
    // const accentHSLString = rootStyle.getPropertyValue('--accent-raw-hsl').trim(); // Not used if pulse is removed
    // const rankingStrokeHSLString = rootStyle.getPropertyValue('--ranking-number-stroke-color-raw-hsl').trim(); // Static CSS for stroke

    const tl = gsap.timeline({
      defaults: animationDefaults,
      onComplete: () => {
        if (isActive) {
          // Continuous "breathing" glow for active card's poster
          if (gsap.getTweensOf(posterEl).filter(t => t.vars.repeat === -1).length === 0) {
            gsap.to(posterEl, {
              boxShadow: primaryHSLString ? `0px 25px 65px 22px hsla(${primaryHSLString}, 0.45)` : "0 20px 40px rgba(139,92,246,0.45)",
              scale: 1.135,
              duration: 1.9,
              ease: "sine.inOut",
              repeat: -1,
              yoyo: true,
            });
          }
          // Text shadow pulse removed for stability, number will use static CSS shadow.
        }
      }
    });

    const tiltAngle = isPrev ? -2.0 : (isNext ? 2.0 : 0);

    if (isActive) {
      gsap.set(numberEl, { textContent: rankStr, opacity: 0, scale: 0.7, y: 20, x: 0, rotationZ: 0 });
      tl.set(itemEl, { zIndex: 10 })
        .to(posterEl, {
          scale: 1.12, y: -15, opacity: 1,
          rotationY: -3, rotationX: 3, rotationZ: 0,
          boxShadow: primaryHSLString ? `0px 22px 55px 18px hsla(${primaryHSLString}, 0.50)` : "0px 20px 50px 15px rgba(139,92,246,0.4)",
        }, 0);
      
      // Digital Cascade Reveal for number
      let scrambleCounter = 0;
      const scrambleDuration = 0.03;
      const scrambleRepeats = 8;

      tl.to(numberEl, { // Start of scramble
        opacity: 0.85, // Make it visible for scramble
        duration: 0.01, // Almost instant
      }, "<0.05")
      .to(numberEl, { // The scramble itself
        duration: scrambleDuration,
        repeat: scrambleRepeats,
        ease: "none",
        onRepeat: () => {
          let text = "";
          for (let i = 0; i < rankStr.length; i++) text += randomChar();
          if (numberEl) numberEl.textContent = text;
          scrambleCounter++;
        },
        onComplete: () => { if (numberEl) numberEl.textContent = rankStr; }
      }, ">") // After opacity set
      .to(numberEl, { // Pop-in after scramble
        scale: 1.08, y: -12, x: 0, opacity: 1,
        ease: "back.out(1.6)",
      }, `>${scrambleDuration * scrambleRepeats - 0.1}`);

    } else { // INACTIVE STATE
      gsap.set(numberEl, { textContent: rankStr }); // Ensure correct number shown
      tl.set(itemEl, { zIndex: isPrev || isNext ? 5 : 1 })
        .to(posterEl, {
          scale: 0.82, y: 0, opacity: 0.55,
          rotationY: 0, rotationX: 0, rotationZ: tiltAngle,
          boxShadow: "0 8px 20px hsla(var(--border-raw-hsl, 240 5% 13%), 0.28)",
        }, 0)
        .to(numberEl, {
          scale: 0.88, y: 10, x: 0, opacity: 0.45, rotationZ: tiltAngle / 1.5,
        }, "<0.05");
    }

    return () => {
      tl.kill();
      gsap.killTweensOf([posterEl, numberEl, itemEl]);
      if (activeNumberPulseTlRef.current) {
        activeNumberPulseTlRef.current.kill();
        activeNumberPulseTlRef.current = null;
      }
    };
  }, [isActive, isPrev, isNext, rankStr, animationDefaults]); // rankStr.length removed, scrambleChars, randomChar are stable

  // HOVER AND MOUSEMOVE LISTENER SETUP
  useEffect(() => {
    const itemElCurrent = itemRef.current;
    const posterElCurrent = posterRef.current;
    const numberElCurrent = numberRef.current;
    const glintOverlayEl = glintOverlayRef.current;

    if (!itemElCurrent || !posterElCurrent || !numberElCurrent || !glintOverlayEl) return;

    let originalBaseY = 0;
    let isCurrentlyActiveForHover = false; 

    const updateHoverActiveState = () => {
      isCurrentlyActiveForHover = itemElCurrent.closest('.swiper-slide-active') !== null || isActive;
    }

    const handleMouseEnter = () => {
      updateHoverActiveState();
      const rootStyle = getComputedStyle(document.documentElement);
      const primaryHSLString = rootStyle.getPropertyValue('--primary-raw-hsl').trim();
      
      gsap.to(posterElCurrent, {
        scale: isCurrentlyActiveForHover ? 1.12 * 1.02 : 0.82 * 1.04,
        boxShadow: isCurrentlyActiveForHover
          ? (primaryHSLString ? `0px 28px 70px 25px hsla(${primaryHSLString}, 0.50)` : "0 25px 50px rgba(139,92,246,0.5)")
          : "0 12px 30px hsla(var(--border-raw-hsl, 240 5% 13%), 0.40)",
        duration: 0.25, ease: "power2.out", overwrite: "auto"
      });
      gsap.to(numberElCurrent, {
        scale: isCurrentlyActiveForHover ? 1.08 * 1.03 : 0.88 * 1.03,
        duration: 0.25, ease: "power2.out", overwrite: "auto"
      });

      gsap.killTweensOf(glintOverlayEl);
      gsap.set(glintOverlayEl, { x: '-150%', opacity: 0 });
      gsap.to(glintOverlayEl, {
        x: '150%', opacity: 0.7, duration: 0.45, ease: 'power1.inOut',
        onComplete: () => gsap.to(glintOverlayEl, { opacity: 0, duration: 0.2 })
      });

      if (hoverFloatTlRef.current) hoverFloatTlRef.current.kill();
      originalBaseY = parseFloat(gsap.getProperty(itemElCurrent, "y") as string) || (isCurrentlyActiveForHover ? -15 : 0) ;
      const targetItemYOffset = isCurrentlyActiveForHover ? 3 : 2;
      hoverFloatTlRef.current = gsap.timeline({ repeat: -1, yoyo: true })
        .to(itemElCurrent, { y: originalBaseY - targetItemYOffset, duration: 1.9, ease: "sine.inOut" });
    };

    const handleMouseLeave = () => {
      updateHoverActiveState();
      const rootStyle = getComputedStyle(document.documentElement);
      const primaryHSLString = rootStyle.getPropertyValue('--primary-raw-hsl').trim();
      
      gsap.to(posterElCurrent, {
        scale: isCurrentlyActiveForHover ? 1.12 : 0.82,
        boxShadow: isCurrentlyActiveForHover
          ? (primaryHSLString ? `0px 22px 55px 18px hsla(${primaryHSLString}, 0.50)` : "0px 20px 50px 15px rgba(139,92,246,0.4)")
          : "0 8px 20px hsla(var(--border-raw-hsl, 240 5% 13%), 0.28)",
        rotationX: isCurrentlyActiveForHover ? 3 : 0,
        rotationY: isCurrentlyActiveForHover ? -3 : 0,
        duration: 0.3, ease: "power2.inOut", overwrite: "auto"
      });
      gsap.to(numberElCurrent, {
        scale: isCurrentlyActiveForHover ? 1.08 : 0.88,
        duration: 0.3, ease: "power2.inOut", overwrite: "auto"
      });

      if (hoverFloatTlRef.current) {
        hoverFloatTlRef.current.kill();
        hoverFloatTlRef.current = null;
        const targetY = isCurrentlyActiveForHover ? -15 : 0;
        gsap.to(itemElCurrent, { y: targetY, duration: 0.3, ease: "power2.out", overwrite: "auto" });
      }
    };
    
    const handleMouseMoveActiveCard = (event: MouseEvent) => {
        updateHoverActiveState();
        if (!isCurrentlyActiveForHover || !itemElCurrent.contains(event.target as Node) || !posterElCurrent) {
          if (!isCurrentlyActiveForHover && posterElCurrent) { 
             gsap.to(posterElCurrent, { rotationX: 0, rotationY: 0, duration: 0.35, ease: "power1.out" });
          }
          return;
        }
        
        const rect = posterElCurrent.getBoundingClientRect();
        const x = event.clientX - rect.left - rect.width / 2;
        const y = event.clientY - rect.top - rect.height / 2;

        const rotateXVal = 3 + (y / rect.height) * -10; 
        const rotateYVal = -3 + (x / rect.width) * 8;  
        gsap.to(posterElCurrent, { rotationX: rotateXVal, rotationY: rotateYVal, duration: 0.35, ease: "power1.out" });
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
      if (hoverFloatTlRef.current) hoverFloatTlRef.current.kill();
      gsap.killTweensOf([itemElCurrent, posterElCurrent, numberElCurrent, glintOverlayEl]);
    };
  }, [isActive, isPrev, isNext, animationDefaults]); // Main animation effect dependency on isActive, etc.

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
              src={imageUrl || `https://placehold.co/180x270.png`}
              alt={altText}
              fill
              sizes="180px"
              className="show-poster"
              data-ai-hint="anime tvshow poster"
              priority={rank <= 3}
            />
            <div className="glint-overlay" ref={glintOverlayRef}></div>
          </div>
      </Link>
    </div>
  );
};
export default CarouselItem;

