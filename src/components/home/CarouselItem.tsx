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
    duration: 0.65, // Slightly increased for smoother feel
    ease: "power3.out",
  };

  const scrambleChars = "!<>-_\\/[]{}—=+*^?#0123456789";
  const randomChar = () => scrambleChars[Math.floor(Math.random() * scrambleChars.length)];

  // Entrance & Active/Inactive State Animations
  useEffect(() => {
    const posterEl = posterRef.current;
    const numberEl = numberRef.current;
    const itemEl = itemRef.current;

    if (!posterEl || !numberEl || !itemEl) return;

    gsap.killTweensOf([posterEl, numberEl, itemEl]); // Kill previous tweens on these elements

    const tl = gsap.timeline({ defaults: animationDefaults });

    if (isActive) {
      // --- ACTIVE STATE ---
      tl.to(posterEl, {
        scale: 1.12,
        y: -15,
        opacity: 1,
        rotationY: -3,
        rotationX: 3,
        boxShadow: "0px 18px 45px 12px hsla(var(--primary-raw-hsl, 262 89% 66%), 0.35)", // Themed glow
        ease: "expo.out", // A bit more dynamic for active
      }, 0);

      // Number Entrance - Scramble then Pop
      gsap.set(numberEl, { opacity: 0, scale: 0.7, y: 20, textContent: rank.toString(), color: 'transparent', webkitTextFillColor: 'transparent' });
      let scrambleCounter = 0;
      const rankStrLength = rank.toString().length;

      tl.to(numberEl, { // Scramble part
        duration: 0.025, // Faster scramble
        repeat: 10, // Fewer repeats for quicker reveal
        ease: "none",
        onStart: () => {
          gsap.set(numberEl, { opacity: 0.8, color: 'transparent', webkitTextFillColor: 'transparent' });
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
      }, "<0.1") // Start slightly after poster animation begins
      .to(numberEl, { // Pop-in after scramble
        scale: 1.08,
        y: 0,
        x: 0,
        opacity: 1,
        rotationZ: 0,
        color: 'transparent', // Ensure transparent for gradient
        webkitTextFillColor: 'transparent', // Ensure transparent for gradient
        ease: "back.out(1.6)",
      }, ">-0.05"); // Overlap slightly with scramble end

      // Active Number Neon Pulse (Text Shadow)
      gsap.to(numberEl, {
        textShadow: `
          0 0 8px hsla(var(--primary-raw-hsl), 0.7),
          0 0 15px hsla(var(--primary-raw-hsl), 0.5),
          0 0 25px hsla(var(--primary-raw-hsl), 0.3),
          1px 1px 0px hsla(var(--ranking-number-stroke-color-raw-hsl, var(--border-raw-hsl)), 0.5)
        `, // Adjusted for theme stroke
        duration: 1.5,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        delay: tl.duration() - 0.5, // Start pulse as pop-in finishes
      });

      // Continuous subtle breathing for active card
      gsap.to(posterEl, {
        scale: 1.135, // Slightly more scale for breath
        boxShadow: "0px 20px 50px 15px hsla(var(--primary-raw-hsl), 0.40)",
        duration: 1.8,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        delay: tl.duration() - 0.3,
      });

    } else {
      // --- INACTIVE STATE ---
      const tiltAngle = isPrev ? -3.5 : (isNext ? 3.5 : 0);
      tl.to(posterEl, {
        scale: 0.82,
        y: 0,
        opacity: 0.55,
        rotationY: 0,
        rotationX: 0,
        rotationZ: tiltAngle,
        boxShadow: "0 6px 18px hsla(var(--border-raw-hsl, 240 5% 13%), 0.25)",
      }, 0);

      tl.to(numberEl, {
        scale: 0.88,
        y: 10,
        x: -10,
        opacity: 0.45,
        rotationZ: tiltAngle / 1.5,
        color: 'transparent', // Ensure transparent for gradient
        webkitTextFillColor: 'transparent', // Ensure transparent for gradient
        textShadow: "1px 1px 0px hsla(var(--ranking-number-stroke-color-raw-hsl, var(--border-raw-hsl)), 0.4)",
        onStart: () => {
            if(numberEl.textContent !== rank.toString()) numberEl.textContent = rank.toString();
        }
      }, "<0.05");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, isPrev, isNext, rank, animationDefaults]);

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
      const rotateX = (y / rect.height) * -10; // Reduced tilt sensitivity for subtlety
      const rotateY = (x / rect.width) * 8;
      gsap.to(posterElCurrent, { rotationX: 3 + rotateX, rotationY: -3 + rotateY, duration: 0.4, ease: "power1.out" });
    };

    const handleMouseEnter = () => {
      gsap.to(posterElCurrent, {
        scale: isActive ? 1.16 : 0.85, // Active pops more
        y: isActive ? "-=5" : "-=3",
        boxShadow: isActive
            ? "0px 22px 55px 18px hsla(var(--primary-raw-hsl), 0.45)" // Enhanced active hover glow
            : "0 8px 22px hsla(var(--border-raw-hsl), 0.30)", // Subtle inactive hover shadow
        duration: 0.25,
        ease: "power2.out"
      });
      gsap.to(numberElCurrent, {
        scale: isActive ? 1.12 : 0.91, // Number scales with poster
        textShadow: isActive ? `
            0 0 10px hsla(var(--primary-raw-hsl), 0.8),
            0 0 18px hsla(var(--primary-raw-hsl), 0.6),
            0 0 30px hsla(var(--primary-raw-hsl), 0.4),
            1px 1px 0px hsla(var(--ranking-number-stroke-color-raw-hsl, var(--border-raw-hsl)), 0.5)
        ` : "1px 1px 0px hsla(var(--ranking-number-stroke-color-raw-hsl, var(--border-raw-hsl)), 0.45)",
        duration: 0.25,
        ease: "power2.out"
       });

      if (glintOverlayEl) {
        gsap.killTweensOf(glintOverlayEl);
        gsap.set(glintOverlayEl, { x: '-150%', opacity: 0 });
        gsap.to(glintOverlayEl, {
            x: '150%',
            opacity: 0.8, // Slightly more visible glint
            duration: 0.5, // Slightly quicker
            ease: 'power1.inOut',
            onComplete: () => gsap.to(glintOverlayEl, { opacity: 0, duration: 0.2 })
        });
      }

      if (hoverFloatTlRef.current) hoverFloatTlRef.current.kill();
      const currentY = parseFloat(gsap.getProperty(itemElCurrent, "y").toString());
      hoverFloatTlRef.current = gsap.timeline({ repeat: -1, yoyo: true })
          .to(itemElCurrent, { y: currentY - (isActive ? 3 : 1.5) , duration: 1.6, ease: "sine.inOut" });


      if (isActive) itemElCurrent.addEventListener('mousemove', handleMouseMove);
    };

    const handleMouseLeave = () => {
      gsap.to(posterElCurrent, {
        rotationX: isActive ? 3 : 0, rotationY: isActive ? -3 : 0,
        scale: isActive ? 1.135 : 0.82, // Back to breathing or inactive scale
        y: isActive ? -15 : 0,
        boxShadow: isActive
            ? "0px 20px 50px 15px hsla(var(--primary-raw-hsl), 0.40)" // Back to active breathing glow
            : "0 6px 18px hsla(var(--border-raw-hsl), 0.25)", // Back to inactive shadow
        duration: 0.35,
        ease: "power2.inOut"
      });
       gsap.to(numberElCurrent, {
        scale: isActive ? 1.08 : 0.88,
        textShadow: isActive ? `
            0 0 8px hsla(var(--primary-raw-hsl), 0.7),
            0 0 15px hsla(var(--primary-raw-hsl), 0.5),
            0 0 25px hsla(var(--primary-raw-hsl), 0.3),
            1px 1px 0px hsla(var(--ranking-number-stroke-color-raw-hsl, var(--border-raw-hsl)), 0.5)
        ` : "1px 1px 0px hsla(var(--ranking-number-stroke-color-raw-hsl, var(--border-raw-hsl)), 0.4)",
        duration: 0.35,
        ease: "power2.inOut"
      });

      if (hoverFloatTlRef.current) {
        hoverFloatTlRef.current.kill();
        // Smoothly return to its original y position (either active -15 or inactive 0)
        gsap.to(itemElCurrent, { y: isActive ? -15 : 0, duration: 0.3, ease: "power2.out" });
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
  }, [isActive, isPrev, isNext, rank]); // `rank` is added as it's used in number display

  return (
    <div className="carousel-item-wrapper" ref={itemRef}>
      <div
        className="ranking-number"
        ref={numberRef}
        style={{
          color: 'transparent', // Initial explicit transparency for CSS gradient
          WebkitTextFillColor: 'transparent'
        }}
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
              priority={rank <= 3} // Prioritize loading for top-ranked items
            />
            <div className="glint-overlay" ref={glintOverlayRef}></div>
          </div>
      </Link>
    </div>
  );
};
export default CarouselItem;
