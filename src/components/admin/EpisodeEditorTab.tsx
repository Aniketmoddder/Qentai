'use client';

import React, { useEffect, useState } from 'react';
import { getAllAnimes, updateAnimeEpisode } from '@/services/animeService';
import type { Anime, Episode } from '@/types/anime';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Save, AlertCircle, Video, Edit3 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

export default function EpisodeEditorTab() {
  const [allAnimes, setAllAnimes] = useState<Anime[]>([]);
  const [selectedAnime, setSelectedAnime] = useState<Anime | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [isLoadingAnimes, setIsLoadingAnimes] = useState(true);
  const [savingEpisodeId, setSavingEpisodeId] = useState<string | null>(null); // Track which episode is saving
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchAllAnimes = async () => {
      setIsLoadingAnimes(true);
      setError(null);
      try {
        const animes = await getAllAnimes({count: 300, filters: {}}); 
        setAllAnimes(animes.sort((a, b) => a.title.localeCompare(b.title)));
      } catch (err) {
        console.error('Failed to fetch animes for editor:', err);
        setError('Could not load anime list.');
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to load anime list for editor.' });
      } finally {
        setIsLoadingAnimes(false);
      }
    };
    fetchAllAnimes();
  }, [toast]);

  const handleAnimeSelect = (animeId: string) => {
    setError(null);
    const anime = allAnimes.find(a => a.id === animeId);
    if (anime) {
      setSelectedAnime(anime);
      // Sort episodes by season then episode number
      const sortedEpisodes = (anime.episodes || []).sort((a, b) => {
        if ((a.seasonNumber || 0) !== (b.seasonNumber || 0)) {
          return (a.seasonNumber || 0) - (b.seasonNumber || 0);
        }
        return (a.episodeNumber || 0) - (b.episodeNumber || 0);
      });
      setEpisodes(sortedEpisodes);
    } else {
      setSelectedAnime(null);
      setEpisodes([]);
    }
  };

  const handleEpisodeFieldChange = (episodeId: string, field: keyof Episode, value: string | number) => {
    setEpisodes(prevEpisodes =>
      prevEpisodes.map(ep =>
        ep.id === episodeId ? { ...ep, [field]: value } : ep
      )
    );
  };

  const handleSaveEpisode = async (episode: Episode) => {
    if (!selectedAnime) {
      toast({ variant: 'destructive', title: 'Error', description: 'No anime selected.' });
      return;
    }
    // Validate URL for non-movie types if it's empty
    if (selectedAnime.type !== 'Movie' && (!episode.url || episode.url.trim() === '')) {
      // toast({ variant: 'destructive', title: 'Validation Error', description: 'Video URL is required for TV episodes, OVAs, and Specials.' });
      // return; // Allow saving even if URL is empty, admin might add later.
    }


    setSavingEpisodeId(episode.id);
    try {
      const updatePayload: Partial<Episode> = {
        url: episode.url || undefined, // Ensure empty string becomes undefined
        title: episode.title,
        thumbnail: episode.thumbnail || undefined,
        duration: episode.duration || undefined,
        overview: episode.overview || undefined,
        // episodeNumber and seasonNumber are generally not changed post-creation via this UI
      };

      await updateAnimeEpisode(selectedAnime.id, episode.id, updatePayload);
      toast({ title: 'Episode Updated', description: `${selectedAnime.title} - Ep ${episode.episodeNumber} saved.` });
      
      // Update local state for selectedAnime to reflect changes for immediate UI update
      setSelectedAnime(prev => {
        if (!prev) return null;
        const updatedEpisodes = prev.episodes?.map(e => e.id === episode.id ? {...e, ...updatePayload} : e) || [];
        return {
          ...prev,
          episodes: updatedEpisodes.sort((a, b) => { // Re-sort after update
            if ((a.seasonNumber || 0) !== (b.seasonNumber || 0)) {
              return (a.seasonNumber || 0) - (b.seasonNumber || 0);
            }
            return (a.episodeNumber || 0) - (b.episodeNumber || 0);
          }),
        };
      });
      // Also update the episodes list state
      setEpisodes(prevEpisodes => {
          const updatedList = prevEpisodes.map(e => e.id === episode.id ? {...e, ...updatePayload} : e);
          return updatedList.sort((a, b) => { // Re-sort after update
            if ((a.seasonNumber || 0) !== (b.seasonNumber || 0)) {
              return (a.seasonNumber || 0) - (b.seasonNumber || 0);
            }
            return (a.episodeNumber || 0) - (b.episodeNumber || 0);
          });
      });


    } catch (err) {
      console.error('Failed to save episode:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      toast({ variant: 'destructive', title: 'Save Error', description: `Failed to save episode: ${errorMessage}` });
    } finally {
      setSavingEpisodeId(null);
    }
  };

  return (
    <Card className="shadow-lg border-border/40">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-semibold text-primary flex items-center">
          <Edit3 className="w-6 h-6 mr-2" /> Episode Editor
        </CardTitle>
        <CardDescription>Select an anime to view and edit its episode details like video URLs, titles, and thumbnails.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <Label htmlFor="anime-select" className="font-medium">Select Anime/Movie</Label>
          <Select
            onValueChange={handleAnimeSelect}
            disabled={isLoadingAnimes || allAnimes.length === 0}
          >
            <SelectTrigger id="anime-select" className="bg-input border-border/70 focus:border-primary">
              <SelectValue placeholder={isLoadingAnimes ? "Loading animes..." : "Select an anime/movie"} />
            </SelectTrigger>
            <SelectContent>
              {allAnimes.length > 0 ? (
                allAnimes.map(anime => (
                  <SelectItem key={anime.id} value={anime.id}>
                    {anime.title} ({anime.year}) <Badge variant="outline" className="ml-2 text-xs">{anime.type}</Badge>
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="no-anime" disabled>
                  {isLoadingAnimes ? "Loading..." : "No animes found"}
                </SelectItem>
              )}
            </SelectContent>
          </Select>
          {isLoadingAnimes && <Loader2 className="mt-2 h-4 w-4 animate-spin text-primary" />}
        </div>

        {error && <p className="text-destructive mb-4 p-3 bg-destructive/10 rounded-md flex items-center"><AlertCircle className="inline mr-2 h-5 w-5" />{error}</p>}

        {selectedAnime && (
          <div>
            <h3 className="text-lg font-semibold mb-4 text-foreground">
              Episodes for: <span className="text-primary">{selectedAnime.title}</span>
            </h3>
            {episodes.length === 0 ? (
              <p className="text-muted-foreground p-4 bg-muted/30 rounded-md text-center">
                {selectedAnime.type === 'Movie' ? 'This is a Movie. Manage its main video URL below if applicable. If no "episode" form appears, add one manually via "Manual Add" for this Movie ID and set its type to Movie.' : 'No episodes found for this series. You can add them via Manual Add or TMDB import.'}
              </p>
            ) : (
              <ScrollArea className="h-[500px] pr-3 -mr-3 border border-border/30 rounded-lg p-1">
                <div className="space-y-3 p-3">
                  {episodes.map((episode) => (
                    <Card key={episode.id} className="p-3 sm:p-4 bg-card/80 border-border/50 shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-medium text-foreground text-sm">
                         S{episode.seasonNumber || 1} Ep{episode.episodeNumber || 1}: {selectedAnime.type === 'Movie' ? "Movie File" : episode.title}
                        </p>
                         <Badge variant="outline" className="text-xs">{episode.duration || 'N/A'}</Badge>
                      </div>
                      
                      <div className="space-y-2.5">
                        {selectedAnime.type !== 'Movie' && (
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <div>
                                <Label htmlFor={`ep-title-${episode.id}`} className="text-xs">Episode Title</Label>
                                <Input id={`ep-title-${episode.id}`} type="text" placeholder="Episode title" value={episode.title || ''} onChange={(e) => handleEpisodeFieldChange(episode.id, 'title', e.target.value)} className="bg-input h-9 text-sm" />
                            </div>
                            <div>
                                <Label htmlFor={`ep-duration-${episode.id}`} className="text-xs">Duration (e.g., 24min)</Label>
                                <Input id={`ep-duration-${episode.id}`} type="text" placeholder="e.g., 24min" value={episode.duration || ''} onChange={(e) => handleEpisodeFieldChange(episode.id, 'duration', e.target.value)} className="bg-input h-9 text-sm" />
                            </div>
                           </div>
                        )}
                        <div>
                            <Label htmlFor={`ep-url-${episode.id}`} className="text-xs">Video URL (.mp4, .m3u8)</Label>
                            <Input id={`ep-url-${episode.id}`} type="url" placeholder="https://example.com/video.mp4" value={episode.url || ''} onChange={(e) => handleEpisodeFieldChange(episode.id, 'url', e.target.value)} className="bg-input h-9 text-sm" />
                        </div>
                        <div>
                            <Label htmlFor={`ep-thumb-${episode.id}`} className="text-xs">Thumbnail URL (Optional)</Label>
                            <Input id={`ep-thumb-${episode.id}`} type="url" placeholder="https://example.com/thumb.jpg" value={episode.thumbnail || ''} onChange={(e) => handleEpisodeFieldChange(episode.id, 'thumbnail', e.target.value)} className="bg-input h-9 text-sm" />
                        </div>
                        {selectedAnime.type !== 'Movie' && (
                            <div>
                                <Label htmlFor={`ep-overview-${episode.id}`} className="text-xs">Overview (Optional)</Label>
                                <Input id={`ep-overview-${episode.id}`} type="text" placeholder="Short summary..." value={episode.overview || ''} onChange={(e) => handleEpisodeFieldChange(episode.id, 'overview', e.target.value)} className="bg-input h-9 text-sm" />
                            </div>
                        )}
                        <Button
                          onClick={() => handleSaveEpisode(episode)}
                          disabled={savingEpisodeId === episode.id}
                          size="sm"
                          className="w-full sm:w-auto mt-2 text-xs py-2"
                        >
                          {savingEpisodeId === episode.id ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-1.5 h-3.5 w-3.5" />}
                          Save Changes
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
