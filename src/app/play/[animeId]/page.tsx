
"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import type { Anime, Episode } from "@/types/anime";
import { getAnimeById } from '@/services/animeService';
import Container from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { AlertTriangle, MessageSquareWarning, Loader2, List, Star, PlayCircleIcon, Download, Settings2, ArrowUpDown, ExternalLink, Share2, Tv, Film, ListVideo as ListVideoIcon, Info, RefreshCw, ThumbsUp, ThumbsDown, Edit3, Users, UserCircle, Send } from "lucide-react";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import Image from "next/image";
import ReadMoreSynopsis from "@/components/anime/ReadMoreSynopsis"; // Re-using for synopsis placeholder
import AnimeInteractionControls from "@/components/anime/anime-interaction-controls"; // Re-using for controls placeholder
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton"; // For placeholder content
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import AnimeCardSkeleton from "@/components/anime/AnimeCardSkeleton";


export default function PlayerPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const animeId = params.animeId as string;

  const [anime, setAnime] = useState<Anime | null>(null);
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
  const [pageIsLoading, setPageIsLoading] = useState(true);
  const [playerError, setPlayerError] = useState<string | null>(null);
  
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
          if (details.episodes && details.episodes.length > 0 && details.episodes[0]) {
             router.replace(`/play/${animeId}?episode=${details.episodes[0].id}`, { scroll: false });
             setCurrentEpisode(details.episodes[0]);
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

  // --- Placeholder Data and Functions ---
  const placeholderEpisode = {
    id: 'placeholder-ep-1',
    title: 'Episode Title Placeholder',
    episodeNumber: 1,
    seasonNumber: 1,
    thumbnail: `https://placehold.co/320x180.png`,
    overview: 'This is a placeholder overview for the episode. More details will be shown here once the actual data is loaded for this exciting adventure.',
    duration: '24min'
  };
  const placeholderEpisodes = Array(10).fill(null).map((_, i) => ({
    ...placeholderEpisode,
    id: `placeholder-ep-${i+1}`,
    episodeNumber: i + 1,
    title: `Episode ${i + 1}: The Adventure Continues Placeholder`,
    thumbnail: `https://placehold.co/320x180.png?text=Ep+${i+1}`
  }));

  const currentEpisodeIndex = anime?.episodes?.findIndex(ep => ep.id === currentEpisode?.id) ?? (currentEpisode ? 0 : -1);
  const displayEpisode = currentEpisode || (anime?.episodes?.[0]) || placeholderEpisode;
  const displayAnime = anime || {
    id: 'placeholder-anime',
    title: 'Anime Title Placeholder',
    coverImage: `https://placehold.co/200x300.png`,
    bannerImage: `https://placehold.co/1280x300.png`,
    year: 2024,
    genre: ['Action', 'Adventure', 'Fantasy'],
    status: 'Ongoing',
    synopsis: 'This is a placeholder synopsis for the anime. It describes an epic journey filled with challenges, friendship, and thrilling battles. The full story will captivate you.',
    type: 'TV',
    isFeatured: false,
    episodes: placeholderEpisodes,
  } as Anime;


  // --- Loading and Error States ---
  if (pageIsLoading && !anime) {
    return (
      <Container className="flex flex-col items-center justify-center min-h-[calc(100vh-var(--header-height,4rem)-1px)] py-12">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading player and anime details...</p>
      </Container>
    );
  }
  
  if (!anime && !pageIsLoading && playerError) { 
    return ( 
      <Container className="flex flex-col items-center justify-center min-h-[calc(100vh-var(--header-height,4rem)-1px)] py-12 text-center">
         <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
         <h1 className="text-2xl font-bold text-destructive">Error Loading Anime</h1>
         <p className="text-muted-foreground">{playerError || `Could not find details for anime ID: ${animeId}`}</p>
         <Button asChild variant="link" className="mt-4">
          <Link href="/">Go back to Home</Link>
        </Button>
      </Container>
    );
  }


  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground -mt-[calc(var(--header-height,4rem)+1px)] pt-[calc(var(--header-height,4rem)+1px)]">
      <Container className="py-4 md:py-6 flex-grow w-full">
        <div className="lg:grid lg:grid-cols-12 lg:gap-6 xl:gap-8 h-full">
          
          {/* Main Content: Player and Episode Info */}
          <div className="lg:col-span-8 xl:col-span-9 mb-6 lg:mb-0 h-full flex flex-col">
            {/* Video Player Area Placeholder */}
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
                  <Button variant="outline" size="sm" className="mt-3" onClick={() => setPlayerError(null)}>Retry</Button>
                </div>
              )}
              
              {(!currentEpisode?.url && !pageIsLoading && !playerError && displayAnime) ? ( 
                   <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground bg-card pointer-events-none">
                      <PlayCircleIcon className="w-24 h-24 opacity-30" />
                      <p className="mt-4 text-lg">
                          {(!displayAnime.episodes || displayAnime.episodes.length === 0) ? 'No episodes available for this anime.' :
                          !currentEpisode ? 'Select an episode to start watching.' :
                          'Video source is missing for this episode.'}
                      </p>
                  </div>
              ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground">
                      Vidstack Player / Iframe Area Placeholder
                  </div>
              )}
            </div>

            {/* Report Banner Placeholder */}
            <div className="player-report-banner p-3 rounded-lg text-sm flex items-center gap-2 mb-4">
              <MessageSquareWarning className="w-5 h-5 flex-shrink-0"/>
              <span>If the video is not working or is the wrong episode, please report it. (Reporting feature coming soon!)</span>
            </div>

            {/* Episode Info & Server/Quality Selection */}
            <div className="px-1 sm:px-0 space-y-3 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate font-orbitron">
                  EP {displayEpisode?.episodeNumber || '-'}: {displayEpisode?.title || 'Episode Title Not Available'}
                </h1>
                {/* Action Icons Placeholder */}
                <div className="flex items-center space-x-1.5">
                  <Button variant="outline" size="icon" className="w-8 h-8" title="Download (Coming Soon)"><Download size={16}/></Button>
                  <Button variant="outline" size="icon" className="w-8 h-8" title="Report Issue (Coming Soon)"><AlertTriangle size={16}/></Button>
                  <Button variant="outline" size="icon" className="w-8 h-8" title="Autoplay Settings (Coming Soon)"><Settings2 size={16}/></Button>
                </div>
              </div>

              {/* Server/Quality Selection Placeholder */}
              <div className="bg-card p-3 rounded-lg shadow">
                <div className="mb-3">
                  <h3 className="text-sm font-semibold text-primary mb-1.5">SUB</h3>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" className="text-xs">Server Alpha (SUB)</Button>
                    <Button size="sm" variant="default" className="text-xs btn-primary-gradient">Server Beta (SUB)</Button>
                    <Button size="sm" variant="outline" className="text-xs">Server Gamma (SUB)</Button>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-primary mb-1.5">DUB</h3>
                  <div className="flex flex-wrap gap-2">
                     <Button size="sm" variant="outline" className="text-xs">Server Delta (DUB)</Button>
                     <Button size="sm" variant="outline" className="text-xs">Server Epsilon (DUB)</Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-3">Server & quality selection coming soon!</p>
              </div>

              {/* Next Episode Airing Placeholder */}
              <div className="text-xs text-muted-foreground p-2 bg-card/50 rounded text-center sm:text-left">
                Next episode air date will be shown here. (e.g., Episode 9 will air on Sun, Jun 01, 2025...)
              </div>
            </div>
          </div>

          {/* Sidebar: Episode List, Anime Details, Comments, Recommendations */}
          <div className="lg:col-span-4 xl:col-span-3 space-y-6">
            {/* Episode List Section Placeholder */}
            <Card className="shadow-lg border-border/40">
              <CardHeader className="p-3 sm:p-4 pb-2 sm:pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-md font-semibold text-primary flex items-center">
                      <List className="mr-2 w-5 h-5" /> Episodes ({displayAnime?.episodes?.length || 0})
                  </CardTitle>
                  <div className="flex items-center space-x-1">
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary w-7 h-7" title="Refresh List (Coming Soon)">
                          <RefreshCw size={16} />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary w-7 h-7" title="Sort/Filter (Coming Soon)">
                          <ArrowUpDown size={16} />
                      </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[300px] lg:h-[350px] min-h-[200px] scrollbar-thin">
                  <div className="space-y-1.5 p-2 sm:p-3">
                    {(displayAnime?.episodes || placeholderEpisodes).map((ep, idx) => (
                      <Button
                          key={ep.id || `placeholder-${idx}`}
                          variant={currentEpisode?.id === ep.id ? 'secondary' : 'ghost'}
                          className={`w-full justify-start text-left h-auto py-2 px-2.5 text-xs ${
                          currentEpisode?.id === ep.id ? 'bg-primary/20 text-primary font-semibold' : 'hover:bg-primary/10'
                          }`}
                          onClick={() => anime && anime.episodes && handleEpisodeSelect(anime.episodes[idx])} // Only allow click if real episodes
                          title={`Ep ${ep.episodeNumber}: ${ep.title}`}
                      >
                          <div className="flex items-center w-full gap-2">
                              {ep.thumbnail ? <Image src={ep.thumbnail} alt="" width={64} height={36} className="rounded object-cover w-16 h-9 flex-shrink-0 bg-muted" data-ai-hint="episode thumbnail" />
                              : <Skeleton className="w-16 h-9 rounded bg-muted flex-shrink-0" />
                              }
                              <span className={`flex-grow truncate ${currentEpisode?.id === ep.id ? 'text-primary' : 'text-foreground'}`}>
                              Ep {ep.episodeNumber || '?'}: {ep.title || 'Untitled Episode'}
                              </span>
                              {currentEpisode?.id === ep.id && <PlayCircleIcon className="w-4 h-4 ml-auto text-primary flex-shrink-0" />}
                          </div>
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Anime Details Snippet Placeholder */}
            <Card className="shadow-lg border-border/40">
              <CardHeader className="p-3 sm:p-4 pb-2">
                 <CardTitle className="text-md font-semibold text-foreground">About This Anime</CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 pt-0">
                <div className="flex gap-3 sm:gap-4 mb-3">
                    <div className="w-20 sm:w-24 flex-shrink-0">
                    <Image 
                        src={displayAnime.coverImage || `https://placehold.co/200x300.png`} 
                        alt={displayAnime.title} 
                        width={200} 
                        height={300} 
                        className="rounded-md object-cover aspect-[2/3] bg-muted"
                        data-ai-hint="anime poster"
                    />
                    </div>
                    <div className="flex-grow min-w-0">
                    <h2 className="text-base sm:text-lg font-semibold text-foreground hover:text-primary transition-colors mb-1 truncate">
                        <Link href={`/anime/${displayAnime.id}`}>{displayAnime.title}</Link>
                    </h2>
                    {anime ? <AnimeInteractionControls anime={anime} className="[&>button]:h-7 [&>button]:px-2 [&>button]:text-xs" />
                           : <div className="flex space-x-2"><Skeleton className="h-7 w-24 rounded" /><Skeleton className="h-7 w-24 rounded" /></div> }
                    <div className="text-xs text-muted-foreground space-y-0.5 mt-1.5">
                        <p>Type: <Badge variant="outline" className="ml-1">{displayAnime.type || 'N/A'}</Badge></p>
                        <p>Status: <Badge variant="outline" className="ml-1">{displayAnime.status || 'N/A'}</Badge></p>
                        <p>Year: {displayAnime.year || 'N/A'}</p>
                    </div>
                    </div>
                </div>
                <ReadMoreSynopsis text={displayAnime.synopsis || "No synopsis available."} maxLength={100} />
                <div className="mt-2 flex flex-wrap gap-1">
                    {(displayAnime.genre || []).slice(0,4).map(g => <Badge key={g} variant="secondary" className="text-[0.6rem]">{g}</Badge>)}
                </div>
              </CardContent>
            </Card>

            {/* Comments Section Placeholder */}
            <Card className="shadow-lg border-border/40">
              <CardHeader className="p-3 sm:p-4 pb-2">
                <CardTitle className="text-md font-semibold text-primary flex items-center">
                    <Edit3 className="w-5 h-5 mr-2"/> Comments (3) {/* Placeholder count */}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 pt-0 space-y-3">
                <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={displayAnime?.coverImage || `https://placehold.co/40x40.png`} alt="User" />
                        <AvatarFallback><UserCircle size={18}/></AvatarFallback>
                    </Avatar>
                    <Textarea placeholder="Add a comment... (Feature coming soon)" className="text-xs flex-grow bg-input" rows={1} />
                    <Button size="sm" variant="ghost" disabled><Send size={16}/></Button>
                </div>
                <div className="text-xs text-muted-foreground flex justify-end">
                    Sort by: <Button variant="link" size="xs" className="px-1 text-muted-foreground hover:text-primary">Newest</Button>
                </div>
                <div className="space-y-2 pt-2 border-t border-border/30">
                    {/* Placeholder Comment Item */}
                    <div className="flex items-start gap-2 text-xs">
                        <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
                        <div className="flex-grow bg-muted/30 p-2 rounded-md">
                            <Skeleton className="h-3 w-1/4 mb-1" />
                            <Skeleton className="h-3 w-3/4 mb-0.5" />
                            <Skeleton className="h-3 w-1/2" />
                            <div className="flex gap-2 mt-1.5 text-muted-foreground">
                                <Skeleton className="h-4 w-10 rounded" />
                                <Skeleton className="h-4 w-10 rounded" />
                            </div>
                        </div>
                    </div>
                    <p className="text-center text-muted-foreground text-sm py-3">No comments yet. Or feature coming soon!</p>
                </div>
              </CardContent>
            </Card>

            {/* Recommendations Section Placeholder */}
            <Card className="shadow-lg border-border/40">
              <CardHeader className="p-3 sm:p-4 pb-2">
                 <CardTitle className="text-md font-semibold text-primary">You Might Also Like</CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 pt-0">
                <ScrollArea className="w-full whitespace-nowrap">
                    <div className="flex space-x-3 pb-2">
                        {[...Array(4)].map((_, i) => <AnimeCardSkeleton key={i} className="w-[100px]" />)}
                    </div>
                    <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </Container>
    </div>
  );
}
      
