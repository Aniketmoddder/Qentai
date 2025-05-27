
"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import type { Anime, Episode } from "@/types/anime";
import { getAnimeById } from '@/services/animeService';
import Container from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { AlertTriangle, MessageSquareWarning, Loader2, List, Star, PlayCircleIcon, Download, Settings2, ArrowUpDown, ExternalLink, Share2, Tv, Film, ListVideo as ListVideoIcon, Info, RefreshCw } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";


export default function PlayerPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const animeId = params.animeId as string;

  const [anime, setAnime] = useState<Anime | null>(null);
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
  const [pageIsLoading, setPageIsLoading] = useState(true);
  const [playerError, setPlayerError] = useState<string | null>(null); // For generic player errors
  const [isInfoDialogOpen, setIsInfoDialogOpen] = useState(false);
  
  const fetchDetails = useCallback(async () => {
    if (!animeId) {
      setPlayerError("Anime ID is missing."); // Using playerError state for consistency
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
          // If no episode ID in URL but episodes exist, set the first one and update URL
          if (!epId && details.episodes && details.episodes.length > 0) {
               router.replace(`/play/${animeId}?episode=${epToSet.id}`, { scroll: false });
          }
        } else {
          setCurrentEpisode(null); // No specific episode to set
          if (details.episodes && details.episodes.length > 0) {
             // If episodes exist but none match (or no epId was provided), default to first
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
      if (ep.id === currentEpisode?.id ) return; // Avoid reloading if same episode
      setPlayerError(null); // Clear previous player errors
      setCurrentEpisode(ep); // Set the new current episode
      router.push(`/play/${animeId}?episode=${ep.id}`, { scroll: false }); // Update URL
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

  const sortedEpisodes = React.useMemo(() => {
    if (!anime?.episodes) return [];
    // Basic sort by season then episode number
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
    Music: Film, // Assuming Music type is like a short film/video
    Unknown: Info, // Fallback icon
  };
  const CurrentTypeIcon = anime?.format ? typeIconMap[anime.format] || Info : Info;


  if (pageIsLoading && !anime) { // Initial loading state for the whole page
    return (
      <Container className="flex flex-col items-center justify-center min-h-[calc(100vh-var(--header-height,4rem)-1px)] py-12">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading player and anime details...</p>
      </Container>
    );
  }
  
  // If anime fetch failed and page is no longer loading
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
  
  // If anime details are loaded, but there's a playerError related to episodes or source
  const currentEpisodeIndex = anime?.episodes?.findIndex(ep => ep.id === currentEpisode?.id) ?? -1;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground -mt-[calc(var(--header-height,4rem)+1px)] pt-[calc(var(--header-height,4rem)+1px)]">
      <Container className="py-4 md:py-6 flex-grow w-full">
        <div className="lg:grid lg:grid-cols-12 lg:gap-6 xl:gap-8 h-full">
          {/* Main Content: Player and Episode Info */}
          <div className="lg:col-span-8 xl:col-span-9 mb-6 lg:mb-0 h-full flex flex-col">
            {/* Video Player Area Placeholder */}
            <div className="aspect-video bg-black rounded-lg overflow-hidden shadow-2xl mb-4 w-full relative">
                {pageIsLoading && currentEpisode && ( // Show loader when switching episodes
                     <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 z-20">
                        <Loader2 className="w-10 h-10 animate-spin text-primary" />
                        <p className="text-sm text-primary-foreground mt-2">Loading Episode...</p>
                    </div>
                )}
                {playerError && currentEpisode && ( // Show specific player error if currentEpisode exists
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 p-4 text-center z-10">
                    <AlertTriangle className="w-10 h-10 text-destructive mb-2" />
                    <p className="text-destructive-foreground text-sm">{playerError}</p>
                    <Button variant="outline" size="sm" className="mt-3" onClick={() => setPlayerError(null)}>Retry</Button>
                  </div>
                )}
                
                {/* Placeholder if no current episode URL or if anime has no episodes */}
                {(!currentEpisode?.url && !pageIsLoading && !playerError && anime) ? ( 
                     <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground bg-card pointer-events-none">
                        <PlayCircleIcon className="w-24 h-24 opacity-30" />
                        <p className="mt-4 text-lg">
                            {(!anime.episodes || anime.episodes.length === 0) ? 'No episodes available for this anime.' :
                            !currentEpisode ? 'Select an episode to start watching.' :
                            'Video source is missing for this episode.'}
                        </p>
                    </div>
                ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground">
                        Video Player Placeholder (Vidstack will go here)
                    </div>
                )}
            </div>

            {/* Report Banner Placeholder */}
            <div className="report-banner p-3 rounded-lg text-sm flex items-center gap-2 mb-4">
              <MessageSquareWarning className="w-5 h-5 flex-shrink-0"/>
              <span>If the video is not working or is the wrong episode, please try another server or report it. Reporting feature coming soon!</span>
            </div>

            {/* Episode Info & Controls */}
            <div className="px-1 sm:px-0 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate font-orbitron">
                  EP {currentEpisode?.episodeNumber || (anime?.type === 'Movie' ? 1 : '-')}: {currentEpisode?.title || (anime?.type === 'Movie' ? 'Full Movie' : 'Episode Title Not Available')}
                </h1>
                <div className="flex items-center space-x-2 flex-shrink-0">
                  <Button variant="outline" size="sm" onClick={handlePreviousEpisode} disabled={!anime?.episodes || currentEpisodeIndex <= 0}>
                    Previous
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleNextEpisode} disabled={!anime?.episodes || currentEpisodeIndex < 0 || currentEpisodeIndex >= (anime.episodes?.length ?? 0) - 1}>
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
                      <Button size="xs" variant="outline" className="text-xs">Server Alpha (Placeholder)</Button>
                      <Button size="xs" variant="default" className="text-xs btn-primary-gradient">Server Beta (Placeholder)</Button>
                    </div>
                  </div>
                  <div>
                    <Badge variant="secondary" className="mb-1">DUB</Badge>
                    <div className="flex flex-wrap gap-1.5">
                       <Button size="xs" variant="outline" className="text-xs">Server Gamma (Placeholder)</Button>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Server selection coming soon!</p>
              </div>

              {/* Next Episode Airing Placeholder */}
              <div className="text-xs text-muted-foreground p-2 bg-card/50 rounded">
                Next episode air date will be shown here.
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
                <div className="flex items-center space-x-1">
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary w-7 h-7" onClick={() => toast({title: "Refresh", description:"Refresh coming soon!"})}>
                        <RefreshCw size={16} /> <span className="sr-only">Refresh</span>
                    </Button>
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary w-7 h-7" onClick={() => toast({title: "Sort", description:"Sort coming soon!"})}>
                        <ArrowUpDown size={16} /> <span className="sr-only">Sort</span>
                    </Button>
                </div>
              </div>
              <ScrollArea className="flex-grow h-[300px] lg:h-[calc(100vh-var(--header-height,4rem)-480px)] min-h-[200px] pr-2 -mr-2 scrollbar-thin">
                <div className="space-y-1.5">
                    {pageIsLoading && !anime ? (
                         [...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-md bg-muted/50" />)
                    ) : sortedEpisodes.length > 0 ? sortedEpisodes.map((ep) => (
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
                                    {ep.thumbnail ? <Image src={ep.thumbnail} alt="" width={64} height={36} className="rounded object-cover w-16 h-9 flex-shrink-0 bg-muted" data-ai-hint="episode thumbnail" />
                                    : <div className="w-16 h-9 rounded bg-muted flex-shrink-0 flex items-center justify-center"><PlayCircleIcon className="w-5 h-5 text-muted-foreground/50"/></div>
                                    }
                                    <span className={`flex-grow truncate ${currentEpisode?.id === ep.id ? 'text-primary' : 'text-foreground'}`}>
                                    Ep {ep.episodeNumber || (anime?.type === 'Movie' ? 1 : '?')}: {ep.title || (anime?.type === 'Movie' ? 'Full Movie' : 'Untitled Episode')}
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
                        <p className="text-sm text-muted-foreground py-4 text-center">No episodes listed for this anime.</p>
                    )}
                </div>
              </ScrollArea>
            </div>

            {/* Anime Details Snippet */}
            {anime && (
                <div className="bg-card p-3 sm:p-4 rounded-lg shadow-lg">
                <div className="flex gap-3 sm:gap-4">
                    <div className="w-20 sm:w-24 flex-shrink-0">
                    <Image 
                        src={anime.coverImage || `https://picsum.photos/seed/${anime.id}-cover/200/300`} 
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
                        <p>Status: <Badge variant={anime.status === 'Completed' || anime.status === 'FINISHED' ? 'default' : 'secondary'} className="text-[0.65rem] px-1 py-0">{anime.status}</Badge></p>
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
            )}

            {/* Comments Section Placeholder */}
            <div className="bg-card p-3 sm:p-4 rounded-lg shadow-lg">
              <h3 className="text-md font-semibold text-primary mb-2">Comments (Placeholder)</h3>
              <div className="h-24 bg-muted/30 rounded-md flex items-center justify-center text-sm text-muted-foreground">Comment section coming soon.</div>
            </div>

            {/* Recommendations Placeholder */}
            <div className="bg-card p-3 sm:p-4 rounded-lg shadow-lg">
              <h3 className="text-md font-semibold text-primary mb-2">Recommendations (Placeholder)</h3>
              <div className="h-32 bg-muted/30 rounded-md flex items-center justify-center text-sm text-muted-foreground">Recommendations coming soon.</div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
      