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
    duration: 0.65,
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
    const currentStrokeColor = rootStyle.getPropertyValue('--ranking-number-stroke-color').trim() || 'rgba(0,0,0,0.7)';

    const tl = gsap.timeline({
      defaults: animationDefaults,
      onComplete: () => {
        if (isActive) {
          gsap.to(posterEl, {
            scale: 1.13, // Slight scale variation for breathing
            duration: 2.2,
            ease: "sine.inOut",
            repeat: -1,
            yoyo: true,
          });
          // For number active state continuous animation (e.g., text shadow pulse)
           // Temporarily removed complex textShadow pulse to avoid GSAP color parsing issues.
           // A simpler pulse or static styled shadow will be used.
           // For example, if keeping a static but prominent shadow for active:
           // gsap.set(numberEl, { textShadow: `0 0 10px hsla(${primaryHSLString}, 0.7), 0 0 20px hsla(${primaryHSLString}, 0.5)` });
        } else {
            // gsap.set(numberEl, { textShadow: `1px 1px 0px ${currentStrokeColor}` }); // Reset to base shadow
        }
      }
    });

    const tiltAngle = isPrev ? -2.0 : (isNext ? 2.0 : 0); // Reduced tilt

    if (isActive) {
      gsap.set(itemEl, { zIndex: 10 });
      tl.to(posterEl, {
        scale: 1.12, y: -15, opacity: 1,
        rotationY: -3, rotationX: 3, rotationZ: 0,
        boxShadow: primaryHSLString ? `0px 22px 55px 18px hsla(${primaryHSLString}, 0.50)` : "0px 20px 50px 15px rgba(139,92,246,0.4)",
      }, 0);

      // Number Entrance: Digital Cascade Reveal
      gsap.set(numberEl, { opacity: 0, scale: 0.7, y: 20, x:0, color: 'hsl(var(--accent))', webkitTextFillColor: 'hsl(var(--accent))' });
      let scrambleCounter = 0;
      const scrambleDuration = 0.025;
      const scrambleRepeats = Math.max(8, rankStrLength * 2);

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
        scale: 1.08, y: -30, x: 0, opacity: 1, // Increased negative y for active number
        ease: "back.out(1.6)",
        color: 'hsl(var(--accent))',
        webkitTextFillColor: 'hsl(var(--accent))',
        // textShadow: `0 0 8px hsla(${primaryHSLString},0.6), 0 0 15px hsla(${primaryHSLString},0.4), 1px 1px 0px ${currentStrokeColor}` // Example active shadow
      }, `>${scrambleDuration * (scrambleRepeats -1) }`);

    } else { // INACTIVE STATE
      gsap.set(itemEl, { zIndex: isPrev || isNext ? 5 : 1 });
      if (numberEl) numberEl.textContent = rankStr;

      tl.to(posterEl, {
        scale: 0.82, y: 0, opacity: 0.55,
        rotationY: 0, rotationX: 0, rotationZ: tiltAngle,
        boxShadow: "0 8px 20px hsla(var(--border-raw-hsl, 240 5% 13%), 0.28)",
      }, 0)
      .to(numberEl, {
        scale: 0.88, y: 10, x: 0, opacity: 0.65, // Ensure x is 0 or small positive
        rotationZ: tiltAngle / 1.5, // Adjusted tilt for number
        color: 'hsl(var(--accent))',
        webkitTextFillColor: 'hsl(var(--accent))',
        // textShadow: `1px 1px 0px ${currentStrokeColor}` // Base shadow for inactive
      }, "<0.05");
    }
    return () => {
      tl.kill();
      gsap.killTweensOf([posterEl, numberEl, itemEl]);
    };
  }, [isActive, isPrev, isNext, rankStr, rankStrLength, animationDefaults]); // Added rankStr, rankStrLength as they are used in effects


  // HOVER AND MOUSEMOVE LISTENER SETUP
  useEffect(() => {
    const itemElCurrent = itemRef.current;
    const posterElCurrent = posterRef.current;
    const numberElCurrent = numberRef.current;
    const glintOverlayEl = glintOverlayRef.current;

    if (!itemElCurrent || !posterElCurrent || !numberElCurrent || !glintOverlayEl) return;

    let originalBaseY = 0; // Store the original y before float

    const handleMouseEnter = () => {
      const isCurrentlyActive = itemElCurrent.closest('.swiper-slide-active') !== null || isActive; // More reliable check
      const rootStyle = getComputedStyle(document.documentElement);
      const primaryHSLString = rootStyle.getPropertyValue('--primary-raw-hsl').trim();

      gsap.to(posterElCurrent, {
        scale: isCurrentlyActive ? 1.12 * 1.02 : 0.82 * 1.03,
        boxShadow: isCurrentlyActive
          ? (primaryHSLString ? `0px 25px 60px 20px hsla(${primaryHSLString}, 0.55)` : "0 25px 60px rgba(139,92,246,0.5)")
          : "0 10px 30px hsla(var(--border-raw-hsl, 240 5% 13%), 0.40)",
        duration: 0.3, ease: "power2.out", overwrite: "auto"
      });
      gsap.to(numberElCurrent, {
        scale: isCurrentlyActive ? 1.08 * 1.02 : 0.88 * 1.03,
        duration: 0.3, ease: "power2.out", overwrite: "auto"
      });

      // Glint effect
      gsap.killTweensOf(glintOverlayEl);
      gsap.set(glintOverlayEl, { x: '-150%', opacity: 0 });
      gsap.to(glintOverlayEl, {
        x: '150%', opacity: 0.5, duration: 0.45, ease: 'power1.inOut',
        onComplete: () => gsap.to(glintOverlayEl, { opacity: 0, duration: 0.2 })
      });

      // Float effect
      if (hoverFloatTlRef.current) hoverFloatTlRef.current.kill();
      originalBaseY = parseFloat(gsap.getProperty(itemElCurrent, "y") as string) || (isCurrentlyActive ? -15 : 0) ;
      const targetItemYOffset = isCurrentlyActive ? 2.0 : 1.0; // Smaller float
      hoverFloatTlRef.current = gsap.timeline({ repeat: -1, yoyo: true })
        .to(itemElCurrent, { y: originalBaseY - targetItemYOffset, duration: 1.8, ease: "sine.inOut" });
    };

    const handleMouseLeave = () => {
      const isCurrentlyActive = itemElCurrent.closest('.swiper-slide-active') !== null || isActive;
      const rootStyle = getComputedStyle(document.documentElement);
      const primaryHSLString = rootStyle.getPropertyValue('--primary-raw-hsl').trim();
      
      gsap.to(posterElCurrent, {
        scale: isCurrentlyActive ? 1.12 : 0.82,
        boxShadow: isCurrentlyActive
          ? (primaryHSLString ? `0px 22px 55px 18px hsla(${primaryHSLString}, 0.50)` : "0px 20px 50px 15px rgba(139,92,246,0.4)")
          : "0 8px 20px hsla(var(--border-raw-hsl, 240 5% 13%), 0.28)",
        rotationX: isCurrentlyActive ? 3 : 0,
        rotationY: isCurrentlyActive ? -3 : 0,
        duration: 0.35, ease: "power2.inOut", overwrite: "auto"
      });
      gsap.to(numberElCurrent, {
        scale: isCurrentlyActive ? 1.08 : 0.88,
        duration: 0.35, ease: "power2.inOut", overwrite: "auto"
      });

      if (hoverFloatTlRef.current) {
        hoverFloatTlRef.current.kill();
        hoverFloatTlRef.current = null;
        // Revert to base active/inactive y, which is handled by the main useEffect
        const targetY = isCurrentlyActive ? -15 : 0;
        gsap.to(itemElCurrent, { y: targetY, duration: 0.35, ease: "power2.out", overwrite: "auto" });
      }
    };
    
    const handleMouseMoveActiveCard = (event: MouseEvent) => {
        const isCurrentlyActive = itemElCurrent.closest('.swiper-slide-active') !== null || isActive;
        if (!isCurrentlyActive || !itemElCurrent.contains(event.target as Node) || !posterElCurrent) {
           if (!isCurrentlyActive && posterElCurrent) { 
             gsap.to(posterElCurrent, { rotationX: 0, rotationY: 0, duration: 0.4, ease: "power1.out" });
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
  }, [isActive, isPrev, isNext, animationDefaults]); // Added isActive, isPrev, isNext, animationDefaults


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
