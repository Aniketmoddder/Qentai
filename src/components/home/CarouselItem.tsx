
// src/components/home/CarouselItem.tsx
'use client';

import React, { useRef, useEffect, useState } from 'react';
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

  const animationDefaults = {
    duration: 0.65, // Slightly longer for smoother feel
    ease: "power3.out", // Smoother easing
  };

  const scrambleChars = "!<>-_\\/[]{}—=+*^?#0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const randomChar = () => scrambleChars[Math.floor(Math.random() * scrambleChars.length)];

  // Entrance & Active/Inactive State Animations
  useEffect(() => {
    const posterEl = posterRef.current;
    const numberEl = numberRef.current;

    if (!posterEl || !numberEl) return;

    gsap.killTweensOf([posterEl, numberEl]);

    const tl = gsap.timeline({ defaults: animationDefaults });

    if (isActive) {
      // --- ACTIVE STATE ---
      // Card Animation (Poster) - "Perspective Flip & Illuminate"
      tl.to(posterEl, {
        scale: 1.12,
        y: -15,
        opacity: 1,
        rotationY: -3, // Subtle 3D tilt
        rotationX: 3,  // Subtle 3D tilt
        boxShadow: "0px 15px 40px 10px hsla(var(--primary-raw-hsl, 262 89% 66%), 0.45)", // Enhanced themed glow
      }, 0);

      // Number Entrance - "Digital Cascade Reveal"
      // 1. Initial state for entrance (hidden, slightly smaller, offset)
      gsap.set(numberEl, { opacity: 0, scale: 0.7, y: 20, textContent: rank.toString() });
      
      // 2. Scramble
      let scrambleCounter = 0;
      const rankStrLength = rank.toString().length;
      const scrambleAnimation = {
        textContent: "",
        duration: 0.03, // Faster scramble step
        repeat: 12,     // More steps for a denser scramble
        ease: "none",
        onStart: () => {
            gsap.set(numberEl, { opacity: 0.8 }); // Make it visible for scramble
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
          numberEl.textContent = rank.toString();
        }
      };
      tl.to(numberEl, scrambleAnimation, "<0.1"); // Start scramble slightly after card

      // 3. Pop-in & Position (after scramble)
      tl.to(numberEl, {
        scale: 1.1,
        y: 0,
        x: 0,
        opacity: 1,
        rotationZ: 0,
        ease: "back.out(1.4)", // Slightly less aggressive pop than 1.7
      }, ">-0.05"); // Overlap slightly

      // 4. Active Number Neon Pulse (Text Shadow)
      gsap.to(numberEl, {
        textShadow: `
          0 0 8px hsla(var(--primary-raw-hsl, 262 89% 66%), 0.7),
          0 0 16px hsla(var(--primary-raw-hsl, 262 89% 66%), 0.5),
          0 0 25px hsla(var(--primary-raw-hsl, 262 89% 66%), 0.3),
          1px 1px 2px hsla(var(--border-raw-hsl, 240 5% 13%), 0.5)
        `,
        duration: 1.2,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        delay: tl.duration() - 0.5, // Start pulsing after main entrance
      });

      // Continuous subtle breathing for active card
      gsap.to(posterEl, {
        scale: 1.135, // Slightly more scale for breath
        boxShadow: "0px 18px 45px 12px hsla(var(--primary-raw-hsl, 262 89% 66%), 0.50)",
        duration: 1.5,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        delay: tl.duration() -0.3,
      });


    } else {
      // --- INACTIVE STATE ---
      const tiltAngle = isPrev ? -4 : (isNext ? 4 : 0); // Slightly more defined tilt for side cards
      tl.to(posterEl, {
        scale: 0.82,
        y: 0,
        opacity: 0.55,
        rotationY: 0,
        rotationX: 0,
        rotationZ: tiltAngle,
        boxShadow: "0 8px 20px rgba(0,0,0,0.3)", // Standard less intense shadow
      }, 0);

      tl.to(numberEl, {
        scale: 0.88,
        y: 10,
        x: -10,
        opacity: 0.45,
        rotationZ: tiltAngle / 1.5,
        textShadow: "1px 1px 1px hsla(var(--border-raw-hsl, 240 5% 13%), 0.3)", // Simpler shadow
        onStart: () => { // Ensure textContent is correct if exiting scramble
            if(numberEl.textContent !== rank.toString()) numberEl.textContent = rank.toString();
        }
      }, "<0.05");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, isPrev, isNext, rank]);

  // HOVER ANIMATIONS (Dynamic 3D Tilt & Enhanced Illumination)
  useEffect(() => {
    const itemElCurrent = itemRef.current;
    const posterEl = posterRef.current;
    const numberEl = numberRef.current;

    if (!itemElCurrent || !posterEl || !numberEl) return;

    const handleMouseMove = (event: MouseEvent) => {
      if (!isActive) return; // Only apply intense 3D tilt to active card on hover

      const rect = itemElCurrent.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;

      const rotateX = (y / rect.height) * -10; // Max tilt 5deg
      const rotateY = (x / rect.width) * 10;  // Max tilt 5deg

      gsap.to(posterEl, {
        rotationX: 3 + rotateX, // Add to base active tilt
        rotationY: -3 + rotateY, // Add to base active tilt
        duration: 0.4,
        ease: "power1.out",
      });
    };

    const handleMouseEnter = () => {
      gsap.to(posterEl, {
        scale: isActive ? 1.15 : "+=0.03", // Slightly larger pop on active
        boxShadow: isActive ? "0px 20px 50px 15px hsla(var(--primary-raw-hsl, 262 89% 66%), 0.55)" : "0 12px 30px rgba(0,0,0,0.45)",
        y: isActive ? "-=5" : "-=3",
        duration: 0.25,
        ease: "power2.out"
      });
      gsap.to(numberEl, {
        scale: isActive ? 1.13 : "+=0.03",
        duration: 0.25,
        ease: "power2.out"
      });
      if (isActive) {
        itemElCurrent.addEventListener('mousemove', handleMouseMove);
      }
    };

    const handleMouseLeave = () => {
      // Revert to the base active/inactive state defined in the other useEffect
      gsap.to(posterEl, {
        rotationX: isActive ? 3 : 0,
        rotationY: isActive ? -3 : 0,
        scale: isActive ? 1.135 : 0.82, // Matches the continuous active scale or inactive scale
        y: isActive ? -15 : 0,
        boxShadow: isActive ? "0px 18px 45px 12px hsla(var(--primary-raw-hsl, 262 89% 66%), 0.50)" : "0 8px 20px rgba(0,0,0,0.3)",
        duration: 0.35,
        ease: "power2.inOut"
      });
      gsap.to(numberEl, {
        scale: isActive ? 1.1 : 0.88,
        duration: 0.35,
        ease: "power2.inOut"
      });
      if (isActive) {
        itemElCurrent.removeEventListener('mousemove', handleMouseMove);
      }
    };

    itemElCurrent.addEventListener('mouseenter', handleMouseEnter);
    itemElCurrent.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      if (itemElCurrent) {
        itemElCurrent.removeEventListener('mouseenter', handleMouseEnter);
        itemElCurrent.removeEventListener('mouseleave', handleMouseLeave);
        itemElCurrent.removeEventListener('mousemove', handleMouseMove);
      }
      gsap.killTweensOf([posterEl, numberEl]);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, isPrev, isNext]); // Depend on isActive to correctly apply/remove mousemove

  return (
    <div className="carousel-item-wrapper" ref={itemRef}>
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
