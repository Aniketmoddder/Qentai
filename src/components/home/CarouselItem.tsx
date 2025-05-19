
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

  const scrambleChars = "!<>-_#?*0123456789";
  const randomChar = () => scrambleChars[Math.floor(Math.random() * scrambleChars.length)];
  const rankStr = rank.toString();
  const rankStrLength = rankStr.length;

  useEffect(() => {
    const posterEl = posterRef.current;
    const numberEl = numberRef.current;
    const itemEl = itemRef.current;

    if (!posterEl || !numberEl || !itemEl) return;

    gsap.killTweensOf([posterEl, numberEl, itemEl]);

    const tl = gsap.timeline({ defaults: animationDefaults });
    const tiltAngle = isPrev ? -2.0 : (isNext ? 2.0 : 0);

    if (isActive) {
      // CARD - ACTIVE
      gsap.set(posterEl, { willChange: 'transform, opacity, box-shadow' });
      tl.to(posterEl, {
        scale: 1.12,
        y: -15,
        opacity: 1,
        rotationY: -3,
        rotationX: 3,
        rotationZ: 0,
        boxShadow: "0px 18px 45px 12px hsla(var(--primary-raw-hsl, 262 89% 66%), 0.35)",
      }, 0);

      // NUMBER - ACTIVE - Entrance Scramble & Pop
      gsap.set(numberEl, { opacity: 0, scale: 0.7, y: 20, x: 0, color: 'transparent', webkitTextFillColor: 'transparent', willChange: 'transform, opacity, text-shadow, color, -webkit-text-fill-color' });
      
      let scrambleCounter = 0;
      tl.to(numberEl, { 
        duration: 0.025,
        repeat: 10,
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
          numberEl.textContent = rankStr;
          gsap.set(numberEl, { color: 'transparent', webkitTextFillColor: 'transparent'}); 
        }
      }, "<0.1")
      .to(numberEl, { 
        scale: 1.08,
        y: -12, // MOVED NUMBER UPWARDS for active state
        x: 0, 
        opacity: 1,
        rotationZ: 0,
        color: 'transparent',
        webkitTextFillColor: 'transparent',
        ease: "back.out(1.6)",
      }, ">-0.05")
      .to(numberEl, { 
        textShadow: `
          0 0 8px hsla(var(--primary-raw-hsl, 262 89% 66%), 0.7),
          0 0 15px hsla(var(--primary-raw-hsl, 262 89% 66%), 0.5),
          0 0 25px hsla(var(--primary-raw-hsl, 262 89% 66%), 0.3),
          1px 1px 0px var(--ranking-number-stroke-color, hsla(0,0%,0%,0.5))
        `,
        duration: 1.5,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
      }, "<");

      // CARD - ACTIVE - Continuous subtle breathing
      gsap.to(posterEl, {
        scale: 1.135, 
        boxShadow: "0px 20px 50px 15px hsla(var(--primary-raw-hsl, 262 89% 66%), 0.40)",
        duration: 1.8,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        delay: tl.duration() - 0.3, 
      });

    } else { // INACTIVE STATE
      gsap.set(posterEl, { willChange: 'transform, opacity, box-shadow' });
      tl.to(posterEl, {
        scale: 0.82,
        y: 0,
        opacity: 0.55,
        rotationY: 0,
        rotationX: 0,
        rotationZ: tiltAngle,
        boxShadow: "0 6px 18px hsla(var(--border-raw-hsl, 240 5% 13%), 0.25)",
      }, 0);

      gsap.set(numberEl, { willChange: 'transform, opacity, text-shadow, color, -webkit-text-fill-color' });
      tl.to(numberEl, {
        scale: 0.88,
        y: 10, // Keep this y for inactive, ensures it's lower on side cards
        x: 0, 
        opacity: 0.45,
        rotationZ: tiltAngle / 1.5,
        color: 'transparent',
        webkitTextFillColor: 'transparent',
        textShadow: `1px 1px 0px var(--ranking-number-stroke-color, hsla(0,0%,0%,0.4))`,
        onStart: () => {
            if(numberEl.textContent !== rankStr) numberEl.textContent = rankStr;
            gsap.set(numberEl, { color: 'transparent', webkitTextFillColor: 'transparent'});
        }
      }, "<0.05");
    }
  }, [isActive, isPrev, isNext, rankStr, rankStrLength, animationDefaults]);

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
      
      const rotateXVal = 3 + (y / rect.height) * -12;
      const rotateYVal = -3 + (x / rect.width) * 10;

      gsap.to(posterElCurrent, { rotationX: rotateXVal, rotationY: rotateYVal, duration: 0.4, ease: "power1.out" });
    };

    const handleMouseEnter = () => {
      gsap.to([posterElCurrent, numberElCurrent], { scale: "+=0.03", duration: 0.25, ease: "power2.out", overwrite: "auto" });

      if (glintOverlayEl) {
        gsap.killTweensOf(glintOverlayEl);
        gsap.set(glintOverlayEl, { x: '-150%', opacity: 0 });
        gsap.to(glintOverlayEl, {
            x: '150%', opacity: 0.8, duration: 0.5, ease: 'power1.inOut',
            onComplete: () => gsap.to(glintOverlayEl, { opacity: 0, duration: 0.2 })
        });
      }
      
      if (hoverFloatTlRef.current) hoverFloatTlRef.current.kill();
      const currentItemY = gsap.getProperty(itemElCurrent, "y") as number;
      const targetItemYOffset = isActive ? 4 : 2; 
      hoverFloatTlRef.current = gsap.timeline({ repeat: -1, yoyo: true })
          .to(itemElCurrent, { y: currentItemY - targetItemYOffset, duration: 1.7, ease: "sine.inOut" });

      if (isActive) {
        itemElCurrent.addEventListener('mousemove', handleMouseMove);
        gsap.to(posterElCurrent, {
            boxShadow: "0px 22px 55px 18px hsla(var(--primary-raw-hsl, 262 89% 66%), 0.45)",
            duration: 0.25, ease: "power2.out", overwrite: "auto"
        });
        gsap.to(numberElCurrent, {
            textShadow: `
              0 0 10px hsla(var(--primary-raw-hsl, 262 89% 66%), 0.8),
              0 0 18px hsla(var(--primary-raw-hsl, 262 89% 66%), 0.6),
              0 0 30px hsla(var(--primary-raw-hsl, 262 89% 66%), 0.4),
              1px 1px 0px var(--ranking-number-stroke-color, hsla(0,0%,0%,0.5))
            `,
            duration: 0.25, ease: "power2.out", overwrite: "auto"
        });
      } else {
         gsap.to(posterElCurrent, { 
             y: "-=5", opacity: 0.7, 
             boxShadow: "0 8px 22px hsla(var(--border-raw-hsl, 240 5% 13%), 0.30)",
             duration: 0.25, ease: "power2.out", overwrite: "auto" 
         });
      }
    };

    const handleMouseLeave = () => {
      gsap.to([posterElCurrent, numberElCurrent], { scale: "-=0.03", duration: 0.3, ease: "power2.inOut", overwrite: "auto" });
      
      if (hoverFloatTlRef.current) {
        hoverFloatTlRef.current.kill();
        const baseItemY = isActive ? -15 : 0; // Revert to base y of item, poster y is separate
        gsap.to(itemElCurrent, { y: baseItemY, duration: 0.3, ease: "power2.out" });
      }
      
      if (isActive) {
        itemElCurrent.removeEventListener('mousemove', handleMouseMove);
        gsap.to(posterElCurrent, { 
            rotationX: 3, rotationY: -3, 
            boxShadow: "0px 18px 45px 12px hsla(var(--primary-raw-hsl, 262 89% 66%), 0.35)",
            duration: 0.35, ease: "power2.inOut", overwrite: "auto" 
        });
        gsap.to(numberElCurrent, {
            textShadow: `
              0 0 8px hsla(var(--primary-raw-hsl, 262 89% 66%), 0.7),
              0 0 15px hsla(var(--primary-raw-hsl, 262 89% 66%), 0.5),
              0 0 25px hsla(var(--primary-raw-hsl, 262 89% 66%), 0.3),
              1px 1px 0px var(--ranking-number-stroke-color, hsla(0,0%,0%,0.5))
            `,
            duration: 0.35, ease: "power2.inOut", overwrite: "auto"
        });
      } else {
          gsap.to(posterElCurrent, { 
            y: 0, opacity: 0.55, 
            boxShadow: "0 6px 18px hsla(var(--border-raw-hsl, 240 5% 13%), 0.25)",
            duration: 0.35, ease: "power2.inOut", overwrite: "auto" 
          });
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
      if (hoverFloatTlRef.current) hoverFloatTlRef.current.kill();
      gsap.killTweensOf([posterElCurrent, numberElCurrent, itemElCurrent, glintOverlayEl]);
    };
  }, [isActive, animationDefaults]);

  return (
    <div className="carousel-item-wrapper" ref={itemRef}>
      <div
        className="ranking-number"
        ref={numberRef}
        style={{
          color: 'transparent', 
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
              priority={rank <= 3}
            />
            <div className="glint-overlay" ref={glintOverlayRef}></div>
          </div>
      </Link>
    </div>
  );
};
export default CarouselItem;
