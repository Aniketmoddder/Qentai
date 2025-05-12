
import { getAnimeById } from '@/services/animeService';
import type { Anime, Episode } from '@/types/anime';
import Container from '@/components/layout/container';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, PlayCircle, CalendarDays, Tv, Film, ListVideo, List, ChevronRight, AlertTriangle, Users, ShieldCheck, Info, ExternalLink, Tag as GenreIcon, Clapperboard, UserSquare2, BookOpen, History as HistoryIcon, Globe2, Loader2, RefreshCw, ArrowUpDown, Settings2, LayoutGrid, Users2Icon } from 'lucide-react';
import Link from 'next/link';
import AnimeInteractionControls from '@/components/anime/anime-interaction-controls'; 
import CharacterCarousel from '@/components/anime/CharacterCarousel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from '@/lib/utils';
import React, { Suspense } from 'react';
import Logo from '@/components/common/logo';
import ReadMoreSynopsis from '@/components/anime/ReadMoreSynopsis';
import { Skeleton } from '@/components/ui/skeleton';
import EpisodeListSection from '@/components/anime/EpisodeListSection';

interface AnimeDetailsPageProps {
  params: {
    id: string;
  };
}

const DetailItem: React.FC<{ label: string; value?: string | number | null; icon?: React.ElementType; children?: React.ReactNode }> = ({ label, value, icon: Icon, children }) => {
  if (!value && !children) return null;
  return (
    <div className="flex justify-between items-start py-2.5 text-sm">
      <span className="text-muted-foreground font-medium flex items-center">
        {Icon && <Icon className="w-4 h-4 mr-2 opacity-80" />}
        {label}
      </span>
      {children ? <div className="text-right text-foreground">{children}</div> : <span className="text-right text-foreground">{value}</span>}
    </div>
  );
};

export default async function AnimeDetailsPage({ params }: AnimeDetailsPageProps) {
  let anime: Anime | undefined;
  let fetchError: string | null = null;

  try {
    anime = await getAnimeById(params.id);
  } catch (error) {
    console.error(`Failed to fetch anime details for ID ${params.id}:`, error);
    if (error instanceof Error && error.message.includes("index")) {
         fetchError = `Could not load anime details. A required database index might be missing or the data source is unavailable. Details: ${error.message}`;
    } else if (error instanceof Error) {
        fetchError = `Error fetching details: ${error.message}`;
    }
     else {
        fetchError = "Could not load anime details. Please try again later.";
    }
  }

  if (fetchError) {
    return (
      <Container className="py-12 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-bold text-destructive">Error Loading Anime</h1>
        <p className="text-muted-foreground">{fetchError}</p>
        <Button asChild variant="link" className="mt-4">
          <Link href="/">Go back to Home</Link>
        </Button>
      </Container>
    );
  }
  
  if (!anime) {
    return (
      <Container className="py-12 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-muted mb-4" />
        <h1 className="text-2xl font-bold text-destructive">Anime Not Found</h1>
        <p className="text-muted-foreground">Sorry, we couldn&apos;t find details for this anime (ID: {params.id}). It might have been removed or the ID is incorrect.</p>
        <Button asChild variant="link" className="mt-4">
          <Link href="/">Go back to Home</Link>
        </Button>
      </Container>
    );
  }

  const typeIconMap: Record<string, JSX.Element> = {
    TV: <Tv className="w-4 h-4 mr-1.5" />,
    Movie: <Film className="w-4 h-4 mr-1.5" />,
    OVA: <ListVideo className="w-4 h-4 mr-1.5" />,
    Special: <ListVideo className="w-4 h-4 mr-1.5" />,
    ONA: <ListVideo className="w-4 h-4 mr-1.5" />,
    Music: <Film className="w-4 h-4 mr-1.5" />, 
    Unknown: <Info className="w-4 h-4 mr-1.5" />, 
  };
  
  const primaryImageSrc = anime.bannerImage || `https://picsum.photos/seed/${anime.id}-banner/1600/600`;
  const coverImageSrc = anime.coverImage || `https://picsum.photos/seed/${anime.id}-cover/400/600`;
  const firstEpisodeId = anime.episodes?.[0]?.id || '';

  const airedDateString = [
    anime.airedFrom ? new Date(anime.airedFrom).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : null,
    anime.airedTo ? new Date(anime.airedTo).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : null
  ].filter(Boolean).join(' to ');


  return (
    <div className="min-h-screen text-foreground">
      <section 
        className="relative h-[40vh] sm:h-[45vh] md:h-[50vh] lg:h-[55vh] w-full -mt-[calc(var(--header-height,4rem)+1px)] bg-card"
      >
        <Image
          src={primaryImageSrc}
          alt={`${anime.title || 'Anime'} banner`}
          fill
          className="object-cover opacity-40"
          priority
          data-ai-hint="anime landscape epic"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/50 via-transparent to-transparent md:hidden" />
      </section>

      <Container className="relative z-10 -mt-[20vh] sm:-mt-[180px] md:-mt-[200px] lg:-mt-[220px] pb-16">
        <div className="md:grid md:grid-cols-12 md:gap-6 lg:gap-8">
          <div className="md:col-span-4 lg:col-span-3">
             <div className="sticky top-[calc(var(--header-height,4rem)+1.5rem)] max-w-[200px] sm:max-w-[220px] mx-auto md:mx-0">
              <div className="aspect-[2/3] relative rounded-xl overflow-hidden shadow-2xl border-2 border-border/20 bg-card">
                <Image
                  src={coverImageSrc}
                  alt={anime.title || 'Anime cover'}
                  fill
                  sizes="(max-width: 640px) 200px, (max-width: 768px) 220px, (max-width: 1024px) 33vw, 25vw"
                  className="object-cover" 
                  data-ai-hint={`${anime.genre?.[0] || 'anime'} portrait`}
                />
              </div>
            </div>
          </div>

          <div className="md:col-span-8 lg:col-span-9 mt-6 md:mt-0">
            <div className="flex flex-col items-center sm:items-start space-y-3 sm:space-y-4 mb-5 sm:mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground font-zen-dots leading-tight text-center sm:text-left line-clamp-2">
                {anime.title || 'Anime Title Not Available'}
              </h1>
              
              <div className="w-full max-w-sm sm:max-w-md md:max-w-none mx-auto sm:mx-0 flex flex-col sm:flex-row gap-2.5 sm:gap-3">
                <Button 
                  asChild 
                  size="lg" 
                  className="w-full sm:flex-1 btn-primary-gradient font-semibold py-2.5 sm:py-3 rounded-lg text-sm sm:text-base"
                >
                  <Link href={`/play/${anime.id}${firstEpisodeId ? `?episode=${firstEpisodeId}` : ''}`}>
                    <PlayCircle className="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> Watch Now
                  </Link>
                </Button>
                
                <Suspense fallback={
                  <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-2.5 sm:gap-3">
                    <Skeleton className="h-12 w-full sm:w-40 rounded-lg" />
                    <Skeleton className="h-12 w-full sm:w-40 rounded-lg" />
                  </div>
                }>
                  <AnimeInteractionControls anime={anime} className="[&>button]:py-2.5 [&>button]:sm:py-3 [&>button]:text-sm [&>button]:sm:text-base" />
                </Suspense>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-1.5 text-xs sm:text-sm text-muted-foreground mb-5 sm:mb-6">
              {anime.format && <div className="flex items-center">{typeIconMap[anime.format] || <Info className="w-3.5 h-3.5 mr-1" />} <span className="font-medium">{anime.format}</span></div>}
              {anime.format && <span className="opacity-50 hidden sm:inline">•</span>}
              <div className="flex items-center"><CalendarDays className="w-3.5 h-3.5 mr-1" /> <span className="font-medium">{anime.seasonYear || anime.year}</span></div>
              {anime.averageRating !== undefined && anime.averageRating !== null && (
                <>
                  <span className="opacity-50 hidden sm:inline">•</span>
                  <div className="flex items-center">
                    <Star className="w-3.5 h-3.5 mr-1 text-yellow-400 fill-yellow-400" />
                    <span className="font-semibold text-foreground">{anime.averageRating.toFixed(1)}</span>
                    <span className="text-xs ml-0.5">/10</span>
                  </div>
                </>
              )}
              <span className="opacity-50 hidden sm:inline">•</span>
              <Badge 
                variant={anime.status === 'Completed' || anime.status === 'FINISHED' ? 'default' : 'secondary'} 
                className={cn(
                  "text-xs font-medium",
                  (anime.status === 'Completed' || anime.status === 'FINISHED') && 'bg-green-500/20 text-green-600 border-green-500/30 dark:bg-green-500/15 dark:text-green-400 dark:border-green-500/40',
                  (anime.status === 'Ongoing' || anime.status === 'Airing' || anime.status === 'RELEASING') && 'bg-sky-500/20 text-sky-600 border-sky-500/30 dark:bg-sky-500/15 dark:text-sky-400 dark:border-sky-500/40',
                  (anime.status === 'Upcoming' || anime.status === 'Not Yet Aired') && 'bg-amber-500/20 text-amber-600 border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/40',
                )}
              >
                {(anime.status === 'Completed' || anime.status === 'FINISHED') && <ShieldCheck className="w-3 h-3 mr-1" />}
                {anime.status}
              </Badge>
            </div>

            <Tabs defaultValue="overview" className="w-full">
                <div className="relative border-b border-border/40 mb-5 sm:mb-6">
                  <TabsList className="flex space-x-2 sm:space-x-4 bg-transparent p-0 overflow-x-auto scrollbar-hide">
                    {['Overview', 'Characters', 'Relations', 'Artwork'].map(tabName => (
                      <TabsTrigger
                        key={tabName}
                        value={tabName.toLowerCase()}
                        className={cn(
                          "relative px-1 py-2.5 text-sm font-medium whitespace-nowrap transition-colors duration-200",
                          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-background",
                          "data-[state=inactive]:text-muted-foreground data-[state=active]:text-primary data-[state=active]:font-semibold",
                          "hover:text-primary",
                          "after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-transparent after:transition-transform after:duration-200 after:ease-in-out",
                          "data-[state=active]:after:bg-primary data-[state=active]:after:scale-x-100",
                          "data-[state=inactive]:after:scale-x-0 hover:after:scale-x-50 hover:after:bg-primary/50"
                        )}
                      >
                        {tabName}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>
              
              <TabsContent value="overview" className="bg-transparent p-0">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-0 gap-y-8 lg:gap-x-8">
                    <div className="lg:col-span-8 space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg sm:text-xl font-semibold text-foreground font-orbitron flex items-center">
                                <div className="w-1.5 h-6 bg-primary rounded-full mr-2.5"></div>
                                Description
                            </h3>
                            <div className="flex items-center gap-x-2">
                               <Logo iconSize={20} className="opacity-70 hover:opacity-100 transition-opacity"/>
                                {anime.trailerUrl && (
                                    <Button variant="outline" size="sm" asChild className="text-xs hover:border-primary hover:text-primary">
                                        <Link href={anime.trailerUrl} target="_blank" rel="noopener noreferrer" className="flex items-center">
                                             Trailer <ExternalLink size={12} className="ml-1.5 opacity-70"/>
                                        </Link>
                                    </Button>
                                )}
                            </div>
                        </div>
                        <ReadMoreSynopsis text={anime.synopsis || "No synopsis available."} />
                    </div>
                    <div className="lg:col-span-4">
                         <h3 className="text-lg sm:text-xl font-semibold text-foreground font-orbitron mb-2 flex items-center">
                            <div className="w-1.5 h-6 bg-primary rounded-full mr-2.5"></div>
                            Details
                        </h3>
                        <div className="space-y-0.5 border-t border-border/20 pt-2">
                            <DetailItem label="Type" value={anime.format || anime.type} icon={typeIconMap[anime.format || anime.type || 'Unknown'] ? undefined : Info } >
                                {typeIconMap[anime.format || anime.type || 'Unknown']} <span className="ml-1">{anime.format || anime.type || 'N/A'}</span>
                            </DetailItem>
                            <DetailItem label="Episodes" value={anime.episodesCount || anime.episodes?.length || 'N/A'} icon={List} />
                            <DetailItem label="Genres" icon={GenreIcon}>
                              <div className="flex flex-wrap gap-1 justify-end">
                                {anime.genre?.map((g, index) => <Badge key={`${g}-${index}`} variant="secondary" className="text-xs">{g}</Badge>)}
                                {(!anime.genre || anime.genre.length === 0) && 'N/A'}
                              </div>
                            </DetailItem>
                            <DetailItem label="Aired" value={airedDateString || 'N/A'} icon={CalendarDays} />
                            <DetailItem label="Status" value={anime.status} icon={ShieldCheck} />
                            <DetailItem label="Season" value={`${anime.season || ''} ${anime.seasonYear || anime.year}`} icon={Clapperboard} />
                            <DetailItem label="Country" value={anime.countryOfOrigin} icon={Globe2} />
                            <DetailItem label="Studios" icon={UserSquare2}>
                               <div className="flex flex-wrap gap-1 justify-end">
                                  {anime.studios?.map((s, index) => <Badge key={`${s.id}-${index}`} variant="outline" className="text-xs">{s.name}</Badge>)}
                                  {(!anime.studios || anime.studios.length === 0) && 'N/A'}
                                </div>
                            </DetailItem>
                            <DetailItem label="Source" value={anime.source} icon={BookOpen} />
                            <DetailItem label="Duration" value={anime.duration ? `${anime.duration} min/ep` : 'N/A'} icon={HistoryIcon} />
                            <DetailItem label="Popularity" value={anime.popularity?.toLocaleString()} icon={Users} />
                        </div>
                    </div>
                </div>
                <EpisodeListSection anime={anime} />
              </TabsContent>

              <TabsContent value="characters" className="p-0 sm:p-0 rounded-lg relative overflow-hidden">
                <h3 className="text-2xl md:text-3xl font-bold text-foreground mt-4 mb-5 font-orbitron">
                     Anime Characters
                </h3>
                <Suspense fallback={<div className="h-48 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
                  <CharacterCarousel characters={anime.characters} />
                </Suspense>
                <EpisodeListSection anime={anime} />
              </TabsContent>

              <TabsContent value="relations" className="bg-card/50 p-4 sm:p-6 rounded-lg border border-border/20 shadow-inner">
                 <h3 className="text-xl font-semibold text-foreground font-orbitron mb-3">Relations</h3>
                 <p className="text-muted-foreground">Related anime information will be displayed here.</p>
                 <EpisodeListSection anime={anime} />
              </TabsContent>

              <TabsContent value="artwork" className="bg-card/50 p-4 sm:p-6 rounded-lg border border-border/20 shadow-inner">
                <h3 className="text-xl font-semibold text-foreground font-orbitron mb-3">Artwork</h3>
                <p className="text-muted-foreground">Artwork, posters, and fan art will be displayed here.</p>
                <EpisodeListSection anime={anime} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </Container>
    </div>
  );
}
