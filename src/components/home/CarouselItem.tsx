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
  const glintOverlayRef = useRef<HTMLDivElement>(null);
  const hoverFloatTlRef = useRef<gsap.core.Timeline | null>(null);


  const animationDefaults = {
    duration: 0.65,
    ease: "power3.out",
  };

  const scrambleChars = "!<>-_\\/[]{}—=+*^?#0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const randomChar = () => scrambleChars[Math.floor(Math.random() * scrambleChars.length)];

  // Entrance & Active/Inactive State Animations
  useEffect(() => {
    const posterEl = posterRef.current;
    const numberEl = numberRef.current;
    const itemEl = itemRef.current;


    if (!posterEl || !numberEl || !itemEl) return;

    gsap.killTweensOf([posterEl, numberEl, itemEl]);

    const tl = gsap.timeline({ defaults: animationDefaults });

    if (isActive) {
      // --- ACTIVE STATE ---
      tl.to(posterEl, {
        scale: 1.12,
        y: -15,
        opacity: 1,
        rotationY: -3,
        rotationX: 3,
        boxShadow: "0px 18px 45px 12px hsla(var(--primary-raw-hsl, 262 89% 66%), 0.50)",
      }, 0);

      // Number Entrance
      gsap.set(numberEl, { opacity: 0, scale: 0.7, y: 20, textContent: rank.toString() });
      let scrambleCounter = 0;
      const rankStrLength = rank.toString().length;
      
      tl.to(numberEl, { // Scramble part integrated into the main timeline
        duration: 0.03,
        repeat: 12,
        ease: "none",
        onStart: () => {
            gsap.set(numberEl, { opacity: 0.8 });
        },
        onRepeat: () => {
          let text = "";
          for (let i = 0; i < rankStrLength; i++) text += randomChar();
          numberEl.textContent = text;
          scrambleCounter++;
        },
        onComplete: () => {
          numberEl.textContent = rank.toString();
        }
      }, "<0.1")
      .to(numberEl, { // Pop-in after scramble
        scale: 1.08, // Slightly reduced from 1.1 for subtlety
        y: 0,
        x: 0,
        opacity: 1,
        rotationZ: 0,
        ease: "back.out(1.6)", // Slightly softer pop
      }, ">-0.05");

      // Active Number Neon Pulse
      gsap.to(numberEl, {
        textShadow: `
          0 0 5px hsla(var(--primary-raw-hsl, 262 89% 66%), 0.6),
          0 0 12px hsla(var(--primary-raw-hsl, 262 89% 66%), 0.4),
          0 0 20px hsla(var(--primary-raw-hsl, 262 89% 66%), 0.25),
          1px 1px 1px hsla(var(--border-raw-hsl, 240 5% 13%), 0.4)
        `,
        duration: 1.3,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        delay: tl.duration() - 0.4,
      });

      // Continuous subtle breathing for active card
      gsap.to(posterEl, {
        scale: 1.13, // Slightly more scale for breath
        boxShadow: "0px 20px 50px 15px hsla(var(--primary-raw-hsl, 262 89% 66%), 0.55)",
        duration: 1.6,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        delay: tl.duration() -0.2,
      });

    } else {
      // --- INACTIVE STATE ---
      const tiltAngle = isPrev ? -3.5 : (isNext ? 3.5 : 0); // Slightly more defined tilt
      tl.to(posterEl, {
        scale: 0.82,
        y: 0,
        opacity: 0.55,
        rotationY: 0,
        rotationX: 0,
        rotationZ: tiltAngle,
        boxShadow: "0 6px 18px rgba(0,0,0,0.35)",
      }, 0);

      tl.to(numberEl, {
        scale: 0.88,
        y: 10,
        x: -10, // Keep the offset for depth
        opacity: 0.45,
        rotationZ: tiltAngle / 1.5, // Synchronized tilt
        textShadow: "1px 1px 1px hsla(var(--border-raw-hsl, 240 5% 13%), 0.3)",
        onStart: () => {
            if(numberEl.textContent !== rank.toString()) numberEl.textContent = rank.toString();
        }
      }, "<0.05");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, isPrev, isNext, rank, animationDefaults]); // animationDefaults added

  // HOVER ANIMATIONS
  useEffect(() => {
    const itemElCurrent = itemRef.current;
    const posterElCurrent = posterRef.current;
    const numberElCurrent = numberRef.current;
    const glintOverlayEl = glintOverlayRef.current;

    if (!itemElCurrent || !posterElCurrent || !numberElCurrent) return;

    const handleMouseMove = (event: MouseEvent) => {
      if (!isActive) return;
      const rect = itemElCurrent.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;
      const rotateX = (y / rect.height) * -12; // Increased tilt sensitivity
      const rotateY = (x / rect.width) * 12;
      gsap.to(posterElCurrent, { rotationX: 3 + rotateX, rotationY: -3 + rotateY, duration: 0.35, ease: "power1.out" });
    };

    const handleMouseEnter = () => {
      gsap.to(posterElCurrent, { scale: isActive ? 1.16 : 0.85, y: isActive ? "-=5" : "-=3", duration: 0.25, ease: "power2.out" });
      gsap.to(numberElCurrent, { scale: isActive ? 1.12 : 0.91, duration: 0.25, ease: "power2.out" });
      
      if (glintOverlayEl) {
        gsap.killTweensOf(glintOverlayEl);
        gsap.set(glintOverlayEl, { x: '-150%', opacity: 0 });
        gsap.to(glintOverlayEl, {
            x: '150%',
            opacity: 1,
            duration: 0.55,
            ease: 'power1.inOut',
            onComplete: () => gsap.to(glintOverlayEl, { opacity: 0, duration: 0.25 })
        });
      }

      if (hoverFloatTlRef.current) hoverFloatTlRef.current.kill();
      hoverFloatTlRef.current = gsap.timeline({ repeat: -1, yoyo: true })
          .to(itemElCurrent, { y: isActive ? (parseFloat(gsap.getProperty(itemElCurrent, "y").toString()) - 2) : (parseFloat(gsap.getProperty(itemElCurrent, "y").toString()) -1) , duration: 1.7, ease: "sine.inOut" });


      if (isActive) itemElCurrent.addEventListener('mousemove', handleMouseMove);
    };

    const handleMouseLeave = () => {
      gsap.to(posterElCurrent, {
        rotationX: isActive ? 3 : 0, rotationY: isActive ? -3 : 0,
        scale: isActive ? 1.13 : 0.82, y: isActive ? -15 : 0,
        duration: 0.35, ease: "power2.inOut"
      });
      gsap.to(numberElCurrent, { scale: isActive ? 1.08 : 0.88, y: isActive ? 0 : 10, duration: 0.35, ease: "power2.inOut" });

      if (hoverFloatTlRef.current) {
        hoverFloatTlRef.current.kill();
        gsap.to(itemElCurrent, { y: isActive ? -15 : 0, duration: 0.3, ease: "power2.out" }); // Ensure it returns to base y
      }

      if (isActive) itemElCurrent.removeEventListener('mousemove', handleMouseMove);
    };

    itemElCurrent.addEventListener('mouseenter', handleMouseEnter);
    itemElCurrent.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      if (itemElCurrent) {
        itemElCurrent.removeEventListener('mouseenter', handleMouseEnter);
        itemElCurrent.removeEventListener('mouseleave', handleMouseLeave);
        itemElCurrent.removeEventListener('mousemove', handleMouseMove);
      }
      if (hoverFloatTlRef.current) hoverFloatTlRef.current.kill();
      gsap.killTweensOf([posterElCurrent, numberElCurrent, itemElCurrent, glintOverlayEl]);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, isPrev, isNext]);

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
            <div className="glint-overlay" ref={glintOverlayRef}></div>
          </div>
        </div>
      </Link>
    </div>
  );
};
export default CarouselItem;
