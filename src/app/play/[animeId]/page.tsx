
"use client";

import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import type { Anime, Episode, VideoSource } from "@/types/anime";
import { getAnimeById } from '@/services/animeService';
import Container from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"; // Added Card imports
import { AlertTriangle, MessageSquareWarning, Loader2, List, Star, PlayCircleIcon as PlayIconFallback, Download, Settings2, ArrowUpDown, ExternalLink, Share2, Tv, Film, ListVideo as ListVideoIcon, Info, RefreshCw, ThumbsUp, ThumbsDown, Edit3, Users, UserCircle, Send, Server as ServerIcon, Clapperboard } from "lucide-react";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import Image from "next/image";
import ReadMoreSynopsis from "@/components/anime/ReadMoreSynopsis";
import AnimeInteractionControls from "@/components/anime/anime-interaction-controls";
import { Dialog, DialogHeader as DialogHeaderPrimitive, DialogTitle as DialogTitlePrimitive, DialogDescription as DialogDescriptionPrimitive, DialogTrigger, DialogClose } from "@/components/ui/dialog"; // Renamed to avoid conflict if needed
import { DialogContent } from "@/components/ui/dialog"; // Ensure DialogContent is imported correctly
import { cn } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import AnimeCardSkeleton from "@/components/anime/AnimeCardSkeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Plyr Imports
import Plyr from "plyr-react";
import "plyr/dist/plyr.css";
import type Hls from 'hls.js'; // Import Hls type for potential specific config


export default function PlayerPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const animeId = params.animeId as string;

  const [anime, setAnime] = useState<Anime | null>(null);
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
  const [activeSource, setActiveSource] = useState<VideoSource | null>(null);
  const [pageIsLoading, setPageIsLoading] = useState(true);
  const [playerError, setPlayerError] = useState<string | null>(null);
  
  const playerRef = useRef<Plyr | null>(null);
  const hlsInstanceRef = useRef<Hls | null>(null);

  const plyrOptions: Plyr.Options = useMemo(() => ({
    autoplay: true,
    hls: {
      // capLevelToPlayerSize: true,
      // maxMaxBufferLength: 60,
    },
  }), []);

  // Dynamically import Hls.js only on client-side
  useEffect(() => {
    if (activeSource?.type === 'm3u8' && typeof window !== 'undefined') {
      import('hls.js').then(HlsModule => {
        const Hls = HlsModule.default;
        if (Hls.isSupported() && playerRef.current?.plyr) {
           if(hlsInstanceRef.current) {
            hlsInstanceRef.current.destroy();
          }
          const hls = new Hls(plyrOptions.hls as any);
          hls.loadSource(activeSource.url);
          hls.attachMedia(playerRef.current.plyr.media as HTMLMediaElement);
          hlsInstanceRef.current = hls;
          
          hls.on(Hls.Events.ERROR, (event, data) => {
            if (data.fatal) {
              switch (data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                  console.error('HLS Network Error:', data);
                  handlePlayerError('A network error occurred while loading the video (HLS).');
                  break;
                case Hls.ErrorTypes.MEDIA_ERROR:
                  console.error('HLS Media Error:', data);
                  handlePlayerError('A media error occurred (HLS).');
                  break;
                default:
                  console.error('HLS Unhandled Error:', data);
                  handlePlayerError('An unexpected error occurred with HLS playback.');
                  break;
              }
            }
          });
        }
      });
    } else if (hlsInstanceRef.current) {
       hlsInstanceRef.current.destroy();
       hlsInstanceRef.current = null;
    }
     return () => {
      if (hlsInstanceRef.current) {
        hlsInstanceRef.current.destroy();
      }
    };
  }, [activeSource, plyrOptions.hls]);


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
        const epIdFromUrl = searchParams.get("episode");
        let epToSet = details.episodes?.find(ep => ep.sources && ep.sources.length > 0) || details.episodes?.[0]; 

        if (epIdFromUrl) {
          const foundEp = details.episodes?.find((e) => e.id === epIdFromUrl);
          if (foundEp && foundEp.sources && foundEp.sources.length > 0) {
            epToSet = foundEp;
          } else if (foundEp) {
            epToSet = foundEp; // Still set it, will show "no sources"
          }
        }
        
        if (epToSet) {
          setCurrentEpisode(epToSet);
          const firstSource = epToSet.sources?.[0];
          if (firstSource) {
            setActiveSource(firstSource);
          } else {
            setActiveSource(null);
            setPlayerError(epToSet.sources && epToSet.sources.length === 0 ? "No video sources available for this episode." : "Episode selected, but no source found.");
          }

          if (!epIdFromUrl && epToSet.id && epToSet.sources && epToSet.sources.length > 0) {
             router.replace(`/play/${animeId}?episode=${epToSet.id}`, { scroll: false });
          }
        } else {
          setCurrentEpisode(null);
          setActiveSource(null);
          if (details.episodes && details.episodes.length > 0 && details.episodes[0]?.id) {
             setPlayerError("No episodes with playable sources available.");
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
      if (ep.id === currentEpisode?.id && activeSource) return; 
      setPlayerError(null);
      setCurrentEpisode(ep);
      const firstSource = ep.sources?.[0];
      if (firstSource) {
        setActiveSource(firstSource);
      } else {
        setActiveSource(null);
        setPlayerError("No video sources available for this episode.");
      }
      router.push(`/play/${animeId}?episode=${ep.id}`, { scroll: false });
    },
    [router, animeId, currentEpisode?.id, activeSource]
  );

  const handleServerSelect = (source: VideoSource) => {
    setPlayerError(null); 
    setActiveSource(source);
  };

  const handlePlayerError = (event: any) => {
    console.error("Plyr Media Error:", event);
    const plyrPlayer = playerRef.current?.plyr;
    let errorMessage = "Could not load video. Try another server or episode.";
    if (plyrPlayer?.source && typeof plyrPlayer.source === 'string' && plyrPlayer.source.includes('m3u8') && typeof window !== 'undefined' && window.Hls && !window.Hls.isSupported()) {
      errorMessage = "HLS playback is not supported in your browser for this M3U8 stream.";
    } else if (event?.detail?.plyrError?.message) {
      errorMessage = `Player Error: ${event.detail.plyrError.message}`;
    } else if (typeof event === 'string') {
      errorMessage = event;
    }
    setPlayerError(errorMessage);
  };
  
  const placeholderEpisode = {
    id: 'placeholder-ep-1',
    title: 'Episode Title Placeholder',
    episodeNumber: 1,
    seasonNumber: 1,
    thumbnail: `https://placehold.co/320x180.png`,
    overview: 'This is a placeholder overview for the episode.',
    duration: '24min',
    sources: [{id: 'placeholder-src-1', url: '', type: 'mp4', label: 'Default Server', category: 'SUB' } as VideoSource]
  };
  const placeholderEpisodes = Array(10).fill(null).map((_, i) => ({
    ...placeholderEpisode,
    id: `placeholder-ep-${i+1}`,
    episodeNumber: i + 1,
    title: `Episode ${i + 1}: Placeholder`,
    thumbnail: `https://placehold.co/320x180.png?text=Ep+${i+1}`,
  }));

  // Conditional returns must come AFTER all hook calls
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
  
  const displayEpisode = currentEpisode || (anime?.episodes?.find(ep => ep.sources && ep.sources.length > 0)) || (anime?.episodes?.[0]) || placeholderEpisode;
  const displayAnime = anime || {
    id: 'placeholder-anime',
    title: 'Anime Title Placeholder',
    coverImage: `https://placehold.co/200x300.png`,
    bannerImage: `https://placehold.co/1280x300.png`,
    year: 2024,
    genre: ['Action', 'Adventure'],
    status: 'Ongoing',
    synopsis: 'Placeholder synopsis.',
    type: 'TV',
    isFeatured: false,
    episodes: placeholderEpisodes,
    averageRating: 7.5,
  } as Anime;

  const subServers = displayEpisode?.sources?.filter(s => s.category === 'SUB') || [];
  const dubServers = displayEpisode?.sources?.filter(s => s.category === 'DUB') || [];

  const plyrSource: Plyr.SourceInfo | null = activeSource && (activeSource.type === 'mp4' || activeSource.type === 'm3u8') && anime
    ? {
        type: 'video',
        title: `${displayAnime?.title || 'Video'} - ${displayEpisode?.title || 'Episode'}`,
        sources: [
          {
            src: activeSource.url,
            type: activeSource.type === 'm3u8' ? 'application/x-mpegURL' : 'video/mp4',
          },
        ],
        poster: displayEpisode?.thumbnail || displayAnime?.bannerImage || displayAnime?.coverImage || `https://placehold.co/1280x720.png`,
      }
    : null;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground -mt-[calc(var(--header-height,4rem)+1px)] pt-[calc(var(--header-height,4rem)+1px)]">
      <Container className="py-4 md:py-6 flex-grow w-full">
        <div className="lg:grid lg:grid-cols-12 lg:gap-6 xl:gap-8 h-full">
          
          <div className="lg:col-span-8 xl:col-span-9 mb-6 lg:mb-0 h-full flex flex-col">
            <div className="aspect-video bg-black rounded-lg overflow-hidden shadow-2xl mb-4 w-full relative plyr-container">
              {activeSource && (activeSource.type === 'mp4' || activeSource.type === 'm3u8') && anime && plyrSource ? (
                <Plyr
                  key={activeSource.id} 
                  ref={playerRef}
                  source={plyrSource}
                  options={plyrOptions}
                  onLoadedData={() => setPlayerError(null)}
                />
              ) : activeSource && activeSource.type === 'embed' ? (
                 <iframe
                    key={activeSource.id} 
                    src={activeSource.url}
                    title={`${displayAnime?.title} - ${displayEpisode?.title}`}
                    className="w-full h-full border-0 rounded-lg"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  ></iframe>
              ) : (
                   <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground bg-card pointer-events-none">
                      <PlayIconFallback className="w-24 h-24 opacity-30" />
                      <p className="mt-4 text-lg">
                          {pageIsLoading ? 'Loading player...' : 
                           (!displayAnime.episodes || displayAnime.episodes.length === 0) ? 'No episodes available.' :
                           !currentEpisode ? 'Select an episode to play.' :
                           !activeSource ? 'No video source selected or available for this episode.' :
                           'Player ready. Select a server.'}
                      </p>
                  </div>
              )}
               {pageIsLoading && !activeSource && (
                   <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 z-20">
                      <Loader2 className="w-10 h-10 animate-spin text-primary" />
                      <p className="text-sm text-primary-foreground mt-2">Loading Episode...</p>
                  </div>
              )}
              {playerError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 p-4 text-center z-10">
                  <AlertTriangle className="w-10 h-10 text-destructive mb-2" />
                  <p className="text-destructive-foreground text-sm">{playerError}</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={() => {
                    setPlayerError(null);
                  }}>Dismiss</Button>
                </div>
              )}
            </div>

            <div className="player-report-banner p-3 rounded-lg text-sm flex items-center gap-2 mb-4">
              <MessageSquareWarning className="w-5 h-5 flex-shrink-0"/>
              <span>If the video is not working or is the wrong episode, please report it. (Reporting feature coming soon!)</span>
            </div>

            <div className="px-1 sm:px-0 space-y-3 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate font-orbitron">
                  EP {displayEpisode?.episodeNumber || '-'}: {displayEpisode?.title || 'Episode Title Not Available'}
                </h1>
                <div className="flex items-center space-x-1.5">
                  <Button variant="outline" size="icon" className="w-8 h-8" title="Download (Coming Soon)"><Download size={16}/></Button>
                  <Button variant="outline" size="icon" className="w-8 h-8" title="Report Issue (Coming Soon)"><AlertTriangle size={16}/></Button>
                  <Button variant="outline" size="icon" className="w-8 h-8" title="Autoplay Settings (Coming Soon)"><Settings2 size={16}/></Button>
                </div>
              </div>
              
              <Card className="p-3 sm:p-4 bg-card shadow-sm border-border/40">
                <div className="space-y-3">
                  {subServers.length > 0 && (
                    <div>
                        <h3 className="text-sm font-semibold text-primary mb-1.5 flex items-center"><Clapperboard size={16} className="mr-1.5"/> SUB Servers</h3>
                        <div className="flex flex-wrap gap-2 server-button-group">
                            {subServers.map(source => (
                                <Button 
                                    key={source.id} 
                                    size="sm" 
                                    className={cn("server-button")}
                                    data-active={activeSource?.id === source.id}
                                    variant={activeSource?.id === source.id ? 'default' : 'outline'}
                                    onClick={() => handleServerSelect(source)}
                                >
                                    {source.label} {source.quality && <Badge variant="secondary" className="ml-1.5 text-[0.6rem] px-1 py-0">{source.quality}</Badge>}
                                </Button>
                            ))}
                        </div>
                    </div>
                  )}
                   {dubServers.length > 0 && (
                    <div>
                        <h3 className="text-sm font-semibold text-primary mb-1.5 flex items-center"><ServerIcon size={16} className="mr-1.5"/> DUB Servers</h3>
                         <div className="flex flex-wrap gap-2 server-button-group">
                           {dubServers.map(source => (
                                <Button 
                                    key={source.id} 
                                    size="sm" 
                                    className={cn("server-button")}
                                    data-active={activeSource?.id === source.id}
                                    variant={activeSource?.id === source.id ? 'default' : 'outline'}
                                    onClick={() => handleServerSelect(source)}
                                >
                                    {source.label} {source.quality && <Badge variant="secondary" className="ml-1.5 text-[0.6rem] px-1 py-0">{source.quality}</Badge>}
                                </Button>
                            ))}
                        </div>
                    </div>
                  )}
                  {subServers.length === 0 && dubServers.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-2">No video sources available for this episode yet.</p>
                  )}
                </div>
              </Card>

              <div className="text-xs text-muted-foreground p-2 bg-card/50 rounded text-center sm:text-left">
                Next episode air date will be shown here.
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 xl:col-span-3 space-y-6">
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
                    {(displayAnime?.episodes && displayAnime.episodes.length > 0 ? displayAnime.episodes : placeholderEpisodes).map((ep, idx) => (
                      <Button
                          key={ep.id || `placeholder-${idx}`}
                          variant={(currentEpisode?.id === ep.id && activeSource) ? 'secondary' : 'ghost'}
                          className={`w-full justify-start text-left h-auto py-2 px-2.5 text-xs ${
                          (currentEpisode?.id === ep.id && activeSource) ? 'bg-primary/20 text-primary font-semibold' : 'hover:bg-primary/10'
                          }`}
                          onClick={() => anime && anime.episodes && anime.episodes[idx] && handleEpisodeSelect(anime.episodes[idx])}
                          title={`Ep ${ep.episodeNumber}: ${ep.title}`}
                          disabled={!anime || !anime.episodes || anime.episodes.length === 0 || !ep.sources || ep.sources.length === 0}
                      >
                          <div className="flex items-center w-full gap-2">
                              {ep.thumbnail ? <Image src={ep.thumbnail} alt="" width={64} height={36} className="rounded object-cover w-16 h-9 flex-shrink-0 bg-muted" data-ai-hint="episode thumbnail" />
                              : <Skeleton className="w-16 h-9 rounded bg-muted flex-shrink-0" />
                              }
                              <span className={`flex-grow truncate ${(currentEpisode?.id === ep.id && activeSource) ? 'text-primary' : 'text-foreground'}`}>
                              Ep {ep.episodeNumber || '?'}: {ep.title || 'Untitled Episode'}
                              </span>
                              {(currentEpisode?.id === ep.id && activeSource) && <PlayIconFallback className="w-4 h-4 ml-auto text-primary flex-shrink-0" />}
                          </div>
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {anime && (
              <Card className="shadow-lg border-border/40">
                <CardHeader className="p-3 sm:p-4 pb-2">
                  <CardTitle className="text-md font-semibold text-foreground hover:text-primary transition-colors">
                      <Link href={`/anime/${anime.id}`}>
                          About: {anime.title}
                      </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 pt-0">
                  <div className="flex gap-3 sm:gap-4 mb-3">
                      <div className="w-20 sm:w-24 flex-shrink-0">
                      {anime.coverImage ? (
                        <Image
                            src={anime.coverImage}
                            alt={anime.title}
                            width={200}
                            height={300}
                            className="rounded-md object-cover aspect-[2/3] bg-muted"
                            data-ai-hint="anime poster"
                        />
                      ) : (
                        <Skeleton className="w-full h-[120px] sm:h-[135px] rounded-md bg-muted" />
                      )}
                      </div>
                      <div className="flex-grow min-w-0">
                        <h2 className="text-base sm:text-lg font-semibold text-foreground hover:text-primary transition-colors mb-1 truncate">
                            <Link href={`/anime/${anime.id}`}>
                                {anime.title}
                            </Link>
                        </h2>
                        <AnimeInteractionControls anime={anime} className="[&>button]:h-7 [&>button]:px-2 [&>button]:text-xs" />
                        <div className="text-xs text-muted-foreground space-y-0.5 mt-1.5">
                            <p>Type: <Badge variant="outline" className="ml-1">{anime.type || 'N/A'}</Badge></p>
                            <p>Status: <Badge variant="outline" className="ml-1">{anime.status || 'N/A'}</Badge></p>
                            <p>Year: {anime.year || 'N/A'}</p>
                        </div>
                      </div>
                  </div>
                  <ReadMoreSynopsis text={anime.synopsis || "No synopsis available."} maxLength={100} />
                  <div className="mt-2 flex flex-wrap gap-1">
                      {(anime.genre || []).slice(0,4).map(g => <Badge key={g} variant="secondary" className="text-[0.6rem]">{g}</Badge>)}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="shadow-lg border-border/40">
              <CardHeader className="p-3 sm:p-4 pb-2">
                <CardTitle className="text-md font-semibold text-primary flex items-center">
                    <Edit3 className="w-5 h-5 mr-2"/> Comments (0)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 pt-0 space-y-3">
                <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={displayAnime?.coverImage || `https://placehold.co/40x40.png`} alt="User" />
                        <AvatarFallback><UserCircle size={18}/></AvatarFallback>
                    </Avatar>
                    <Textarea placeholder="Add a comment... (Feature coming soon)" className="text-xs flex-grow bg-input" rows={1} disabled />
                    <Button size="sm" variant="ghost" disabled><Send size={16}/></Button>
                </div>
                <div className="text-xs text-muted-foreground flex justify-end">
                    Sort by: <Button variant="link" size="xs" className="px-1 text-muted-foreground hover:text-primary" disabled>Newest</Button>
                </div>
                <div className="space-y-2 pt-2 border-t border-border/30">
                    <p className="text-center text-muted-foreground text-sm py-3">Comments are coming soon!</p>
                </div>
              </CardContent>
            </Card>

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
                <p className="text-center text-muted-foreground text-xs mt-2">Recommendations are coming soon!</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </Container>
    </div>
  );
}

