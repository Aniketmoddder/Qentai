"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import type { Anime, Episode } from "@/types/anime";
import { getAnimeById } from '@/services/animeService'; 
import Container from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { AlertTriangle, MessageSquareWarning, Loader2, List, Star, PlayCircleIcon } from "lucide-react";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

// Vidstack imports
import { MediaPlayer, MediaProvider } from '@vidstack/react';
import type { MediaPlayerInstance, MediaSrc, MediaErrorDetail } from '@vidstack/react';
import { DefaultVideoLayout, defaultLayoutIcons } from '@vidstack/react/player/layouts/default';


export default function PlayerPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const animeId = params.animeId as string;

  const [anime, setAnime] = useState<Anime | null>(null);
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
  const [pageIsLoading, setPageIsLoading] = useState(true);
  const [playerError, setPlayerError] = useState<string | null>(null);
  
  const playerRef = useRef<MediaPlayerInstance | null>(null); 

  useEffect(() => {
    const fetchDetails = async () => {
      if (!animeId) {
        setPlayerError("Anime ID is missing.");
        setPageIsLoading(false);
        return;
      }

      setPageIsLoading(true);
      setPlayerError(null);
      try {
        const details = await getAnimeById(animeId);
        if (details) {
          setAnime(details);
          const epId = searchParams.get("episode");
          let epToSet = details.episodes?.[0]; 
          if (epId) {
            const foundEp = details.episodes?.find((e) => e.id === epId);
            if (foundEp) epToSet = foundEp;
          }
          
          if (epToSet) {
            setCurrentEpisode(epToSet);
            if (!epId && details.episodes && details.episodes.length > 0) {
                 router.replace(`/play/${animeId}?episode=${epToSet.id}`, { scroll: false });
            }
          } else {
            setCurrentEpisode(null); 
            if (details.episodes && details.episodes.length > 0) {
              // This case implies an invalid episode ID was in the URL, but the anime has episodes.
              // We could set to the first episode or show a specific message.
              // For now, currentEpisode remains null, and the UI will handle it.
               if (details.episodes[0]) {
                 router.replace(`/play/${animeId}?episode=${details.episodes[0].id}`, { scroll: false });
                 setCurrentEpisode(details.episodes[0]);
               } else {
                 setPlayerError("No episodes available for this anime.");
               }
            } else {
              setPlayerError("No episodes available for this anime.");
            }
          }

        } else {
          setPlayerError("Anime not found.");
        }
      } catch(e: any) {
        console.error("Failed to load anime details:", e);
        setPlayerError(`Failed to load anime details: ${e.message || "Unknown error"}`);
      } finally {
        setPageIsLoading(false);
      }
    };
    fetchDetails();
  }, [animeId, searchParams, router]);


  const handleEpisodeSelect = useCallback(
    (ep: Episode) => {
      if (ep.id === currentEpisode?.id ) return; 
      setPlayerError(null); 
      setCurrentEpisode(ep); 
      router.push(`/play/${animeId}?episode=${ep.id}`, { scroll: false });
    },
    [router, animeId, currentEpisode?.id]
  );

  const handleNextEpisode = useCallback(() => {
    if (!anime || !currentEpisode || !anime.episodes) return;
    const idx = anime.episodes.findIndex((e) => e.id === currentEpisode.id);
    if (idx !== -1 && idx < anime.episodes.length - 1) {
      handleEpisodeSelect(anime.episodes[idx + 1]);
    }
  }, [anime, currentEpisode, handleEpisodeSelect]);

  const handlePreviousEpisode = useCallback(() => {
    if (!anime || !currentEpisode || !anime.episodes) return;
    const currentIndex = anime.episodes.findIndex(ep => ep.id === currentEpisode.id);
    if (currentIndex > 0) {
      const prevEpisode = anime.episodes[currentIndex - 1];
      handleEpisodeSelect(prevEpisode);
    }
  }, [anime, currentEpisode, handleEpisodeSelect]);

  const onPlayerError = useCallback((detail: MediaErrorDetail, nativeError?: unknown) => {
    console.error("Vidstack Player Error:", detail, nativeError);
    let message = "Video playback error.";
    if (detail?.message) {
        message = `Video error: ${detail.message}`;
    } else if (nativeError instanceof Error) {
        message = `Video error: ${nativeError.message}`;
    }
    setPlayerError(message);
  }, []);


  if (pageIsLoading && !anime) {
    return (
      <Container className="flex flex-col items-center justify-center min-h-[calc(100vh-var(--header-height,4rem)-1px)] py-12">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading player and anime details...</p>
      </Container>
    );
  }

  if (playerError && (!anime || (!currentEpisode && !pageIsLoading))) { 
    return (
      <Container className="flex flex-col items-center justify-center min-h-[calc(100vh-var(--header-height,4rem)-1px)] py-12 text-center">
        <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
        <h1 className="text-2xl font-bold text-destructive">Error</h1>
        <p className="text-muted-foreground">{playerError}</p>
        <Button asChild variant="link" className="mt-4">
          <Link href={anime ? `/anime/${anime.id}` : "/"}>
            {anime ? "Back to Anime Details" : "Go back to Home"}
          </Link>
        </Button>
      </Container>
    );
  }
  
  if (!anime && !pageIsLoading) { 
    return ( 
      <Container className="flex flex-col items-center justify-center min-h-[calc(100vh-var(--header-height,4rem)-1px)] py-12 text-center">
         <h1 className="text-2xl font-bold">Anime Not Found</h1>
         <p className="text-muted-foreground">Could not find details for anime ID: {animeId}</p>
         <Button asChild variant="link" className="mt-4">
          <Link href="/">Go back to Home</Link>
        </Button>
      </Container>
    );
  }
  
  const currentEpisodeIndex = anime?.episodes?.findIndex(ep => ep.id === currentEpisode?.id) ?? -1;
  const videoSrc: MediaSrc | undefined = currentEpisode?.url ? { src: currentEpisode.url, type: currentEpisode.url.includes('.m3u8') ? 'application/x-mpegurl' : 'video/mp4' } : undefined;

  return (
    <div className="min-h-screen flex flex-col bg-background -mt-[calc(var(--header-height,4rem)+1px)] pt-[calc(var(--header-height,4rem)+1px)]">
      <Container className="py-4 md:py-6 flex-grow w-full max-w-full px-0 sm:px-4 md:px-6 lg:px-8">
        <div className="lg:flex lg:gap-6 xl:gap-8 h-full">
          <div className="lg:flex-grow mb-6 lg:mb-0 h-full flex flex-col">
            <div className="aspect-video bg-black rounded-lg overflow-hidden shadow-2xl mb-4 w-full relative">
                {pageIsLoading && currentEpisode && ( 
                     <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 z-20">
                        <Loader2 className="w-10 h-10 animate-spin text-primary" />
                        <p className="text-sm text-primary-foreground mt-2">Loading Episode...</p>
                    </div>
                )}
                {playerError && currentEpisode && ( 
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 p-4 text-center z-10">
                    <AlertTriangle className="w-10 h-10 text-destructive mb-2" />
                    <p className="text-destructive-foreground text-sm">{playerError}</p>
                    <Button variant="outline" size="sm" className="mt-3" onClick={() => {
                        setPlayerError(null); 
                        // Attempt to reload by forcing a re-render or re-init.
                        // With Vidstack, changing the key or src should re-trigger.
                        if (currentEpisode) {
                           const tempEp = {...currentEpisode};
                           setCurrentEpisode(null); // Briefly nullify to ensure key change
                           setTimeout(() => setCurrentEpisode(tempEp), 50);
                        }
                    }}>Retry</Button>
                  </div>
                )}
                
                {(!currentEpisode?.url && !pageIsLoading && !playerError && anime) ? ( 
                     <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground bg-card pointer-events-none">
                        <PlayCircleIcon className="w-24 h-24 opacity-30" />
                        <p className="mt-4 text-lg">
                            {(!anime.episodes || anime.episodes.length === 0) ? 'No episodes available for this anime.' :
                            !currentEpisode ? 'Select an episode to start watching.' :
                            'Video source is missing for this episode.'}
                        </p>
                    </div>
                ) : videoSrc && (
                    <MediaPlayer
                        key={currentEpisode?.id || 'vidstack-player'} // Key to re-mount on episode change
                        className="w-full h-full"
                        title={currentEpisode?.title || anime?.title}
                        src={videoSrc}
                        poster={currentEpisode?.thumbnail || anime?.coverImage || `https://picsum.photos/seed/${animeId}-${currentEpisode?.id}-poster/1280/720`}
                        aspectRatio={16 / 9}
                        autoplay
                        onEnded={handleNextEpisode}
                        onError={onPlayerError}
                        ref={playerRef}
                        crossorigin="" // Added for HLS/DASH if CORS issues arise
                        playsinline // Important for iOS
                    >
                        <MediaProvider />
                        <DefaultVideoLayout icons={defaultLayoutIcons} />
                    </MediaPlayer>
                )}
            </div>

            <div className="px-2 sm:px-0">
                 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1 sm:mb-0 truncate">
                        {anime && (
                            <Link href={`/anime/${anime.id}`} className="hover:text-primary transition-colors">
                                {anime.title}
                            </Link>
                        )}
                    </h1>
                    <div className="flex items-center space-x-2 flex-shrink-0">
                        <Button variant="outline" size="sm" onClick={handlePreviousEpisode} disabled={!anime?.episodes || currentEpisodeIndex <= 0}>
                            Previous
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleNextEpisode} disabled={!anime?.episodes || currentEpisodeIndex < 0 || currentEpisodeIndex >= anime.episodes.length - 1}>
                            Next
                        </Button>
                    </div>
                 </div>

                {currentEpisode && (
                <h2 className="text-base sm:text-lg text-primary mb-1 truncate">
                    Episode {currentEpisode.episodeNumber}: {currentEpisode.title}
                </h2>
                )}
                {anime && (
                    <div className="flex items-center space-x-3 text-xs text-muted-foreground mb-3">
                        <span>{anime.year}</span>
                        <Separator orientation="vertical" className="h-4" />
                        <Badge variant={anime.status === 'Completed' ? 'default' : 'secondary'} className={`text-xs ${anime.status === 'Completed' ? 'bg-primary/80' : ''}`}>
                            {anime.status}
                        </Badge>
                        {anime.type && (
                            <>
                                <Separator orientation="vertical" className="h-4" />
                                <span>{anime.type}</span>
                            </>
                        )}
                        {anime.averageRating !== undefined && (
                            <>
                                <Separator orientation="vertical" className="h-4" />
                                <Star className="w-3 h-3 mr-1 text-yellow-400 fill-yellow-400" />
                                <span>{anime.averageRating.toFixed(1)}</span>
                            </>
                        )}
                    </div>
                )}
            </div>
          </div>

          <div className="lg:w-[320px] xl:w-[380px] flex-shrink-0">
            <div className="bg-card p-3 sm:p-4 rounded-lg shadow-lg h-full flex flex-col">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg sm:text-xl font-semibold text-primary flex items-center">
                    <List className="mr-2 w-5 h-5" /> Episodes ({anime?.episodes?.length || 0})
                </h3>
              </div>
              
              <ScrollArea className="flex-grow h-[calc(100vh-280px)] lg:h-[calc(100vh-var(--header-height,4rem)-180px)] pr-2 -mr-2 scrollbar-thin">
                <div className="space-y-1.5">
                    {anime?.episodes?.map((ep) => (
                    <Tooltip key={ep.id} delayDuration={200}>
                        <TooltipTrigger asChild>
                            <Button
                                variant={currentEpisode?.id === ep.id ? 'secondary' : 'ghost'}
                                className={`w-full justify-start text-left h-auto py-2.5 px-3 text-xs sm:text-sm ${
                                currentEpisode?.id === ep.id ? 'bg-primary/20 text-primary font-semibold' : 'hover:bg-primary/10'
                                }`}
                                onClick={() => handleEpisodeSelect(ep)}
                                title={`Episode ${ep.episodeNumber}: ${ep.title}`}
                            >
                                <div className="flex items-center w-full">
                                    <span className={`mr-2 font-mono text-muted-foreground text-[0.7rem] sm:text-xs w-6 sm:w-7 text-center ${currentEpisode?.id === ep.id ? 'text-primary' : ''}`}>
                                        {ep.episodeNumber}
                                    </span>
                                    <span className={`flex-grow truncate ${currentEpisode?.id === ep.id ? 'text-primary' : 'text-foreground'}`}>
                                    {ep.title}
                                    </span>
                                    {currentEpisode?.id === ep.id && <PlayCircleIcon className="w-4 h-4 ml-2 text-primary flex-shrink-0" />}
                                </div>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="left" align="center" className="bg-popover text-popover-foreground p-2 rounded-md shadow-lg max-w-xs">
                            <p className="font-semibold">Ep {ep.episodeNumber}: {ep.title}</p>
                            {ep.duration && <p className="text-xs text-muted-foreground">{ep.duration}</p>}
                            {ep.overview && <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{ep.overview}</p>}
                        </TooltipContent>
                       </Tooltip>
                    ))}
                    {(!anime?.episodes || anime.episodes.length === 0) && (
                        <p className="text-sm text-muted-foreground py-4 text-center">No episodes available for this series.</p>
                    )}
                </div>
              </ScrollArea>

                <div className="mt-4 pt-3 border-t border-border space-y-3">
                     <div>
                        <h4 className="text-sm font-semibold text-primary mb-1.5 flex items-center">
                            <Star className="mr-1.5 w-4 h-4" /> Rate this Anime
                        </h4>
                        <p className="text-xs text-muted-foreground">Rating feature coming soon!</p>
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-destructive mb-1.5 flex items-center">
                            <MessageSquareWarning className="mr-1.5 w-4 h-4" /> Report Issue
                        </h4>
                        <p className="text-xs text-muted-foreground">Report functionality coming soon.</p>
                    </div>
                </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
