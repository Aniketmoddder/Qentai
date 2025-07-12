
'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import Logo from '@/components/common/logo';
import { cn } from '@/lib/utils';

interface PreloaderProps {
  onFinished: () => void;
}

const containerVariants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.3,
    },
  },
  exit: {
    transition: {
      staggerChildren: 0.08,
      staggerDirection: -1,
    },
  },
};

const panelVariants = {
  initial: {
    y: '100vh',
    skewY: 5,
  },
  animate: {
    y: 0,
    skewY: 0,
    transition: {
      duration: 1.5,
      ease: [0.22, 1, 0.36, 1], // A strong ease-out
    },
  },
  exit: {
    y: '-100vh',
    skewY: -5,
    transition: {
      duration: 1,
      ease: [0.76, 0, 0.24, 1], // A strong ease-in
    },
  },
};

const logoVariants = {
    initial: {
      opacity: 0,
      y: 20,
    },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        delay: 1.2,
        duration: 0.8,
        ease: 'easeOut',
      },
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: {
        duration: 0.5,
        ease: 'easeIn',
      },
    },
};

export default function Preloader({ onFinished }: PreloaderProps) {
  const [animationComplete, setAnimationComplete] = useState(false);

  useEffect(() => {
    // This timer ensures the preloader is visible for a minimum duration
    // and then calls the `onFinished` callback to unmount itself and show the app.
    const timer = setTimeout(() => {
      setAnimationComplete(true);
    }, 3000); // Minimum display time: 3 seconds

    return () => clearTimeout(timer);
  }, []);

  const handleAnimationComplete = () => {
    // This function is called by Framer Motion when the exit animation finishes.
    if (animationComplete) {
      onFinished();
    }
  };
  
  // We trigger the exit animation when the loading logic is complete.
  const exitAnimation = animationComplete ? 'exit' : 'animate';

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background overflow-hidden"
      initial="initial"
      animate={exitAnimation}
      onAnimationComplete={handleAnimationComplete}
    >
      <motion.div 
        className="absolute z-20"
        variants={logoVariants}
      >
        <Logo iconSize={40} />
      </motion.div>
      <motion.div
        className="flex h-full w-full"
        variants={containerVariants}
        initial="initial"
        animate={exitAnimation}
      >
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className={cn(
              "h-full w-full",
              i % 2 === 0 ? "bg-card" : "bg-background" // Alternating panel colors for effect
            )}
            style={{
                backgroundColor: 'hsl(var(--primary))',
                opacity: 1 - (i * 0.15)
            }}
            variants={panelVariants}
          />
        ))}
      </motion.div>
    </motion.div>
  );
}
