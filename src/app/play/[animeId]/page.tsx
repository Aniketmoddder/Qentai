
"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import type { Anime, Episode } from "@/types/anime";
import { getAnimeById } from '@/services/animeService'; // Assuming this fetches all necessary data
import Container from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { AlertTriangle, MessageSquareWarning, Loader2, List, Star, PlayCircleIcon, Download, Settings2, ArrowUpDown, ExternalLink, Share2, Tv, Film, ListVideo as ListVideoIcon, Info } from "lucide-react";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import Image from "next/image";
import ReadMoreSynopsis from "@/components/anime/ReadMoreSynopsis";
import AnimeInteractionControls from "@/components/anime/anime-interaction-controls";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

// Vidstack imports
import { MediaPlayer, MediaProvider } from '@vidstack/react';
import type { MediaPlayerInstance, MediaSrc, MediaErrorDetail } from '@vidstack/react';
import { DefaultVideoLayout, defaultLayoutIcons } from '@vidstack/react/player/layouts/default';
// HLS.js is automatically used by Vidstack when an HLS source is provided if hls.js is installed.


export default function PlayerPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const animeId = params.animeId as string;

  const [anime, setAnime] = useState<Anime | null>(null);
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
  const [pageIsLoading, setPageIsLoading] = useState(true);
  const [playerError, setPlayerError] = useState<string | null>(null);
  const [isInfoDialogOpen, setIsInfoDialogOpen] = useState(false);
  
  const playerRef = useRef<MediaPlayerInstance | null>(null); 

  const fetchDetails = useCallback(async () => {
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
  }, [animeId, searchParams, router]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);


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
    } else if (nativeError instanceof Error && nativeError.message) {
      message = `Video error: ${nativeError.message}`;
    } else if (typeof nativeError === 'string') {
      message = `Video error: ${nativeError}`;
    }
    setPlayerError(message);
  }, []);

  const sortedEpisodes = React.useMemo(() => {
    if (!anime?.episodes) return [];
    return [...anime.episodes].sort((a, b) => {
      if ((a.seasonNumber ?? 1) !== (b.seasonNumber ?? 1)) return (a.seasonNumber ?? 1) - (b.seasonNumber ?? 1);
      return (a.episodeNumber ?? 0) - (b.episodeNumber ?? 0);
    });
  }, [anime?.episodes]);

  const typeIconMap: Record<string, React.ElementType> = {
    TV: Tv,
    Movie: Film,
    OVA: ListVideoIcon,
    Special: ListVideoIcon,
    ONA: ListVideoIcon,
    Music: Film,
    Unknown: Info,
  };
  const CurrentTypeIcon = anime?.format ? typeIconMap[anime.format] || Info : Info;


  if (pageIsLoading && !anime) {
    return (
      <Container className="flex flex-col items-center justify-center min-h-[calc(100vh-var(--header-height,4rem)-1px)] py-12">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading player and anime details...</p>
      </Container>
    );
  }
  
  if (!anime && !pageIsLoading) { 
    return ( 
      <Container className="flex flex-col items-center justify-center min-h-[calc(100vh-var(--header-height,4rem)-1px)] py-12 text-center">
         <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
         <h1 className="text-2xl font-bold text-destructive">Anime Not Found</h1>
         <p className="text-muted-foreground">Could not find details for anime ID: {animeId}</p>
         <Button asChild variant="link" className="mt-4">
          <Link href="/">Go back to Home</Link>
        </Button>
      </Container>
    );
  }
  
  const currentEpisodeIndex = anime?.episodes?.findIndex(ep => ep.id === currentEpisode?.id) ?? -1;
  const videoSrc: MediaSrc | undefined = currentEpisode?.url ? { 
    src: currentEpisode.url, 
    type: currentEpisode.url.includes('.m3u8') ? 'application/x-mpegurl' : 'video/mp4' 
  } : undefined;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground -mt-[calc(var(--header-height,4rem)+1px)] pt-[calc(var(--header-height,4rem)+1px)]">
      <Container className="py-4 md:py-6 flex-grow w-full">
        <div className="lg:grid lg:grid-cols-12 lg:gap-6 xl:gap-8 h-full">
          {/* Main Content: Player and Episode Info */}
          <div className="lg:col-span-8 xl:col-span-9 mb-6 lg:mb-0 h-full flex flex-col">
            {/* Video Player */}
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
                        if (currentEpisode) {
                           const tempEp = {...currentEpisode};
                           setCurrentEpisode(null); 
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
                        key={currentEpisode?.id || 'vidstack-player'}
                        className="w-full h-full"
                        title={currentEpisode?.title || anime?.title}
                        src={videoSrc}
                        poster={currentEpisode?.thumbnail || anime?.coverImage || `https://placehold.co/1280x720.png`}
                        aspectRatio={16 / 9}
                        autoplay
                        onEnded={handleNextEpisode}
                        onError={onPlayerError}
                        ref={playerRef}
                        crossOrigin="" 
                        playsInline 
                    >
                        <MediaProvider />
                        <DefaultVideoLayout icons={defaultLayoutIcons} />
                    </MediaPlayer>
                )}
            </div>

            {/* Episode Info & Controls */}
            <div className="px-1 sm:px-0 space-y-3">
              <div className="p-3 bg-destructive/10 text-destructive border border-destructive/20 rounded-lg text-sm flex items-center gap-2">
                <MessageSquareWarning className="w-5 h-5 flex-shrink-0"/>
                <span>If the video is not working or is the wrong episode, please try another server or report it. Reporting feature coming soon!</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate font-orbitron">
                  EP {currentEpisode?.episodeNumber || '-'}: {currentEpisode?.title || 'Episode Title Not Available'}
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

              {/* Server/Quality Selection Placeholder */}
              <div className="bg-card p-3 rounded-lg shadow">
                <h3 className="text-sm font-semibold text-primary mb-2">Video Sources:</h3>
                <div className="space-y-2">
                  <div>
                    <Badge variant="secondary" className="mb-1">SUB</Badge>
                    <div className="flex flex-wrap gap-1.5">
                      <Button size="xs" variant="outline" className="text-xs">Server Alpha (720p)</Button>
                      <Button size="xs" variant="default" className="text-xs btn-primary-gradient">Server Beta (1080p)</Button>
                    </div>
                  </div>
                  <div>
                    <Badge variant="secondary" className="mb-1">DUB</Badge>
                    <div className="flex flex-wrap gap-1.5">
                       <Button size="xs" variant="outline" className="text-xs">Server Gamma (720p)</Button>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">More server options coming soon!</p>
              </div>

              {/* Next Episode Airing Placeholder */}
              <div className="text-xs text-muted-foreground p-2 bg-card/50 rounded">
                Next episode information placeholder.
              </div>
            </div>
          </div>

          {/* Sidebar: Episode List & Anime Details */}
          <div className="lg:col-span-4 xl:col-span-3 space-y-6">
            {/* Episode List */}
            <div className="bg-card p-3 sm:p-4 rounded-lg shadow-lg h-auto flex flex-col">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-primary flex items-center">
                    <List className="mr-2 w-5 h-5" /> Episodes ({anime?.episodes?.length || 0})
                </h3>
                 <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary w-7 h-7" onClick={() => {}}>
                    <ArrowUpDown size={16} /> <span className="sr-only">Sort</span>
                </Button>
              </div>
              <ScrollArea className="flex-grow h-[300px] lg:h-[calc(100vh-var(--header-height,4rem)-480px)] min-h-[200px] pr-2 -mr-2 scrollbar-thin">
                <div className="space-y-1.5">
                    {sortedEpisodes.length > 0 ? sortedEpisodes.map((ep) => (
                    <Tooltip key={ep.id} delayDuration={200}>
                        <TooltipTrigger asChild>
                            <Button
                                variant={currentEpisode?.id === ep.id ? 'secondary' : 'ghost'}
                                className={`w-full justify-start text-left h-auto py-2 px-2.5 text-xs ${
                                currentEpisode?.id === ep.id ? 'bg-primary/20 text-primary font-semibold' : 'hover:bg-primary/10'
                                }`}
                                onClick={() => handleEpisodeSelect(ep)}
                                title={`Ep ${ep.episodeNumber}: ${ep.title}`}
                            >
                                <div className="flex items-center w-full gap-2">
                                    {ep.thumbnail && <Image src={ep.thumbnail} alt="" width={64} height={36} className="rounded object-cover w-16 h-9 flex-shrink-0 bg-muted" data-ai-hint="episode thumbnail" />}
                                    {!ep.thumbnail && <div className="w-16 h-9 rounded bg-muted flex-shrink-0"></div>}
                                    <span className={`flex-grow truncate ${currentEpisode?.id === ep.id ? 'text-primary' : 'text-foreground'}`}>
                                    Ep {ep.episodeNumber}: {ep.title}
                                    </span>
                                    {currentEpisode?.id === ep.id && <PlayCircleIcon className="w-4 h-4 ml-auto text-primary flex-shrink-0" />}
                                </div>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="left" align="center" className="bg-popover text-popover-foreground p-2 rounded-md shadow-lg max-w-xs">
                            <p className="font-semibold">Ep {ep.episodeNumber}: {ep.title}</p>
                            {ep.duration && <p className="text-xs text-muted-foreground">{ep.duration}</p>}
                            {ep.overview && <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{ep.overview}</p>}
                        </TooltipContent>
                       </Tooltip>
                    )) : (
                        <p className="text-sm text-muted-foreground py-4 text-center">No episodes listed.</p>
                    )}
                </div>
              </ScrollArea>
            </div>

            {/* Anime Details Snippet */}
            <div className="bg-card p-3 sm:p-4 rounded-lg shadow-lg">
              <div className="flex gap-3 sm:gap-4">
                <div className="w-20 sm:w-24 flex-shrink-0">
                  <Image 
                    src={anime.coverImage || `https://placehold.co/200x300.png`} 
                    alt={anime.title} 
                    width={200} 
                    height={300} 
                    className="rounded-md object-cover aspect-[2/3]"
                    data-ai-hint="anime poster"
                  />
                </div>
                <div className="flex-grow min-w-0">
                  <h2 className="text-base sm:text-lg font-semibold text-foreground hover:text-primary transition-colors mb-1 truncate">
                    <Link href={`/anime/${anime.id}`}>{anime.title}</Link>
                  </h2>
                  <div className="flex items-center space-x-2 mb-2">
                    <AnimeInteractionControls anime={anime} className="[&>button]:h-7 [&>button]:px-2 [&>button]:text-xs" />
                    <Button variant="outline" size="icon" className="h-7 w-7 border-border/70 hover:border-primary">
                        <Share2 className="h-3.5 w-3.5"/> <span className="sr-only">Share</span>
                    </Button>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <p className="flex items-center gap-1"><CurrentTypeIcon size={12} /> {anime.format || anime.type || 'N/A'}</p>
                    <p>Status: <Badge variant={anime.status === 'Completed' ? 'default' : 'secondary'} className="text-[0.65rem] px-1 py-0">{anime.status}</Badge></p>
                    <p>Year: {anime.year || anime.seasonYear || 'N/A'}</p>
                  </div>
                </div>
              </div>
              <Separator className="my-3 bg-border/30" />
              <ReadMoreSynopsis text={anime.synopsis || "No synopsis available."} maxLength={100} />
              <div className="mt-2 flex flex-wrap gap-1">
                {(anime.genre || []).slice(0,4).map(g => <Badge key={g} variant="outline" className="text-[0.6rem]">{g}</Badge>)}
              </div>
            </div>

            {/* Comments Section Placeholder */}
            <div className="bg-card p-3 sm:p-4 rounded-lg shadow-lg">
              <h3 className="text-md font-semibold text-primary mb-2">Comments (0)</h3>
              <textarea className="w-full p-2 rounded border border-input bg-background/50 text-sm placeholder:text-muted-foreground" placeholder="Add a comment..." rows={2}></textarea>
              <div className="flex justify-between items-center mt-2">
                <Button size="sm" variant="outline" className="text-xs">Sort: Newest</Button>
                <Button size="sm" className="btn-primary-gradient text-xs">Post Comment</Button>
              </div>
              <p className="text-xs text-muted-foreground text-center mt-3">No comments yet. Be the first!</p>
            </div>

            {/* Recommendations Placeholder */}
            <div className="bg-card p-3 sm:p-4 rounded-lg shadow-lg">
              <h3 className="text-md font-semibold text-primary mb-2">You Might Also Like</h3>
              <p className="text-xs text-muted-foreground">Recommendations coming soon...</p>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
