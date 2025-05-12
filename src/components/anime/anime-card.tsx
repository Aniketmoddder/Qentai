// src/components/anime/anime-card.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { Anime } from '@/types/anime';
import { Badge } from '@/components/ui/badge';
import { PlayCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnimeCardProps {
  anime: Anime;
  className?: string;
  sizeVariant?: 'small' | 'carousel'; // New prop: 'small' for vertical lists, 'carousel' for carousels
}

export default function AnimeCard({ anime, className, sizeVariant = 'carousel' }: AnimeCardProps) {
  const placeholderCover = `https://picsum.photos/seed/${anime.id}/300/450`; // Slightly larger placeholder

  const getEpisodeBadgeText = () => {
    if (anime.type === 'Movie') {
      return 'Movie';
    }
    const count = anime.episodesCount && anime.episodesCount > 0
                  ? anime.episodesCount
                  : (anime.episodes && anime.episodes.length > 0 ? anime.episodes.length : 0);

    if (count > 0) {
      return `Ep ${count}`;
    }
    return null;
  };

  const episodeBadgeText = getEpisodeBadgeText();
  const firstEpisodeId = anime.episodes?.[0]?.id || '';

  return (
    <Link
      href={`/anime/${anime.id}`}
      className={cn(
        "group block cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-lg overflow-hidden",
        sizeVariant === 'small' ? "w-[120px]" : "w-[140px]", // Apply width based on variant
        className
      )}
      aria-label={`View details for ${anime.title}`}
    >
      <div
        className={cn(
          "flex flex-col h-full", 
          "bg-card border border-border/20 shadow-md group-hover:shadow-primary/30 transition-all duration-300 ease-in-out rounded-lg overflow-hidden",
          "transform group-hover:scale-105" // Modern hover: slight scale up
        )}
      >
        <div
          className={cn(
            "relative w-full aspect-[2/3]", // Height determined by width and aspect ratio
            "bg-muted overflow-hidden rounded-t-lg"
          )}
          data-ai-hint={`${anime.genre?.[0] || 'anime'} portrait poster`}
        >
          <Image
            src={anime.coverImage || placeholderCover}
            alt={anime.title}
            fill
            sizes={sizeVariant === 'small' ? "120px" : "140px"}
            className="object-cover" 
            priority={false}
          />
          {episodeBadgeText && (
            <div className="absolute top-1.5 right-1.5 z-10">
              <Badge
                variant="secondary"
                className="bg-black/70 text-white text-[0.6rem] px-1.5 py-0.5 border-transparent font-semibold backdrop-blur-sm"
              >
                {episodeBadgeText}
              </Badge>
            </div>
          )}
          {/* Removed Play icon to make the whole card link to details page */}
        </div>
        <div className="p-2 text-center mt-auto">
          <p
            className="text-xs sm:text-sm font-medium text-foreground group-hover:text-primary transition-colors duration-200 truncate"
            title={anime.title}
          >
            {anime.title}
          </p>
        </div>
      </div>
    </Link>
  );
}
