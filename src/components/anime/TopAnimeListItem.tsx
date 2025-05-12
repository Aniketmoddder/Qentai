// src/components/anime/TopAnimeListItem.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { Anime } from '@/types/anime';
import { Badge } from '@/components/ui/badge';
import { Tv, Film, ListVideo, CheckCircle2, Clock3, TrendingUp } from 'lucide-react'; // Changed icons
import { cn } from '@/lib/utils';

interface TopAnimeListItemProps {
  anime: Anime;
  rank: number;
}

export default function TopAnimeListItem({ anime, rank }: TopAnimeListItemProps) {
  const rankColors = [
    'bg-pink-500/80', 
    'bg-orange-500/80', 
    'bg-green-500/80', 
    'bg-purple-500/70', 
    'bg-blue-500/70', 
  ];
  const rankColor = rankColors[rank - 1] || 'bg-muted/50';

  const typeIcon = () => {
    switch (anime.type) {
      case 'TV': return <Tv className="w-3 h-3" />;
      case 'Movie': return <Film className="w-3 h-3" />;
      case 'OVA':
      case 'Special': return <ListVideo className="w-3 h-3" />;
      default: return <Tv className="w-3 h-3" />;
    }
  };
  
  const statusIcon = () => {
    switch(anime.status) {
        case 'Completed': return <CheckCircle2 className="w-3 h-3 text-green-400"/>; // Changed to CheckCircle2
        case 'Ongoing': return <Clock3 className="w-3 h-3 text-sky-400"/>; // Changed to Clock3
        case 'Upcoming': return <TrendingUp className="w-3 h-3 text-amber-400"/>;
        default: return null;
    }
  }

  return (
    <Link 
        href={`/anime/${anime.id}`} 
        className="group flex items-center p-3 bg-card hover:bg-card/70 rounded-lg shadow-sm transition-all duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-background"
        aria-label={`View details for ${anime.title}`}
    >
      <div className={cn(
          `flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-md text-primary-foreground flex items-center justify-center text-lg md:text-xl font-bold mr-3 md:mr-4 shadow-md`,
          rankColor
        )}>
        {rank}
      </div>
      <div className="flex-shrink-0 w-16 h-24 md:w-20 md:h-[120px] relative rounded-md overflow-hidden border border-border/20">
        <Image
          src={anime.coverImage || `https://picsum.photos/seed/${anime.id}-toplist/200/300`}
          alt={anime.title}
          fill
          sizes="(max-width: 768px) 64px, 80px"
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          data-ai-hint={`${anime.genre?.[0] || 'anime'} portrait`}
        />
      </div>
      <div className="flex-grow ml-3 md:ml-4 min-w-0">
        <h3 className="text-sm md:text-base font-semibold text-foreground group-hover:text-primary transition-colors truncate" title={anime.title}>
          {anime.title}
        </h3>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">{typeIcon()} {anime.type || 'N/A'}</span>
          <span className="hidden sm:inline">•</span>
          <span className="flex items-center gap-1">{statusIcon()} {anime.status}</span>
          {anime.episodesCount && anime.episodesCount > 0 && (
              <>
                  <span className="hidden sm:inline">•</span>
                  <span>{anime.episodesCount} Ep</span>
              </>
          )}
        </div>
         <div className="mt-1.5 flex flex-wrap gap-1">
          {anime.genre?.slice(0, 2).map(g => (
            <Badge key={g} variant="outline" className="text-[0.65rem] px-1.5 py-0.5 border-border/50 text-muted-foreground group-hover:border-primary/30 group-hover:text-primary/80">
              {g}
            </Badge>
          ))}
        </div>
      </div>
      <div className="ml-auto text-right flex-shrink-0 hidden sm:block">
        <Badge variant="secondary" className="text-xs bg-primary/10 text-primary font-medium">
          {anime.averageRating ? `SCORE ${anime.averageRating.toFixed(1)}` : 'N/A'}
        </Badge>
      </div>
    </Link>
  );
}
