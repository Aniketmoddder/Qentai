
"use client";

import React, { useEffect, useState, useRef, useCallback, useMemo, Suspense } from "react";
import type { Anime, Episode, VideoSource } from "@/types/anime";
import { getAnimeById } from '@/services/animeService';
import Container from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, MessageSquareWarning, Loader2, List, Star, PlayCircleIcon as PlayIconFallback, Download, Settings2, ArrowUpDown, ExternalLink, Share2, Tv, Film, ListVideo as ListVideoIcon, Info, RefreshCw, ThumbsUp, ThumbsDown, Edit3, Users, UserCircle, Send, Server as ServerIcon, Clapperboard } from "lucide-react";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import Image from "next/image";
import ReadMoreSynopsis from '@/components/anime/ReadMoreSynopsis';
import AnimeInteractionControls from '@/components/anime/anime-interaction-controls';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { cn } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import MoreLikeThisSection from "@/components/anime/MoreLikeThisSection";
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';


import PlyrComponent from "plyr-react";
import type Plyr from "plyr";
import "plyr/dist/plyr.css";
import Hls from 'hls.js';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/use-auth';
import type { ReportIssueType } from '@/types/report';
import { addReportToFirestore } from '@/services/reportService';


const reportFormSchema = z.object({
  issueType: z.enum([
    'video-not-playing',
    'wrong-video-episode',
    'audio-issue',
    'subtitle-issue',
    'buffering-lagging',
    'other',
  ], { required_error: "Please select an issue type." }),
  description: z.string().min(10, "Please provide a detailed description (min 10 characters).").max(500, "Description is too long (max 500 characters)."),
});
type ReportFormValues = z.infer<typeof reportFormSchema>;

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
  
  const plyrContainerRef = useRef<HTMLDivElement>(null); 
  const plyrInstanceRef = useRef<Plyr | null>(null); 
  const hlsInstanceRef = useRef<Hls | null>(null);
  
  const [displayMode, setDisplayMode] = useState<'plyr' | 'iframe' | 'none'>('none');

  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const { user: authUser } = useAuth();

  const [selectedSeasonNumber, setSelectedSeasonNumber] = useState<number>(1);

  const reportForm = useForm<ReportFormValues>({
    resolver: zodResolver(reportFormSchema),
    defaultValues: {
      issueType: 'video-not-playing',
      description: '',
    },
  });

  const handlePlyrError = useCallback((event: any) => {
    console.error("Plyr Player Error:", event);
    let errorMessage = "Could not load video. Try another server or episode.";
    
    if (activeSource?.type === 'm3u8' && typeof window !== 'undefined' && Hls && !Hls.isSupported()) {
      errorMessage = "HLS playback is not supported in your browser for this M3U8 stream.";
    } else if (event?.detail?.plyrError?.message) {
      errorMessage = `Player Error: ${event.detail.plyrError.message}`;
    } else if (typeof event === 'string') {
      errorMessage = event;
    } else if (event?.type === 'error' && event?.data?.details) {
      errorMessage = `HLS Error: ${event.data.details}`;
    }
    setPlayerError(errorMessage);
  }, [activeSource?.type]);
  
  const plyrOptions = useMemo((): Plyr.Options => ({
    autoplay: true,
    debug: process.env.NODE_ENV === 'development',
    listeners: {
      error: handlePlyrError, 
    },
  }), [handlePlyrError]);

  const fetchDetails = useCallback(async () => {
    if (!animeId) {
      setPlayerError("Anime ID is missing.");
      setPageIsLoading(false);
      setDisplayMode('none');
      return;
    }

    setPageIsLoading(true);
    setPlayerError(null);
    try {
      const details = await getAnimeById(animeId);
      if (details) {
        setAnime(details);
        
        const seasons = details.episodes ? Array.from(new Set(details.episodes.map(ep => ep.seasonNumber || 1))).sort((a, b) => a - b) : [1];
        const initialSeason = seasons[0] || 1;
        setSelectedSeasonNumber(initialSeason);

        const epIdFromUrl = searchParams.get("episode");
        let epToSet: Episode | undefined;

        if (epIdFromUrl) {
            const foundEpInUrlSeason = details.episodes?.find(e => e.id === epIdFromUrl);
            if (foundEpInUrlSeason) {
                setSelectedSeasonNumber(foundEpInUrlSeason.seasonNumber || 1);
                epToSet = foundEpInUrlSeason;
            }
        }
        
        if (!epToSet) {
            epToSet = details.episodes?.find(ep => (ep.seasonNumber || 1) === initialSeason && ep.sources && ep.sources.length > 0) ||
                      details.episodes?.find(ep => (ep.seasonNumber || 1) === initialSeason);
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
             setPlayerError("No episodes with playable sources available for the selected season.");
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
  
  const handleSeasonSelect = (seasonNum: number) => {
    setSelectedSeasonNumber(seasonNum);
    const firstEpisodeOfSeason = anime?.episodes?.find(ep => (ep.seasonNumber || 1) === seasonNum && ep.sources && ep.sources.length > 0) ||
                                anime?.episodes?.find(ep => (ep.seasonNumber || 1) === seasonNum);
    if (firstEpisodeOfSeason) {
      handleEpisodeSelect(firstEpisodeOfSeason);
    } else {
      setCurrentEpisode(null);
      setActiveSource(null);
      setPlayerError(`No episodes with playable sources found for Season ${seasonNum}.`);
    }
  };


  const handleServerSelect = (source: VideoSource) => {
    setPlayerError(null); 
    setActiveSource(source);
  };

  useEffect(() => {
    if (activeSource) {
      if (activeSource.type === 'embed') {
        if (hlsInstanceRef.current) { 
          hlsInstanceRef.current.destroy();
          hlsInstanceRef.current = null;
        }
        if (plyrInstanceRef.current?.playing) { 
          plyrInstanceRef.current.pause();
        }
        setDisplayMode('iframe');
      } else if (activeSource.type === 'mp4' || activeSource.type === 'm3u8') {
        setDisplayMode('plyr');
      } else {
        setDisplayMode('none'); 
      }
    } else { 
      setDisplayMode('none');
      if (hlsInstanceRef.current) {
        hlsInstanceRef.current.destroy();
        hlsInstanceRef.current = null;
      }
      if (plyrInstanceRef.current?.playing) {
        plyrInstanceRef.current.pause();
      }
    }
  }, [activeSource]);

  const plyrSourceToPlay = useMemo(() => {
    if (displayMode === 'plyr' && activeSource && (activeSource.type === 'mp4' || activeSource.type === 'm3u8')) {
      return {
        type: 'video' as const,
        title: `${anime?.title || 'Video'} - ${currentEpisode?.title || 'Episode'}`,
        sources: [{ src: activeSource.url, type: activeSource.type === 'm3u8' ? 'application/x-mpegURL' : 'video/mp4' }],
        poster: currentEpisode?.thumbnail || anime?.bannerImage || anime?.coverImage || `https://placehold.co/1280x720.png`,
      };
    }
    return undefined; 
  }, [displayMode, activeSource, anime, currentEpisode]);

  useEffect(() => {
    const videoElement = plyrInstanceRef.current?.media;

    if (hlsInstanceRef.current) {
      hlsInstanceRef.current.destroy();
      hlsInstanceRef.current = null;
    }

    if (plyrSourceToPlay && plyrSourceToPlay.sources[0].type === 'application/x-mpegURL' && videoElement) {
      if (Hls.isSupported()) {
        const hls = new Hls({
            onError: (event, data) => {
                if (data.fatal) {
                    console.error('HLS Fatal Error:', data);
                    handlePlyrError({ type: 'error', data }); 
                } else {
                    console.warn('HLS Non-Fatal Error:', data);
                }
            }
        });
        hls.loadSource(plyrSourceToPlay.sources[0].src);
        hls.attachMedia(videoElement as HTMLVideoElement);
        hlsInstanceRef.current = hls;
      } else if (videoElement instanceof HTMLVideoElement && videoElement.canPlayType('application/vnd.apple.mpegurl')) {
        videoElement.src = plyrSourceToPlay.sources[0].src;
      } else {
        handlePlyrError("HLS is not supported on this browser for M3U8 streams.");
      }
    }
    return () => {
      if (hlsInstanceRef.current) {
        hlsInstanceRef.current.destroy();
        hlsInstanceRef.current = null;
      }
    };
  }, [plyrSourceToPlay, handlePlyrError]);


  useEffect(() => {
    return () => {
      if (plyrInstanceRef.current) {
        try {
            plyrInstanceRef.current.destroy();
        } catch(e) {
            console.warn("Error destroying Plyr instance on component unmount:", e);
        }
        plyrInstanceRef.current = null;
      }
      if (hlsInstanceRef.current) {
        hlsInstanceRef.current.destroy();
        hlsInstanceRef.current = null;
      }
    };
  }, []);

  const handleReportSubmit = async (values: ReportFormValues) => {
    if (!anime || !currentEpisode || !activeSource) {
      toast({ variant: 'destructive', title: 'Error', description: 'Cannot submit report: missing context.' });
      return;
    }
    try {
      await addReportToFirestore({
        userId: authUser?.uid || null,
        userEmail: authUser?.email || null,
        animeId: anime.id,
        animeTitle: anime.title,
        episodeId: currentEpisode.id,
        episodeTitle: currentEpisode.title,
        sourceUrl: activeSource.url,
        sourceLabel: activeSource.label,
        issueType: values.issueType,
        description: values.description,
      });
      toast({ title: 'Report Submitted', description: 'Thank you for your feedback!' });
      setIsReportDialogOpen(false);
      reportForm.reset();
    } catch (error) {
      console.error('Failed to submit report:', error);
      toast({ variant: 'destructive', title: 'Submission Failed', description: 'Could not submit your report. Please try again.' });
    }
  };


  const issueTypes: { value: ReportIssueType; label: string }[] = [
    { value: 'video-not-playing', label: 'Video Not Playing' },
    { value: 'wrong-video-episode', label: 'Wrong Video / Episode' },
    { value: 'audio-issue', label: 'Audio Issue' },
    { value: 'subtitle-issue', label: 'Subtitle Issue' },
    { value: 'buffering-lagging', label: 'Buffering / Lagging' },
    { value: 'other', label: 'Other' },
  ];

  const placeholderEpisode = {
    id: 'placeholder-ep-1', title: 'Episode Title Placeholder', episodeNumber: 1, seasonNumber: 1,
    thumbnail: `https://placehold.co/320x180.png`, overview: 'This is a placeholder overview for the episode.',
    duration: '24min', sources: [{id: 'placeholder-src-1', url: '', type: 'mp4', label: 'Default Server', category: 'SUB' } as VideoSource]
  };
  const placeholderEpisodes = Array(10).fill(null).map((_, i) => ({
    ...placeholderEpisode, id: `placeholder-ep-${i+1}`, episodeNumber: i + 1,
    title: `Episode ${i + 1}: Placeholder`, thumbnail: `https://placehold.co/320x180.png?text=Ep+${i+1}`,
  }));

  const availableSeasons = useMemo(() => {
    if (!anime?.episodes) return [];
    const seasonNumbers = new Set(anime.episodes.map(ep => ep.seasonNumber || 1));
    return Array.from(seasonNumbers).sort((a, b) => a - b);
  }, [anime?.episodes]);

  const episodesForSelectedSeason = useMemo(() => {
    if (!anime?.episodes) return placeholderEpisodes;
    return anime.episodes
      .filter(ep => (ep.seasonNumber || 1) === selectedSeasonNumber)
      .sort((a, b) => (a.episodeNumber || 0) - (b.episodeNumber || 0));
  }, [anime?.episodes, selectedSeasonNumber, placeholderEpisodes]);


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
  
  const displayEpisode = currentEpisode || episodesForSelectedSeason[0] || placeholderEpisode;
  const displayAnime = anime || {
    id: 'placeholder-anime', title: 'Anime Title Placeholder', coverImage: `https://placehold.co/200x300.png`,
    bannerImage: `https://placehold.co/1280x300.png`, year: 2024, genre: ['Action', 'Adventure'],
    status: 'Ongoing', synopsis: 'Placeholder synopsis.', type: 'TV', isFeatured: false, episodes: placeholderEpisodes, averageRating: 7.5,
  } as Anime;

  const subServers = displayEpisode?.sources?.filter(s => s.category === 'SUB') || [];
  const dubServers = displayEpisode?.sources?.filter(s => s.category === 'DUB') || [];
  
  const iframeKey = activeSource ? `iframe-${activeSource.id}-${activeSource.url}` : 'no-iframe-source';

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground -mt-[calc(var(--header-height,4rem)+1px)] pt-[calc(var(--header-height,4rem)+1px)]">
      <Container className="py-4 md:py-6 flex-grow w-full">
        <div className="lg:grid lg:grid-cols-12 lg:gap-6 xl:gap-8 h-full">
          
          <div className="lg:col-span-8 xl:col-span-9 mb-6 lg:mb-0 h-full flex flex-col">
            <div className="aspect-video bg-black rounded-lg overflow-hidden shadow-2xl mb-4 w-full relative">
              
              <div ref={plyrContainerRef} style={{ display: displayMode === 'plyr' ? 'block' : 'none', width: '100%', height: '100%' }}>
                <PlyrComponent
                    ref={instance => plyrInstanceRef.current = instance} 
                    source={plyrSourceToPlay} 
                    options={plyrOptions}
                />
              </div>

              {displayMode === 'iframe' && activeSource && activeSource.type === 'embed' && (
                 <iframe
                    key={iframeKey} 
                    src={activeSource.url}
                    title={`${displayAnime?.title} - ${displayEpisode?.title}`}
                    className="w-full h-full border-0 rounded-lg absolute inset-0 z-[10]" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  ></iframe>
              )}
              
              {displayMode === 'none' && !pageIsLoading && !playerError && (
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
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 p-4 text-center z-30">
                  <AlertTriangle className="w-10 h-10 text-destructive mb-2" />
                  <p className="text-destructive-foreground text-sm">{playerError}</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={() => {
                    setPlayerError(null);
                    if (activeSource) handleServerSelect(activeSource);
                  }}>Dismiss</Button>
                </div>
              )}
            </div>

            <div className="player-report-banner p-3 rounded-lg text-sm flex items-center gap-2 mb-4">
              <MessageSquareWarning className="w-5 h-5 flex-shrink-0"/>
              <span>If the video is not working or is the wrong episode, please report it using the button below.</span>
            </div>

            <div className="px-1 sm:px-0 space-y-3 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate font-orbitron">
                  S{displayEpisode?.seasonNumber || '-'}:EP {displayEpisode?.episodeNumber || '-'}: {displayEpisode?.title || 'Episode Title Not Available'}
                </h1>
                <div className="flex items-center space-x-1.5">
                  <Button variant="outline" size="icon" className="w-8 h-8" title="Download (Coming Soon)"><Download size={16}/></Button>
                  
                  <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="icon" className="w-8 h-8" title="Report Issue">
                        <AlertTriangle size={16}/>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[480px] bg-card border-border">
                      <DialogHeader>
                        <DialogTitle className="text-primary">Report an Issue</DialogTitle>
                        <DialogDescription className="text-muted-foreground pt-1 text-xs">
                          Anime: {anime?.title} - Ep: {currentEpisode?.episodeNumber} ({currentEpisode?.title})
                          <br />
                          Source: {activeSource?.label} ({activeSource?.url})
                        </DialogDescription>
                      </DialogHeader>
                      <Form {...reportForm}>
                        <form onSubmit={reportForm.handleSubmit(handleReportSubmit)} className="space-y-4 pt-2">
                          <FormField
                            control={reportForm.control}
                            name="issueType"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Issue Type</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="bg-input border-border/70 focus:border-primary">
                                      <SelectValue placeholder="Select an issue type" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {issueTypes.map(type => (
                                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={reportForm.control}
                            name="description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                  <Textarea placeholder="Please describe the issue in detail..." {...field} className="bg-input border-border/70 focus:border-primary min-h-[80px]" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <DialogFooter className="pt-2">
                            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                            <Button type="submit" disabled={reportForm.formState.isSubmitting} className="btn-primary-gradient">
                              {reportForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                              Submit Report
                            </Button>
                          </DialogFooter>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>

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
            {availableSeasons.length > 1 && (
              <Card className="shadow-lg border-border/40">
                <CardHeader className="p-3 sm:p-4 pb-2">
                  <CardTitle className="text-md font-semibold text-primary flex items-center">
                    <Tv className="mr-2 w-5 h-5" /> Seasons
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 pt-0">
                  <ScrollArea className="w-full whitespace-nowrap">
                    <div className="flex space-x-2">
                      {availableSeasons.map(seasonNum => (
                        <Button
                          key={`season-${seasonNum}`}
                          variant={selectedSeasonNumber === seasonNum ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handleSeasonSelect(seasonNum)}
                          className={cn(
                            "transition-all duration-200 ease-in-out transform hover:scale-105",
                            selectedSeasonNumber === seasonNum ? "bg-primary text-primary-foreground shadow-md" : "border-border/70 hover:bg-primary/10 hover:border-primary"
                          )}
                        >
                          Season {seasonNum}
                        </Button>
                      ))}
                    </div>
                    <ScrollBar orientation="horizontal" />
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
            <Card className="shadow-lg border-border/40">
              <CardHeader className="p-3 sm:p-4 pb-2 sm:pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-md font-semibold text-primary flex items-center">
                      <List className="mr-2 w-5 h-5" /> Episodes ({episodesForSelectedSeason.length})
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
                    {episodesForSelectedSeason.length > 0 ? episodesForSelectedSeason.map((ep, idx) => (
                      <Button
                          key={ep.id || `placeholder-${idx}`}
                          variant={(currentEpisode?.id === ep.id && activeSource) ? 'secondary' : 'ghost'}
                          className={`w-full justify-start text-left h-auto py-2 px-2.5 text-xs ${
                          (currentEpisode?.id === ep.id && activeSource) ? 'bg-primary/20 text-primary font-semibold' : 'hover:bg-primary/10'
                          }`}
                          onClick={() => handleEpisodeSelect(ep)}
                          title={`Ep ${ep.episodeNumber}: ${ep.title}`}
                          disabled={!ep.sources || ep.sources.length === 0}
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
                    )) : (
                      <div className="p-4 text-center text-muted-foreground">
                        No episodes found for this season.
                      </div>
                    )}
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
                        <Suspense fallback={<Skeleton className="h-8 w-full rounded-md" />}>
                           <AnimeInteractionControls anime={anime} className="[&>button]:h-7 [&>button]:px-2 [&>button]:text-xs" />
                        </Suspense>
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
            
            {anime && <MoreLikeThisSection currentAnime={anime} />}


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

          </div>
        </div>
      </Container>
    </div>
  );
}

    

    