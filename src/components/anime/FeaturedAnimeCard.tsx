
// src/components/anime/FeaturedAnimeCard.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { Anime } from '@/types/anime';
import { Button } from '@/components/ui/button';
import { Play } from 'lucide-react';

interface FeaturedAnimeCardProps {
  anime: Anime;
}

export default function FeaturedAnimeCard({ anime }: FeaturedAnimeCardProps) {
  const firstEpisodeId = anime.episodes?.[0]?.id || '';
  const placeholderBanner = `https://picsum.photos/seed/${anime.id}-featured/800/450`;

  return (
    <div className="group relative rounded-xl overflow-hidden shadow-xl aspect-[16/10] sm:aspect-[16/9] bg-card hover:shadow-primary/30 transition-all duration-300">
      <Link href={`/anime/${anime.id}`} passHref legacyBehavior>
        <a className="block w-full h-full">
          <Image
            src={anime.bannerImage || anime.coverImage || placeholderBanner}
            alt={anime.title}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover transition-transform duration-500 ease-in-out group-hover:scale-105"
            data-ai-hint={`${anime.genre?.[0] || 'anime'} landscape`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent group-hover:from-black/80 group-hover:via-black/50 transition-opacity duration-300" />
        </a>
      </Link>

      <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 text-white z-10">
        <Link href={`/anime/${anime.id}`} passHref legacyBehavior>
          <a className="block">
            <h3 className="text-lg md:text-xl lg:text-2xl font-bold mb-1.5 line-clamp-2 group-hover:text-primary transition-colors">
              {anime.title}
            </h3>
          </a>
        </Link>
        <p className="text-xs md:text-sm text-muted-foreground/90 line-clamp-2 mb-3">
          {anime.synopsis}
        </p>
        <Button asChild size="sm" className="btn-primary-gradient rounded-full px-5 py-2.5 text-xs md:text-sm font-semibold group-hover:scale-105 transform transition-transform duration-200">
          <Link href={`/play/${anime.id}${firstEpisodeId ? `?episode=${firstEpisodeId}` : ''}`} onClick={(e) => e.stopPropagation()}>
            <Play className="mr-1.5 h-4 w-4" /> View More
          </Link>
        </Button>
      </div>
    </div>
  );
}
