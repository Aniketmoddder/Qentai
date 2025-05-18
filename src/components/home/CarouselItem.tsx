// src/components/home/CarouselItem.tsx
'use client';

import React, { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import Image from 'next/image';
import Link from 'next/link';
// import { cn } from '@/lib/utils'; // cn might not be needed if all classes are directly applied

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

  const animationDefaults = {
    duration: 0.65,
    ease: "power3.out",
  };
  
  const scrambleChars = "!<>-_\\/[]{}—=+*^?#0123456789";
  const randomChar = () => scrambleChars[Math.floor(Math.random() * scrambleChars.length)];

  // ANIMATION FOR ACTIVE/INACTIVE STATE CHANGES
  useEffect(() => {
    const posterEl = posterRef.current;
    const numberEl = numberRef.current;

    if (!posterEl || !numberEl) return;

    gsap.killTweensOf([posterEl, numberEl]); // Kill any ongoing tweens on these elements

    const tl = gsap.timeline({ defaults: animationDefaults });

    if (isActive) {
      // --- ACTIVE STATE ---
      // Card Animation (Poster)
      tl.to(posterEl, { 
        scale: 1.12, 
        y: -15, 
        opacity: 1, 
        rotationY: -2.5, // Subtle 3D tilt
        rotationX: 2.5,  // Subtle 3D tilt
        boxShadow: "0px 10px 35px 8px hsla(var(--primary-raw-hsl, 260 100% 70%), 0.45)", // Enhanced themed glow
        ease: "power3.out"
      }, 0);

      // Number Entrance & Active Animation
      // 1. Initial state for entrance (hidden, slightly smaller)
      gsap.set(numberEl, { opacity: 0, scale: 0.7, y: 10, textContent: rank.toString() }); 
      
      // 2. Scramble
      let scrambleCounter = 0;
      const rankStrLength = rank.toString().length;
      const scrambleAnimation = {
        textContent: "", // This will be updated on each repeat
        duration: 0.04,
        repeat: 10, // Number of scramble steps
        ease: "none",
        onStart: () => {
            // Ensure the element is visible to see the scramble
             gsap.set(numberEl, { opacity: 0.6 });
        },
        onRepeat: () => {
          let text = "";
          for (let i = 0; i < rankStrLength; i++) {
            text += randomChar();
          }
          numberEl.textContent = text;
          scrambleCounter++;
        },
        onComplete: () => {
          numberEl.textContent = rank.toString(); // Set final number
        }
      };
      tl.to(numberEl, scrambleAnimation, "<0.1"); // Start scramble slightly after card animation begins

      // 3. Pop-in & Position (after scramble)
      tl.to(numberEl, { 
        scale: 1.1, 
        y: 0, 
        x: 0, 
        opacity: 1, 
        rotationZ: 0,
        ease: "back.out(1.6)", // More pronounced pop
      }, ">-0.05"); // Overlap slightly with scramble end

      // 4. Neon Pulse (Text Shadow)
      tl.to(numberEl, {
        textShadow: `
          0 0 7px hsla(var(--primary-raw-hsl, 260 100% 70%), 0.8), 
          0 0 14px hsla(var(--primary-raw-hsl, 260 100% 70%), 0.6), 
          0 0 22px hsla(var(--primary-raw-hsl, 260 100% 70%), 0.4),
          1px 1px 2px hsla(var(--border-raw-hsl, 240 5% 13%), 0.6)
        `,
        duration: 0.7,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
      }, ">-0.4"); // Start pulsing after pop-in

    } else {
      // --- INACTIVE STATE ---
      const tiltAngle = isPrev ? -3 : (isNext ? 3 : 0); // Slightly more tilt
      // Card Animation
      tl.to(posterEl, { 
        scale: 0.82, 
        y: 0, 
        opacity: 0.55, 
        rotationY: 0, 
        rotationX: 0,
        rotationZ: tiltAngle,
        boxShadow: "0 8px 20px rgba(0, 0, 0, 0.3)", 
        ease: "power3.out"
      }, 0);

      // Number Animation
      tl.to(numberEl, { 
        scale: 0.85, 
        y: 10, 
        x: -10, 
        opacity: 0.45, 
        rotationZ: tiltAngle / 1.5,
        textShadow: "1px 1px 1px hsla(var(--border-raw-hsl, 240 5% 13%), 0.4)", 
        ease: "power3.out",
        onStart: () => { // Ensure textContent is set before animation if it was scrambling
            if(numberEl.textContent !== rank.toString()) numberEl.textContent = rank.toString();
        }
      }, "<0.05");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, isPrev, isNext, rank]); // Added rank, removed animationDefaults

  // HOVER ANIMATIONS (applied to all cards)
  useEffect(() => {
    const posterEl = posterRef.current;
    const numberEl = numberRef.current; 
    const itemElCurrent = itemRef.current;

    if (!itemElCurrent || !posterEl || !numberEl) return;

    const handleMouseEnter = () => {
      gsap.to(posterEl, { 
        scale: "+=0.035", 
        y: isActive ? "-=4" : "-=6", 
        opacity: isActive ? 1 : "+=0.2", 
        boxShadow: isActive ? "0px 12px 40px 10px hsla(var(--primary-raw-hsl, 260 100% 70%), 0.5)" : "0 18px 40px rgba(0,0,0,0.5)",
        duration: 0.2, 
        ease: "power2.out" 
      });
      gsap.to(numberEl, { 
        scale: "+=0.025", 
        duration: 0.2, 
        ease: "power2.out" 
      });
    };

    const handleMouseLeave = () => {
      // Revert to the values set by the isActive/isInactive useEffect
      gsap.to(posterEl, { 
        scale: isActive ? 1.12 : 0.82,
        y: isActive ? -15 : 0,
        opacity: isActive ? 1 : 0.55,
        boxShadow: isActive ? "0px 10px 35px 8px hsla(var(--primary-raw-hsl, 260 100% 70%), 0.45)" : "0 8px 20px rgba(0, 0, 0, 0.3)",
        duration: 0.25, 
        ease: "power2.inOut" 
      });
      gsap.to(numberEl, { 
        scale: isActive ? 1.1 : 0.85,
        duration: 0.25, 
        ease: "power2.inOut" 
      });
    };

    itemElCurrent.addEventListener('mouseenter', handleMouseEnter);
    itemElCurrent.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      if (itemElCurrent) {
        itemElCurrent.removeEventListener('mouseenter', handleMouseEnter);
        itemElCurrent.removeEventListener('mouseleave', handleMouseLeave);
      }
      gsap.killTweensOf([posterEl, numberEl]);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]); // React to isActive for hover base reversion

  return (
    <div className="carousel-item-wrapper" ref={itemRef}> {/* Added transform-style in globals.css */}
      <div className="ranking-number" ref={numberRef}>{rank}</div>
      <Link href={`/anime/${showId}`} passHref legacyBehavior={false}>
        <div className="show-poster-container-link" > 
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
          </div>
        </div>
      </Link>
    </div>
  );
};
export default CarouselItem;
