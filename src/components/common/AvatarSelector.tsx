
'use client';

import { CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface AvatarSelectorProps {
  currentAvatarUrl?: string | null;
  onAvatarSelect: (url: string) => void;
  title?: string;
  sectionTitle?: string;
}

const AVATAR_BASE_URL = 'https://ik.imagekit.io/aniplay123/profile/';
const AVATAR_COUNT = 12; // m1 to m12

// Generates URLs like https://ik.imagekit.io/aniplay123/profile/m1, .../m2, etc.
const avatarUrls = Array.from({ length: AVATAR_COUNT }, (_, i) => `${AVATAR_BASE_URL}m${i + 1}`);

export default function AvatarSelector({
  currentAvatarUrl,
  onAvatarSelect,
  title = "Select Avatar",
  sectionTitle = "Characters"
}: AvatarSelectorProps) {
  return (
    <div className="space-y-4 my-4">
      {title && <h3 className="text-lg font-medium text-foreground">{title}</h3>}
      {sectionTitle && <p className="text-sm text-muted-foreground -mt-2 mb-3">{sectionTitle}</p>}
      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3 sm:gap-4">
        {avatarUrls.map((url, index) => {
          const fileName = `m${index + 1}`;
          const altText = `Avatar option ${fileName}`;

          return (
            <button
              type="button"
              key={url}
              onClick={() => onAvatarSelect(url)}
              className={cn(
                "relative aspect-square rounded-full overflow-hidden border-2 transition-all duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                currentAvatarUrl === url ? 'border-primary scale-105 shadow-lg' : 'border-transparent hover:border-primary/50 hover:scale-105'
              )}
              aria-label={altText}
            >
              <Image
                src={url} // Direct URL without .png
                alt={altText}
                fill
                sizes="(max-width: 768px) 20vw, 100px" // Adjusted sizes prop
                style={{ objectFit: 'cover' }}
                data-ai-hint="anime character avatar"
                priority={index < 4} // Eager load first few images
                unoptimized // Use this if Next.js optimizer still causes issues with extensionless URLs
              />
              {currentAvatarUrl === url && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

