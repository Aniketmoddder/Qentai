
'use client';

import React, { useEffect, useRef } from 'react';
import Image from 'next/image';
import { gsap } from 'gsap';
import { cn } from '@/lib/utils';

interface AnimatedPosterProps {
  src: string;
  alt: string;
  aiHint?: string;
  className?: string;
}

export default function AnimatedPoster({ src, alt, aiHint, className }: AnimatedPosterProps) {
  const posterWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (posterWrapperRef.current) {
      // Initial state (before animation)
      gsap.set(posterWrapperRef.current, { opacity: 0, y: 30, scale: 0.95 });

      // Animation
      gsap.to(posterWrapperRef.current, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 1.2, // Slightly longer for a smoother, premium feel
        ease: 'expo.out', // A smooth, decelerating ease
        delay: 0.3, // A slight delay to ensure page elements are settling
        scrollTrigger: { // Optional: trigger animation when it comes into view, if desired for other contexts
          trigger: posterWrapperRef.current,
          start: "top bottom-=100px", // Start when 100px from bottom of viewport hits top of element
          toggleActions: "play none none none", // Play once when it enters
          once: true, // Ensure it only plays once
        }
      });
    }
  }, []);

  return (
    <div
      ref={posterWrapperRef}
      className={cn(
        "aspect-[2/3] relative rounded-xl overflow-hidden shadow-2xl border-2 border-border/20 bg-card", // Base styles from original page
        className
      )}
      style={{ opacity: 0 }} // Start with opacity 0 for GSAP to fade in
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 640px) 200px, (max-width: 768px) 220px, (max-width: 1024px) 33vw, 25vw" // from original page
        className="object-cover"
        data-ai-hint={aiHint}
        priority // If it's above the fold, keep priority
      />
    </div>
  );
}
