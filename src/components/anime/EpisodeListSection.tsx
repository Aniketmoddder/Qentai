// src/components/anime/EpisodeListSection.tsx
'use client';

import React, { useState, useMemo } from 'react';
import type { Anime, Episode } from '@/types/anime';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Info, ArrowUpDown, Settings2, LayoutGrid, List as ListIcon, PlayCircle, GripVertical, DownloadCloud, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface EpisodeListSectionProps {
  anime: Anime;
}

type ViewMode = 'detailed' | 'simple';
type SortOrder = 'asc' | 'desc';

export default function EpisodeListSection({ anime }: EpisodeListSectionProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('detailed');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [isInfoDialogOpen, setIsInfoDialogOpen] = useState(false);
  const { toast } = useToast();

  const sortedEpisodes = useMemo(() => {
    if (!anime.episodes || anime.episodes.length === 0) {
      return [];
    }
    const sorted = [...anime.episodes].sort((a, b) => {
      if ((a.seasonNumber || 1) !== (b.seasonNumber || 1)) {
        return (a.seasonNumber || 1) - (b.seasonNumber || 1);
      }
      return (a.episodeNumber || 0) - (b.episodeNumber || 0);
    });

    if (sortOrder === 'desc') {
      return sorted.reverse();
    }
    return sorted;
  }, [anime.episodes, sortOrder]);

  const handleToggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };
  
  const handleDownloadClick = () => {
    if (anime.downloadPageUrl) {
      window.open(anime.downloadPageUrl, '_blank');
    } else {
      toast({
        variant: 'default',
        title: 'No Download Link',
        description: 'A download page URL has not been set for this anime.',
      });
    }
  };

  if (!anime.episodes || anime.episodes.length === 0) {
    return (
      <div className="mt-8 py-6 text-center text-muted-foreground bg-card/30 rounded-lg">
        No episodes available for this title yet.
      </div>
    );
  }

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <span className="w-1 h-6 bg-primary rounded-full mr-3"></span>
          <h3 className="text-xl font-semibold text-foreground font-orbitron">Episodes</h3>
          
          <Dialog open={isInfoDialogOpen} onOpenChange={setIsInfoDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="ml-2 text-muted-foreground hover:text-primary w-7 h-7">
                <Info size={16} />
                <span className="sr-only">Episode info/report</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-card border-border">
              <DialogHeader>
                <DialogTitle className="text-primary flex items-center">
                  <AlertCircle className="w-5 h-5 mr-2"/> Episode Issue Reporting
                </DialogTitle>
                <DialogDescription className="text-muted-foreground pt-2">
                  This feature is to report issues with episode links (e.g., not working, wrong episode). 
                  For now, if you encounter a problem, please try again later. Full reporting functionality is coming soon!
                </DialogDescription>
              </DialogHeader>
              <DialogClose asChild>
                <Button type="button" variant="outline" className="mt-4">
                  Got it
                </Button>
              </DialogClose>
            </DialogContent>
          </Dialog>

        </div>
        <div className="flex items-center space-x-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-muted-foreground hover:text-primary w-8 h-8"
            onClick={handleDownloadClick}
            title={anime.downloadPageUrl ? "Go to Download Page" : "No Download Link Available"}
          >
            <DownloadCloud size={18} />
            <span className="sr-only">Download options</span>
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-muted-foreground hover:text-primary w-8 h-8"
            onClick={handleToggleSortOrder}
            title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
            >
            <ArrowUpDown size={18} />
            <span className="sr-only">Sort episodes</span>
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary w-8 h-8" onClick={() => toast({title: "Episode Settings", description: "Settings coming soon!"})}>
            <Settings2 size={18} />
            <span className="sr-only">Episode settings</span>
          </Button>
        </div>
      </div>

      <div className="relative">
        <ScrollArea
            className={cn(
                "rounded-lg border border-border/30 bg-card/50 shadow-inner", 
                viewMode === 'detailed' ? "max-h-[55vh] sm:max-h-[60vh]" : "max-h-[45vh] sm:max-h-[50vh]" 
            )}
            style={{ overflowY: 'auto' }} // Ensure vertical scroll is explicitly allowed
        >
          <div className={cn("p-3 sm:p-4 space-y-2", viewMode === 'simple' && 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2')}>
            {sortedEpisodes.map((episode) => (
              viewMode === 'detailed' ? (
                <DetailedEpisodeItem key={episode.id} episode={episode} animeId={anime.id} />
              ) : (
                <SimpleEpisodeItem key={episode.id} episode={episode} animeId={anime.id} />
              )
            ))}
          </div>
        </ScrollArea>
        <Button
          variant="default"
          size="icon"
          onClick={() => setViewMode(prev => prev === 'detailed' ? 'simple' : 'detailed')}
          className="absolute bottom-4 right-4 bg-primary text-primary-foreground rounded-full w-10 h-10 shadow-lg hover:bg-primary/90 z-10"
          aria-label={viewMode === 'detailed' ? "Switch to simple view" : "Switch to detailed view"}
        >
          {viewMode === 'detailed' ? <ListIcon size={20} /> : <LayoutGrid size={20} />}
        </Button>
      </div>
    </section>
  );
}

interface EpisodeItemProps {
  episode: Episode;
  animeId: string;
}

const DetailedEpisodeItem: React.FC<EpisodeItemProps> = ({ episode, animeId }) => {
  const placeholderThumbnail = `https://picsum.photos/seed/${animeId}-${episode.id}/320/180`;
  return (
    <Link
      href={`/play/${animeId}?episode=${episode.id}`}
      className="group flex items-center p-2.5 bg-card hover:bg-primary/10 rounded-lg shadow-sm transition-all duration-200 ease-in-out border border-transparent hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-background"
    >
        <div className="relative w-28 h-16 sm:w-32 sm:h-[72px] rounded-md overflow-hidden flex-shrink-0 border border-border/20 bg-muted/50">
            <Image
            src={episode.thumbnail || placeholderThumbnail}
            alt={`Episode ${episode.episodeNumber}: ${episode.title}`}
            fill
            sizes="(max-width: 640px) 112px, 128px"
            className="object-cover"
            data-ai-hint="anime episode thumbnail"
            />
            <Badge className="absolute bottom-1 left-1 bg-black/70 text-white text-[0.65rem] px-1.5 py-0.5 pointer-events-none">
            EP {episode.episodeNumber}
            </Badge>
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <PlayCircle className="w-8 h-8 text-white/90" />
            </div>
        </div>
        <div className="ml-3 sm:ml-4 flex-grow min-w-0">
            <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate" title={episode.title}>
            {episode.episodeNumber}. {episode.title}
            </h4>
            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5" title={episode.overview}>
            {episode.overview || 'No overview available.'}
            </p>
        </div>
    </Link>
  );
};

const SimpleEpisodeItem: React.FC<EpisodeItemProps> = ({ episode, animeId }) => {
  return (
    <Link
      href={`/play/${animeId}?episode=${episode.id}`}
      className="group flex items-center p-2.5 bg-card hover:bg-primary/10 rounded-md shadow-sm transition-all duration-200 ease-in-out border border-transparent hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-background"
    >
      <GripVertical className="w-4 h-4 mr-2 text-muted-foreground group-hover:text-primary flex-shrink-0" />
      <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate flex-grow" title={episode.title}>
        Ep {episode.episodeNumber}: {episode.title}
      </span>
      <PlayCircle className="w-5 h-5 ml-2 text-muted-foreground group-hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
    </Link>
  );
};
