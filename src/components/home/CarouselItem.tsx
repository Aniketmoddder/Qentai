
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

  const scrambleChars = "!<>-_#?*01";
  const randomChar = () => scrambleChars[Math.floor(Math.random() * scrambleChars.length)];

  // GSAP Animations for Active/Inactive States
  useEffect(() => {
    const posterEl = posterRef.current;
    const numberEl = numberRef.current;
    const itemEl = itemRef.current;

    if (!posterEl || !numberEl || !itemEl) return;

    gsap.killTweensOf([posterEl, numberEl, itemEl]); // Kill previous tweens

    const tl = gsap.timeline({ defaults: animationDefaults });
    const rankStrLength = rank.toString().length;

    if (isActive) {
      // CARD - ACTIVE
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
      gsap.set(numberEl, { opacity: 0, scale: 0.7, y: 20, x: 0, color: 'transparent', webkitTextFillColor: 'transparent' });
      
      let scrambleCounter = 0;
      tl.to(numberEl, { // Scramble part
        duration: 0.03, // Faster scramble steps
        repeat: 8, // Fewer repeats for quicker reveal
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
      }, "<0.1") // Start slightly after card animation
      .to(numberEl, { // Pop-in after scramble
        scale: 1.08,
        y: 0,
        x: 0, 
        opacity: 1,
        rotationZ: 0,
        color: 'transparent', // Ensure gradient fill remains
        webkitTextFillColor: 'transparent', // Ensure gradient fill remains
        ease: "back.out(1.6)", // More pronounced pop
      }, ">-0.05");

      // NUMBER - ACTIVE - Neon Pulse (Text Shadow)
      gsap.to(numberEl, {
        textShadow: `
          0 0 8px hsla(var(--primary-raw-hsl, 262 89% 66%), 0.7),
          0 0 15px hsla(var(--primary-raw-hsl, 262 89% 66%), 0.5),
          0 0 25px hsla(var(--primary-raw-hsl, 262 89% 66%), 0.3),
          1px 1px 0px hsla(var(--ranking-number-stroke-color-raw-hsl, 0 0% 0% / 0.5), 0.5)
        `,
        duration: 1.5,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        delay: tl.duration() - 0.4, // Start as pop-in finishes
      });

      // CARD - ACTIVE - Continuous subtle breathing
      gsap.to(posterEl, {
        scale: 1.135, // Slightly more pronounced breath
        boxShadow: "0px 20px 50px 15px hsla(var(--primary-raw-hsl, 262 89% 66%), 0.40)",
        duration: 1.8,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        delay: tl.duration() - 0.3,
      });

    } else { // INACTIVE STATE
      const tiltAngle = isPrev ? -3.5 : (isNext ? 3.5 : 0);
      // CARD - INACTIVE
      tl.to(posterEl, {
        scale: 0.82,
        y: 0,
        opacity: 0.55, // Slightly less opaque
        rotationY: 0,
        rotationX: 0,
        rotationZ: tiltAngle,
        boxShadow: "0 6px 18px hsla(var(--border-raw-hsl, 240 5% 13%), 0.25)",
      }, 0);

      // NUMBER - INACTIVE
      tl.to(numberEl, {
        scale: 0.88,
        y: 10,
        x: 0, // Keep x at 0 for inactive to prevent further leftward shift
        opacity: 0.45,
        rotationZ: tiltAngle / 1.5,
        color: 'transparent', // Ensure gradient fill remains
        webkitTextFillColor: 'transparent', // Ensure gradient fill remains
        textShadow: `1px 1px 0px hsla(var(--ranking-number-stroke-color-raw-hsl, 0 0% 0% / 0.4), 0.4)`, // Simpler shadow
        onStart: () => {
            if(numberEl.textContent !== rank.toString()) numberEl.textContent = rank.toString(); // Ensure correct number if scramble was interrupted
        }
      }, "<0.05");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, isPrev, isNext, rank, animationDefaults]);

  // GSAP Hover Animations
  useEffect(() => {
    const itemElCurrent = itemRef.current;
    const posterElCurrent = posterRef.current;
    const numberElCurrent = numberRef.current;
    const glintOverlayEl = glintOverlayRef.current;

    if (!itemElCurrent || !posterElCurrent || !numberElCurrent) return;

    const handleMouseMove = (event: MouseEvent) => {
      if (!isActive) return; // Only apply mouse-follow tilt to active card
      const rect = itemElCurrent.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;
      
      const rotateXVal = 3 + (y / rect.height) * -12; // Increased sensitivity
      const rotateYVal = -3 + (x / rect.width) * 10; // Increased sensitivity

      gsap.to(posterElCurrent, { 
        rotationX: rotateXVal, 
        rotationY: rotateYVal, 
        duration: 0.4, 
        ease: "power1.out" 
      });
    };

    const handleMouseEnter = () => {
      // Common scale pop for all cards
      gsap.to([posterElCurrent, numberElCurrent], { 
        scale: "+=0.03", 
        duration: 0.25, 
        ease: "power2.out" 
      });

      if (glintOverlayEl) {
        gsap.killTweensOf(glintOverlayEl);
        gsap.set(glintOverlayEl, { x: '-150%', opacity: 0 });
        gsap.to(glintOverlayEl, {
            x: '150%',
            opacity: 0.8, // More visible glint
            duration: 0.5,
            ease: 'power1.inOut',
            onComplete: () => gsap.to(glintOverlayEl, { opacity: 0, duration: 0.2 })
        });
      }
      
      // Float effect
      if (hoverFloatTlRef.current) hoverFloatTlRef.current.kill();
      const currentY = gsap.getProperty(itemElCurrent, "y") as number; // Correctly get current y
      hoverFloatTlRef.current = gsap.timeline({ repeat: -1, yoyo: true })
          .to(itemElCurrent, { y: currentY - (isActive ? 4 : 2) , duration: 1.7, ease: "sine.inOut" });


      if (isActive) { // More intense effects for active card on hover
        itemElCurrent.addEventListener('mousemove', handleMouseMove);
        gsap.to(posterElCurrent, {
            boxShadow: "0px 22px 55px 18px hsla(var(--primary-raw-hsl, 262 89% 66%), 0.45)", // Intensify glow
            duration: 0.25, ease: "power2.out"
        });
        gsap.to(numberElCurrent, {
            textShadow: `
              0 0 10px hsla(var(--primary-raw-hsl, 262 89% 66%), 0.8),
              0 0 18px hsla(var(--primary-raw-hsl, 262 89% 66%), 0.6),
              0 0 30px hsla(var(--primary-raw-hsl, 262 89% 66%), 0.4),
              1px 1px 0px hsla(var(--ranking-number-stroke-color-raw-hsl, 0 0% 0% / 0.5), 0.5)
            `,
            duration: 0.25, ease: "power2.out"
        });
      } else { // Effects for inactive cards on hover
         gsap.to(posterElCurrent, { 
             y: "-=5", 
             opacity: 0.7, // Brighten a bit
             boxShadow: "0 8px 22px hsla(var(--border-raw-hsl, 240 5% 13%), 0.30)",
             duration: 0.25, 
             ease: "power2.out" 
         });
      }
    };

    const handleMouseLeave = () => {
       // Revert common scale pop
       gsap.to([posterElCurrent, numberElCurrent], { 
         scale: "-=0.03", 
         duration: 0.3, 
         ease: "power2.inOut" 
       });
      
      if (hoverFloatTlRef.current) {
        hoverFloatTlRef.current.kill();
        // Smoothly return to base position set by active/inactive animation
        gsap.to(itemElCurrent, { y: isActive ? -15 : 0, duration: 0.3, ease: "power2.out" });
      }
      
      if (isActive) {
        itemElCurrent.removeEventListener('mousemove', handleMouseMove);
        // Revert active card specifics to its continuous active state
        gsap.to(posterElCurrent, { 
            rotationX: 3, 
            rotationY: -3, 
            boxShadow: "0px 20px 50px 15px hsla(var(--primary-raw-hsl, 262 89% 66%), 0.40)",
            duration: 0.35, 
            ease: "power2.inOut" 
        });
        gsap.to(numberElCurrent, {
            textShadow: `
              0 0 8px hsla(var(--primary-raw-hsl, 262 89% 66%), 0.7),
              0 0 15px hsla(var(--primary-raw-hsl, 262 89% 66%), 0.5),
              0 0 25px hsla(var(--primary-raw-hsl, 262 89% 66%), 0.3),
              1px 1px 0px hsla(var(--ranking-number-stroke-color-raw-hsl, 0 0% 0% / 0.5), 0.5)
            `,
            duration: 0.35, ease: "power2.inOut"
        });
      } else { // Revert inactive card specifics
          gsap.to(posterElCurrent, { 
            y: 0, 
            opacity: 0.55, 
            boxShadow: "0 6px 18px hsla(var(--border-raw-hsl, 240 5% 13%), 0.25)",
            duration: 0.35, 
            ease: "power2.inOut" 
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, animationDefaults]); // Depend on isActive to re-apply base active/inactive states on leave

  return (
    <div className="carousel-item-wrapper" ref={itemRef}>
      <div
        className="ranking-number"
        ref={numberRef}
        style={{
          color: 'transparent', 
          WebkitTextFillColor: 'transparent' // Ensure gradient fill compatibility
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
              priority={rank <= 3} // Prioritize loading images for top-ranked items
            />
            <div className="glint-overlay" ref={glintOverlayRef}></div>
          </div>
      </Link>
    </div>
  );
};
export default CarouselItem;

