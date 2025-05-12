
import Link from 'next/link';
import Image from 'next/image';
import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface LogoProps extends HTMLAttributes<HTMLAnchorElement> {
  iconSize?: number; 
}

export default function Logo({ className, iconSize = 27, ...props }: LogoProps) { 
  const imageDimension = iconSize * 2.5; 

  return (
    <Link href="/" className={cn("flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm", className)} {...props}>
      <div style={{ height: `${imageDimension}px`, width: `${imageDimension}px` }} className="relative">
        <Image
          src="https://i.ibb.co/hR11k6Kw/Picsart-25-05-10-11-50-50-504.png" 
          alt="Qentai Logo"
          fill
          style={{ objectFit: 'contain' }} 
          sizes={`${imageDimension}px`} // Added sizes prop
          priority 
        />
      </div>
    </Link>
  );
}

