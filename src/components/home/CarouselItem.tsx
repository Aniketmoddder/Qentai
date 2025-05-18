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
  const posterContainerRef = useRef<HTMLDivElement>(null);
  const numberRef = useRef<HTMLDivElement>(null);

  const animationDefaults = {
    duration: 0.55,
    ease: "expo.out",
  };

  useEffect(() => {
    const posterEl = posterContainerRef.current;
    const numberEl = numberRef.current;

    if (!posterEl || !numberEl) return;

    gsap.killTweensOf([posterEl, numberEl]);

    const tl = gsap.timeline({ defaults: animationDefaults });

    if (isActive) {
      tl.to(posterEl, { scale: 1.12, y: -12, opacity: 1, rotationZ: 0 }, 0)
        .to(numberEl, { scale: 1.08, y: 0, x: 0, opacity: 1, rotationZ: 0 }, "<0.05");
    } else {
      const tiltAngle = isPrev ? -2.5 : (isNext ? 2.5 : 0);
      tl.to(posterEl, { scale: 0.82, y: 0, opacity: 0.6, rotationZ: tiltAngle }, 0)
        .to(numberEl, { scale: 0.88, y: 8, x: -8, opacity: 0.5, rotationZ: tiltAngle / 1.6 }, "<0.05");
    }
  }, [isActive, isPrev, isNext, animationDefaults]);

  useEffect(() => {
    const itemElCurrent = itemRef.current;
    const posterEl = posterContainerRef.current;
    const numberEl = numberRef.current;

    if (!itemElCurrent || !posterEl || !numberEl) return;

    const handleMouseEnter = () => {
      gsap.to(posterEl, { scale: "+=0.04", duration: 0.25, ease: "power2.out", overwrite: "auto" });
      gsap.to(numberEl, { scale: "+=0.04", duration: 0.25, ease: "power2.out", overwrite: "auto" });
    };

    const handleMouseLeave = () => {
      gsap.to(posterEl, { scale: "-=0.04", duration: 0.3, ease: "power2.inOut", overwrite: "auto" });
      gsap.to(numberEl, { scale: "-=0.04", duration: 0.3, ease: "power2.inOut", overwrite: "auto" });
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
  }, []);

  return (
    <div className="carousel-item-wrapper" ref={itemRef}>
      <div className="ranking-number" ref={numberRef}>{rank}</div>
      <Link href={`/anime/${showId}`} passHref legacyBehavior={false}>
        <div className="show-poster-container-link">
          <div className="show-poster-container" ref={posterContainerRef}>
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
