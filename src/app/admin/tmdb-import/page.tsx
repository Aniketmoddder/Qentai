
'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { fetchAnimeDetailsFromTMDB } from '@/services/tmdbService';
import { addAnimeToFirestore } from '@/services/animeService';
import type { Anime } from '@/types/anime';
import { Loader2, Film, Tv as TvIcon, DownloadCloud, AlertTriangle, Wand } from 'lucide-react'; 
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { slugify } from '@/lib/stringUtils';

export default function TmdbImportTab() {
  const { toast } = useToast();

  const [tmdbId, setTmdbId] = useState('');
  const [mediaType, setMediaType] = useState<'movie' | 'tv'>('tv');
  const [isLoading, setIsLoading] = useState(false);
  const [fetchedAnime, setFetchedAnime] = useState<Partial<Anime> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFetchTMDB = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tmdbId) {
      setError('Please enter a TMDB ID.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setFetchedAnime(null);
    try {
      const details = await fetchAnimeDetailsFromTMDB(tmdbId, mediaType);
      if (details) {
        setFetchedAnime(details);
        toast({ title: 'Data Fetched', description: `Successfully fetched ${details.title} from TMDB.` });
      } else {
        setError(`Could not find ${mediaType === 'tv' ? 'TV show' : 'movie'} with ID ${tmdbId} on TMDB, or the API key is invalid/missing.`);
        toast({ variant: 'destructive', title: 'Fetch Failed', description: `Could not find content or API issue for ID ${tmdbId}.` });
      }
    } catch (err) {
      console.error('Error fetching from TMDB:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred while fetching from TMDB.';
      setError(errorMessage);
      toast({ variant: 'destructive', title: 'Fetch Error', description: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAnimeToDB = async () => {
    if (!fetchedAnime || !fetchedAnime.title) return;
    setIsLoading(true);
    setError(null);
    try {
      // The ID is generated from title by addAnimeToFirestore service
      const animeDataToAdd: Omit<Anime, 'id' | 'createdAt' | 'updatedAt'> = { 
        tmdbId: fetchedAnime.tmdbId,
        aniListId: fetchedAnime.aniListId || undefined,
        title: fetchedAnime.title,
        coverImage: fetchedAnime.coverImage || `https://picsum.photos/seed/${slugify(fetchedAnime.title)}-cover/300/450`,
        bannerImage: fetchedAnime.bannerImage || undefined, 
        year: fetchedAnime.year || new Date().getFullYear(), 
        genre: fetchedAnime.genre || [], 
        status: fetchedAnime.status || 'Unknown', 
        synopsis: fetchedAnime.synopsis || 'Synopsis not available.', 
        averageRating: fetchedAnime.averageRating, 
        episodes: fetchedAnime.episodes || [], 
        type: fetchedAnime.type || (mediaType === 'tv' ? 'TV' : 'Movie'),
        sourceAdmin: 'tmdb',
        trailerUrl: undefined, 
        isFeatured: false, 
      };
      
      const newAnimeId = await addAnimeToFirestore(animeDataToAdd); // This now returns the slugified ID
      toast({ title: 'Anime Added', description: `${fetchedAnime.title} successfully added to Firestore with ID: ${newAnimeId}.` });
      setFetchedAnime(null);
      setTmdbId('');
    } catch (err) {
      console.error('Error adding anime to Firestore:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred while saving to Firestore.';
      setError(errorMessage);
      toast({ variant: 'destructive', title: 'Save Error', description: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-lg border-border/40">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-semibold text-primary flex items-center">
          <DownloadCloud className="w-6 h-6 mr-2" /> Import from TMDB
        </CardTitle>
        <CardDescription>
          Fetch anime or movie details from The Movie Database and add them to Qentai.
          Ensure your TMDB API key is correctly set in the environment variables. AniList ID may be auto-fetched if a match is found.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleFetchTMDB} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-4 items-end">
            <div className="space-y-1.5">
              <Label htmlFor="tmdbId" className="font-medium">TMDB ID</Label>
              <Input
                id="tmdbId"
                type="text"
                value={tmdbId}
                onChange={(e) => setTmdbId(e.target.value)}
                placeholder="e.g., 1396 (for TV) or 603 (for Movie)"
                className="bg-input border-border/70 focus:border-primary"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mediaType" className="font-medium">Media Type</Label>
              <Select value={mediaType} onValueChange={(value) => setMediaType(value as 'movie' | 'tv')}>
                <SelectTrigger id="mediaType" className="bg-input border-border/70 focus:border-primary">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tv"><div className="flex items-center"><TvIcon className="mr-2 h-4 w-4"/> TV Show</div></SelectItem>
                  <SelectItem value="movie"><div className="flex items-center"><Film className="mr-2 h-4 w-4"/> Movie</div></SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={isLoading} className="w-full md:w-auto btn-primary-gradient text-sm py-2.5">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Fetch Data'}
            </Button>
          </div>
          {error && (
            <div className="mt-3 p-3 bg-destructive/10 border border-destructive/30 rounded-md text-destructive text-sm flex items-start">
              <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </form>

        {fetchedAnime && (
          <div className="mt-8 border-t border-border/50 pt-6">
            <h3 className="text-lg font-semibold mb-4 text-foreground">Confirm Details: {fetchedAnime.title}</h3>
            <div className="md:flex md:space-x-6">
              {fetchedAnime.coverImage && (
                <div className="w-full md:w-1/3 lg:w-1/4 mb-4 md:mb-0">
                   <Image 
                    src={fetchedAnime.coverImage} 
                    alt={fetchedAnime.title || 'Cover'} 
                    width={250} 
                    height={375} 
                    className="rounded-lg object-cover mx-auto md:mx-0 shadow-xl border border-border/20"
                    data-ai-hint="anime movie poster" 
                    />
                </div>
              )}
              <div className="md:w-2/3 lg:w-3/4 space-y-2 text-sm">
                <p><span className="font-semibold text-muted-foreground">Year:</span> {fetchedAnime.year}</p>
                <p><span className="font-semibold text-muted-foreground">Type:</span> {fetchedAnime.type}</p>
                <p><span className="font-semibold text-muted-foreground">Status:</span> <Badge variant={fetchedAnime.status === 'Completed' ? 'default' : 'secondary'}>{fetchedAnime.status}</Badge></p>
                <p><span className="font-semibold text-muted-foreground">TMDB Rating:</span> {fetchedAnime.averageRating ? fetchedAnime.averageRating.toFixed(1) : 'N/A'}</p>
                {fetchedAnime.aniListId && <p><span className="font-semibold text-muted-foreground flex items-center"><Wand size={14} className="mr-1"/>AniList ID:</span> {fetchedAnime.aniListId}</p>}
                <div className="flex flex-wrap gap-1.5 items-center">
                  <span className="font-semibold text-muted-foreground">Genres:</span>
                  {fetchedAnime.genre?.map(g => <Badge key={g} variant="outline" className="text-xs">{g}</Badge>)}
                </div>
                <p className="text-muted-foreground mt-1"><span className="font-semibold text-foreground">Synopsis:</span> {fetchedAnime.synopsis}</p>
                {fetchedAnime.type === 'TV' && fetchedAnime.episodes && (
                  <p><span className="font-semibold text-muted-foreground">Episodes Found (TMDB):</span> {fetchedAnime.episodes.length}</p>
                )}
                 {fetchedAnime.type === 'Movie' && (
                  <p className="text-xs text-muted-foreground italic"><span className="font-semibold text-foreground">Note:</span> This is a movie. A single episode entry will be created; video URL needs to be added by an admin.</p>
                )}
              </div>
            </div>
            <Button onClick={handleAddAnimeToDB} disabled={isLoading} className="w-full mt-6 btn-primary-gradient text-base py-3">
              {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : `Add "${fetchedAnime.title}" to Qentai DB`}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
