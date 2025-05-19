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

    gsap.killTweensOf([posterEl, numberEl, itemEl]); // Kill all previous tweens on these elements

    const rootStyle = getComputedStyle(document.documentElement);
    const primaryHSLString = rootStyle.getPropertyValue('--primary-raw-hsl').trim();
    // const currentStrokeColor = rootStyle.getPropertyValue('--ranking-number-stroke-color').trim() || 'rgba(0,0,0,0.7)';

    const tl = gsap.timeline({
      defaults: animationDefaults,
      onComplete: () => {
        if (isActive) {
          // Subtle continuous animation for active poster (breathing effect)
          gsap.to(posterEl, {
            scale: 1.135, // Slightly larger than initial active scale
            duration: 2.5,
            ease: "sine.inOut",
            repeat: -1,
            yoyo: true,
          });
          // Subtle continuous animation for active number (breathing effect for its glow)
          // Commented out the textShadow pulse as it was causing issues.
          // A static shadow is applied via CSS.
          // gsap.to(numberEl, {
          //   textShadow: primaryHSLString
          //     ? `0 0 10px hsla(${primaryHSLString}, 0.7), 0 0 20px hsla(${primaryHSLString}, 0.5), 0 0 30px hsla(${primaryHSLString}, 0.3)`
          //     : "0 0 10px rgba(139,92,246,0.5)", // Fallback
          //   duration: 1.5,
          //   ease: "sine.inOut",
          //   repeat: -1,
          //   yoyo: true,
          // });
        }
      }
    });

    const tiltAngle = isPrev ? -2.0 : (isNext ? 2.0 : 0);

    if (isActive) {
      gsap.set(itemEl, { zIndex: 10 });
      tl.to(posterEl, {
        scale: 1.12, y: -15, opacity: 1,
        rotationY: -3, rotationX: 3, rotationZ: 0,
        boxShadow: primaryHSLString
          ? `0px 22px 55px 18px hsla(${primaryHSLString}, 0.50)`
          : "0px 20px 50px 15px rgba(139,92,246,0.4)", // Fallback shadow
      }, 0);

      // Number Entrance: Digital Cascade Reveal
      gsap.set(numberEl, { opacity: 0, scale: 0.7, y: 20, x:0 }); // Removed color setting here
      let scrambleCounter = 0;
      const scrambleDuration = 0.025;
      const scrambleRepeats = Math.max(8, rankStrLength * 2);

      tl.to(numberEl, {
        opacity: 0.85, // Initial opacity for scramble visibility
        duration: 0.01, // Almost instant
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
        scale: 1.08, y: -30, x: 0, opacity: 1, // Target y for active number
        ease: "back.out(1.6)",
        // color and webkitTextFillColor are set by CSS
        // textShadow animation is handled by the onComplete or a separate tween if re-enabled
      }, `>${scrambleDuration * (scrambleRepeats -1) }`); // Ensure it starts after scramble finishes

    } else { // INACTIVE STATE
      gsap.set(itemEl, { zIndex: isPrev || isNext ? 5 : 1 });
      if (numberEl) numberEl.textContent = rankStr; // Ensure correct number is shown

      tl.to(posterEl, {
        scale: 0.82, y: 0, opacity: 0.55,
        rotationY: 0, rotationX: 0, rotationZ: tiltAngle,
        boxShadow: "0 8px 20px hsla(var(--border-raw-hsl, 240 5% 13%), 0.28)", // Use theme border color for shadow
      }, 0)
      .to(numberEl, {
        scale: 0.88, y: 10, x: 0, opacity: 0.65, // Target y for inactive number
        rotationZ: tiltAngle / 1.5, // Adjusted tilt for number
        // color and webkitTextFillColor are set by CSS
        // textShadow: `1px 1px 0px ${currentStrokeColor}` // Static shadow from CSS
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
    // const numberElCurrent = numberRef.current; // Not directly animated on mousemove for performance
    const glintOverlayEl = glintOverlayRef.current;

    if (!itemElCurrent || !posterElCurrent || !glintOverlayEl) return;

    let originalBaseY = 0;

    const handleMouseEnter = () => {
      const isCurrentlyActive = itemElCurrent.closest('.swiper-slide-active') !== null || isActive;
      const rootStyle = getComputedStyle(document.documentElement);
      const primaryHSLString = rootStyle.getPropertyValue('--primary-raw-hsl').trim();
      const targetPosterScale = isCurrentlyActive ? 1.12 * 1.02 : 0.82 * 1.03;

      gsap.to(posterElCurrent, {
        scale: targetPosterScale,
        boxShadow: isCurrentlyActive
          ? (primaryHSLString ? `0px 25px 60px 20px hsla(${primaryHSLString}, 0.55)` : "0 25px 60px rgba(139,92,246,0.5)")
          : "0 10px 30px hsla(var(--border-raw-hsl, 240 5% 13%), 0.40)",
        duration: 0.3, ease: "power2.out", overwrite: "auto"
      });
      // Hover effect on number is simplified to scale with poster
      if (numberRef.current) {
        gsap.to(numberRef.current, { scale: targetPosterScale * 0.96, duration: 0.3, ease: "power2.out", overwrite: "auto" }); // Slightly less scale than poster
      }


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
      const targetItemYOffset = isCurrentlyActive ? 2.5 : 1.5;
      hoverFloatTlRef.current = gsap.timeline({ repeat: -1, yoyo: true })
        .to(itemElCurrent, { y: originalBaseY - targetItemYOffset, duration: 1.8, ease: "sine.inOut" });
    };

    const handleMouseLeave = () => {
      const isCurrentlyActive = itemElCurrent.closest('.swiper-slide-active') !== null || isActive;
      const rootStyle = getComputedStyle(document.documentElement);
      const primaryHSLString = rootStyle.getPropertyValue('--primary-raw-hsl').trim();
      const targetPosterScale = isCurrentlyActive ? 1.12 : 0.82;
      
      gsap.to(posterElCurrent, {
        scale: targetPosterScale,
        boxShadow: isCurrentlyActive
          ? (primaryHSLString ? `0px 22px 55px 18px hsla(${primaryHSLString}, 0.50)` : "0px 20px 50px 15px rgba(139,92,246,0.4)")
          : "0 8px 20px hsla(var(--border-raw-hsl, 240 5% 13%), 0.28)",
        rotationX: isCurrentlyActive ? 3 : 0, // Re-apply active rotation
        rotationY: isCurrentlyActive ? -3 : 0, // Re-apply active rotation
        duration: 0.35, ease: "power2.inOut", overwrite: "auto"
      });
      if (numberRef.current) {
         gsap.to(numberRef.current, { scale: targetPosterScale * 0.96, duration: 0.35, ease: "power2.inOut", overwrite: "auto" });
      }


      if (hoverFloatTlRef.current) {
        hoverFloatTlRef.current.kill();
        hoverFloatTlRef.current = null;
        const targetY = isCurrentlyActive ? -15 : 0; // Revert to base active/inactive y
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

        const rotateXVal = 3 + (y / rect.height) * -10; // Base active rotation + mouse influence
        const rotateYVal = -3 + (x / rect.width) * 8;  // Base active rotation + mouse influence
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
      gsap.killTweensOf([itemElCurrent, posterElCurrent, numberRef.current, glintOverlayEl]);
    };
  }, [isActive, isPrev, isNext, animationDefaults]); // Dependencies for re-running hover setup IF NEEDED, but empty often preferred for listeners.
                                                  // Keeping it empty ensures listeners are set once.
                                                  // If isActive etc. are needed for logic INSIDE handlers, they are captured by closure.

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
