
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { searchAnimes } from '@/services/animeService';
import type { Anime } from '@/types/anime';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog'; // DialogClose might not be needed if Esc works
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Kbd } from '@/components/ui/kbd'; // Assuming Kbd component from previous request or will create one
import { Loader2, Search, Star, Tv, Film, ListVideo as ListVideoIcon, Info } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface LiveSearchDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function LiveSearchDialog({ isOpen, onOpenChange }: LiveSearchDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Anime[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const inputRef = useRef<HTMLInputElement>(null);

  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setIsLoading(false);
      setError(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      // Fetch a small number of results for the dropdown, e.g., 5-7
      const results = await searchAnimes(query, 7);
      setSearchResults(results);
    } catch (err) {
      console.error('Live search failed:', err);
      setError('Failed to fetch search results.');
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    performSearch(debouncedSearchQuery);
  }, [debouncedSearchQuery, performSearch]);

  useEffect(() => {
    if (isOpen) {
      // Focus input when dialog opens
      setTimeout(() => inputRef.current?.focus(), 100);
      // Reset search query when dialog opens
      setSearchQuery('');
      setSearchResults([]);
      setError(null);
    }
  }, [isOpen]);
  
  const getEpisodeText = (anime: Anime) => {
    if (anime.type === 'Movie') return 'Movie';
    return `Episodes - ${anime.episodesCount || anime.episodes?.length || 'N/A'}`;
  };

  const typeIconMap: Record<string, React.ElementType> = {
    TV: Tv,
    Movie: Film,
    OVA: ListVideoIcon,
    Special: ListVideoIcon,
    ONA: ListVideoIcon,
    Default: Info,
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent 
        className="bg-popover/90 backdrop-blur-sm p-0 w-[90vw] max-w-xl rounded-xl border-border shadow-2xl top-[20%] sm:top-1/4 translate-y-0 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
        onOpenAutoFocus={(e) => e.preventDefault()} // Prevent auto-focus on first element, let inputRef handle it
      >
        <DialogHeader className="p-0 m-0 h-0 overflow-hidden"> {/* Contain title but keep it hidden */}
          <DialogTitle className="sr-only">Search Anime</DialogTitle>
        </DialogHeader>
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-center text-xs text-muted-foreground mb-1">
            For quick access:
            <Kbd className="ml-1.5">CTRL</Kbd>
            <span className="mx-1">+</span>
            <Kbd>S</Kbd>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              ref={inputRef}
              type="search"
              placeholder="Search anime..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 h-12 text-base bg-background/70 border-border/50 focus:border-primary rounded-lg"
              aria-label="Search anime"
            />
          </div>
        </div>

        {isLoading && (
          <div className="live-search-loader p-6 text-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
          </div>
        )}

        {!isLoading && error && (
          <div className="live-search-no-results p-6 text-center text-destructive">
            {error}
          </div>
        )}

        {!isLoading && !error && debouncedSearchQuery && searchResults.length === 0 && (
          <div className="live-search-no-results p-6 text-center text-muted-foreground">
            No results found for &quot;{debouncedSearchQuery}&quot;.
          </div>
        )}

        {!isLoading && !error && searchResults.length > 0 && (
          <ScrollArea className="max-h-[calc(100vh-200px-10rem)] sm:max-h-[50vh]">
            <div className="py-2 px-2 space-y-1">
              {searchResults.map((anime) => {
                const IconComponent = typeIconMap[anime.type || 'Default'] || typeIconMap['Default'];
                return (
                  <Link
                    key={anime.id}
                    href={`/anime/${anime.id}`}
                    className="live-search-item block rounded-md"
                    onClick={() => onOpenChange(false)} // Close dialog on item click
                  >
                    <div className="flex items-center gap-3 p-2.5 hover:bg-accent transition-colors cursor-pointer rounded-md">
                      <Image
                        src={anime.coverImage || `https://placehold.co/60x90.png`}
                        alt={anime.title}
                        width={48} // Adjusted for slightly smaller display
                        height={72}
                        className="live-search-item-image !w-12 !h-[72px] bg-card"
                        data-ai-hint="anime poster"
                      />
                      <div className="live-search-item-details">
                        <h3 className="live-search-item-title text-foreground">{anime.title}</h3>
                        <p className="text-xs text-muted-foreground">{getEpisodeText(anime)}</p>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                          {anime.averageRating !== undefined && anime.averageRating !== null && (
                            <span className="flex items-center"><Star className="w-3 h-3 mr-0.5 text-yellow-400 fill-yellow-400" /> {anime.averageRating.toFixed(1)}</span>
                          )}
                          {anime.type && <span className="flex items-center"><IconComponent className="w-3 h-3 mr-0.5" /> {anime.type}</span>}
                          {anime.year && <span>• {anime.year}</span>}
                          {anime.status && <Badge variant="outline" className="text-[0.65rem] px-1 py-0 ml-1 capitalize">{anime.status}</Badge>}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
