
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { getAllAnimes, updateAnimeEpisode } from '@/services/animeService';
import type { Anime, Episode, VideoSource } from '@/types/anime';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Save, AlertCircle, Video, Edit3, PlusCircle, Trash2, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

const videoSourceSchema = z.object({
  id: z.string().optional(),
  url: z.string().url({ message: "Please enter a valid URL." }).min(1, "URL is required."),
  label: z.string().min(1, "Label is required.").max(50, "Label too long."),
  type: z.enum(['mp4', 'm3u8', 'embed'], { required_error: "Type is required." }),
  category: z.enum(['SUB', 'DUB'], { required_error: "Category is required." }),
  quality: z.string().optional().or(z.literal('')),
});
type VideoSourceFormData = z.infer<typeof videoSourceSchema>;

const episodeSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Episode title is required."),
  episodeNumber: z.coerce.number(),
  seasonNumber: z.coerce.number(),
  thumbnail: z.string().url().optional().or(z.literal('')),
  duration: z.string().optional(),
  overview: z.string().optional(),
  sources: z.array(videoSourceSchema).optional(),
});
type EpisodeFormData = z.infer<typeof episodeSchema>;


export default function EpisodeEditorTab() {
  const [allAnimes, setAllAnimes] = useState<Anime[]>([]);
  const [selectedAnime, setSelectedAnime] = useState<Anime | null>(null);
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null);
  
  const [isLoadingAnimes, setIsLoadingAnimes] = useState(true);
  const [isUpdatingEpisode, setIsUpdatingEpisode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [isSourceDialogOpen, setIsSourceDialogOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<VideoSource | null>(null);
  const [sourceDialogKey, setSourceDialogKey] = useState(Date.now()); // To reset dialog form

  const { toast } = useToast();

  const sourceForm = useForm<VideoSourceFormData>({
    resolver: zodResolver(videoSourceSchema),
    defaultValues: { url: '', label: '', type: 'mp4', category: 'SUB', quality: '' },
  });

  const fetchAllAnimesCb = useCallback(async () => {
    setIsLoadingAnimes(true);
    setError(null);
    try {
      const animes = await getAllAnimes({ count: -1, filters: {} });
      setAllAnimes(animes.sort((a, b) => a.title.localeCompare(b.title)));
    } catch (err) {
      console.error('Failed to fetch animes for editor:', err);
      setError('Could not load anime list.');
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load anime list for editor.' });
    } finally {
      setIsLoadingAnimes(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAllAnimesCb();
  }, [fetchAllAnimesCb]);

  const handleAnimeSelect = (animeId: string) => {
    setError(null);
    const anime = allAnimes.find(a => a.id === animeId);
    setSelectedAnime(anime || null);
    setSelectedEpisode(null); // Reset selected episode when anime changes
  };

  const openAddSourceDialog = (episode: Episode) => {
    setSelectedEpisode(episode);
    setEditingSource(null);
    sourceForm.reset({ url: '', label: '', type: 'mp4', category: 'SUB', quality: '' });
    setSourceDialogKey(Date.now()); // Reset form by changing key
    setIsSourceDialogOpen(true);
  };

  const openEditSourceDialog = (episode: Episode, source: VideoSource) => {
    setSelectedEpisode(episode);
    setEditingSource(source);
    sourceForm.reset(source);
    setSourceDialogKey(Date.now());
    setIsSourceDialogOpen(true);
  };

  const handleSourceFormSubmit = async (data: VideoSourceFormData) => {
    if (!selectedAnime || !selectedEpisode) return;
    setIsUpdatingEpisode(true);

    let updatedSources: VideoSource[];
    if (editingSource) { // Editing existing source
      updatedSources = (selectedEpisode.sources || []).map(s => s.id === editingSource.id ? { ...s, ...data } : s);
    } else { // Adding new source
      const newSource: VideoSource = { ...data, id: `source-${Date.now()}-${Math.random().toString(36).substr(2, 5)}` };
      updatedSources = [...(selectedEpisode.sources || []), newSource];
    }

    try {
      await updateAnimeEpisode(selectedAnime.id, selectedEpisode.id, { sources: updatedSources });
      toast({ title: 'Episode Sources Updated', description: `Sources for Ep ${selectedEpisode.episodeNumber} of ${selectedAnime.title} saved.` });
      
      // Refresh local state
      setSelectedAnime(prevAnime => {
        if (!prevAnime) return null;
        return {
          ...prevAnime,
          episodes: (prevAnime.episodes || []).map(ep => 
            ep.id === selectedEpisode.id ? { ...ep, sources: updatedSources } : ep
          )
        };
      });
       setSelectedEpisode(prevEp => prevEp ? { ...prevEp, sources: updatedSources } : null);

      setIsSourceDialogOpen(false);
    } catch (err) {
      console.error('Failed to save episode sources:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      toast({ variant: 'destructive', title: 'Save Error', description: `Failed to save sources: ${errorMessage}` });
    } finally {
      setIsUpdatingEpisode(false);
    }
  };

  const handleDeleteSource = async (episode: Episode, sourceId: string) => {
    if (!selectedAnime) return;
    setIsUpdatingEpisode(true);
    const updatedSources = (episode.sources || []).filter(s => s.id !== sourceId);
    try {
      await updateAnimeEpisode(selectedAnime.id, episode.id, { sources: updatedSources });
      toast({ title: 'Source Deleted', description: `Source removed from Ep ${episode.episodeNumber}.` });
      setSelectedAnime(prevAnime => {
        if (!prevAnime) return null;
        return {
          ...prevAnime,
          episodes: (prevAnime.episodes || []).map(ep => 
            ep.id === episode.id ? { ...ep, sources: updatedSources } : ep
          )
        };
      });
       setSelectedEpisode(prevEp => prevEp ? { ...prevEp, sources: updatedSources } : null);
    } catch (err) {
      console.error('Failed to delete source:', err);
      toast({ variant: 'destructive', title: 'Delete Error', description: 'Failed to delete source.' });
    } finally {
      setIsUpdatingEpisode(false);
    }
  };
  
  const sortedEpisodes = React.useMemo(() => {
    return (selectedAnime?.episodes || []).slice().sort((a, b) => {
        if ((a.seasonNumber || 0) !== (b.seasonNumber || 0)) {
            return (a.seasonNumber || 0) - (b.seasonNumber || 0);
        }
        return (a.episodeNumber || 0) - (b.episodeNumber || 0);
    });
  }, [selectedAnime?.episodes]);


  return (
    <Card className="shadow-xl border-border/50">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-semibold text-primary flex items-center">
          <Edit3 className="w-6 h-6 mr-2" /> Advanced Episode & Source Editor
        </CardTitle>
        <CardDescription>Select an anime to manage its episodes and their video sources. Edit title, overview, and sources (URL, type, label, category, quality).</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <Label htmlFor="anime-select" className="font-medium">Select Anime/Movie</Label>
          <Select onValueChange={handleAnimeSelect} disabled={isLoadingAnimes || allAnimes.length === 0}>
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
            {sortedEpisodes.length === 0 ? (
              <p className="text-muted-foreground p-4 bg-muted/30 rounded-md text-center">
                No episodes found for this series. Add them via Manual Add or TMDB import.
              </p>
            ) : (
              <ScrollArea className="h-[calc(100vh-25rem)] lg:h-[calc(100vh-22rem)] pr-3 -mr-3 border border-border/30 rounded-lg p-1 bg-background/30 shadow-inner">
                <div className="space-y-4 p-3">
                  {sortedEpisodes.map((episode) => (
                    <EpisodeCard
                      key={episode.id}
                      episode={episode}
                      selectedAnimeType={selectedAnime.type}
                      onAddSource={() => openAddSourceDialog(episode)}
                      onEditSource={(source) => openEditSourceDialog(episode, source)}
                      onDeleteSource={(sourceId) => handleDeleteSource(episode, sourceId)}
                      isUpdating={isUpdatingEpisode}
                      onUpdateEpisodeDetails={async (epId, details) => {
                        if (!selectedAnime) return;
                        setIsUpdatingEpisode(true);
                        try {
                            await updateAnimeEpisode(selectedAnime.id, epId, details);
                            toast({ title: 'Episode Details Updated', description: `Details for Ep ${episode.episodeNumber} of ${selectedAnime.title} saved.` });
                            // Refresh local state for selectedAnime
                            setSelectedAnime(prevAnime => {
                                if (!prevAnime) return null;
                                return {
                                ...prevAnime,
                                episodes: (prevAnime.episodes || []).map(e => 
                                    e.id === epId ? { ...e, ...details } : e
                                )
                                };
                            });
                        } catch (err) {
                            console.error("Error updating episode details:", err);
                            toast({ variant: 'destructive', title: 'Update Error', description: 'Failed to update episode details.' });
                        } finally {
                            setIsUpdatingEpisode(false);
                        }
                      }}
                    />
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        )}
      </CardContent>
      
      <Dialog open={isSourceDialogOpen} onOpenChange={setIsSourceDialogOpen}>
        <DialogContent key={sourceDialogKey} className="sm:max-w-[550px] bg-card border-border shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-primary">{editingSource ? 'Edit Source' : 'Add New Source'}</DialogTitle>
            <DialogDescription>
              Provide details for the video source. Ensure URL is correct and accessible.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={sourceForm.handleSubmit(handleSourceFormSubmit)} className="space-y-4 py-2">
            <FormFieldItem name="label" label="Label / Server Name" placeholder="e.g., Server A - FastStream, VidPlay SUB" form={sourceForm} />
            <FormFieldItem name="url" label="Video URL (.mp4, .m3u8, or embed link)" placeholder="https://example.com/video.mp4" form={sourceForm} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormSelectItemField name="type" label="Type" items={['mp4', 'm3u8', 'embed']} form={sourceForm} placeholder="Select source type"/>
                <FormSelectItemField name="category" label="Category" items={['SUB', 'DUB']} form={sourceForm} placeholder="Select category"/>
            </div>
            <FormFieldItem name="quality" label="Quality (Optional)" placeholder="e.g., 720p, 1080p, HD" form={sourceForm} />
            <DialogFooter className="pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={isUpdatingEpisode} className="btn-primary-gradient">
                {isUpdatingEpisode ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {editingSource ? 'Save Changes' : 'Add Source'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// Episode Card Component
interface EpisodeCardProps {
  episode: Episode;
  selectedAnimeType: Anime['type'];
  onAddSource: () => void;
  onEditSource: (source: VideoSource) => void;
  onDeleteSource: (sourceId: string) => void;
  isUpdating: boolean;
  onUpdateEpisodeDetails: (episodeId: string, details: Partial<Pick<Episode, 'title' | 'overview' | 'duration' | 'thumbnail'>>) => Promise<void>;
}

function EpisodeCard({ episode, selectedAnimeType, onAddSource, onEditSource, onDeleteSource, isUpdating, onUpdateEpisodeDetails }: EpisodeCardProps) {
  const [localTitle, setLocalTitle] = useState(episode.title);
  const [localOverview, setLocalOverview] = useState(episode.overview || '');
  const [localDuration, setLocalDuration] = useState(episode.duration || '');
  const [localThumbnail, setLocalThumbnail] = useState(episode.thumbnail || '');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setLocalTitle(episode.title);
    setLocalOverview(episode.overview || '');
    setLocalDuration(episode.duration || '');
    setLocalThumbnail(episode.thumbnail || '');
    setHasChanges(false);
  }, [episode]);

  const handleDetailChange = () => setHasChanges(true);

  const handleSaveDetails = () => {
    onUpdateEpisodeDetails(episode.id, {
      title: localTitle,
      overview: localOverview,
      duration: localDuration,
      thumbnail: localThumbnail,
    });
    setHasChanges(false);
  };


  return (
     <Card className="bg-card/80 border-border/50 shadow-md hover:shadow-primary/10 transition-shadow">
      <CardHeader className="p-3 sm:p-4 pb-2">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
            <div className="flex-grow">
                <Label htmlFor={`ep-title-${episode.id}`} className="text-xs text-muted-foreground">S{episode.seasonNumber || 1} Ep{episode.episodeNumber || 1} Title</Label>
                <Input 
                    id={`ep-title-${episode.id}`} 
                    value={localTitle} 
                    onChange={(e) => { setLocalTitle(e.target.value); handleDetailChange(); }}
                    className="h-9 text-sm font-medium bg-input focus:border-primary"
                    placeholder="Episode Title"
                    disabled={selectedAnimeType === 'Movie'}
                />
            </div>
          <Button onClick={onAddSource} size="sm" variant="outline" className="mt-2 sm:mt-0 text-xs hover:bg-primary/10 hover:border-primary self-start sm:self-center">
            <PlusCircle className="mr-1.5 h-3.5 w-3.5" /> Add Source
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 pt-2 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label htmlFor={`ep-overview-${episode.id}`} className="text-xs text-muted-foreground">Overview (Optional)</Label>
            <Input id={`ep-overview-${episode.id}`} value={localOverview} onChange={(e) => { setLocalOverview(e.target.value); handleDetailChange(); }} className="h-9 text-sm bg-input" placeholder="Short summary..." disabled={selectedAnimeType === 'Movie'} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
                <Label htmlFor={`ep-duration-${episode.id}`} className="text-xs text-muted-foreground">Duration</Label>
                <Input id={`ep-duration-${episode.id}`} value={localDuration} onChange={(e) => { setLocalDuration(e.target.value); handleDetailChange(); }} className="h-9 text-sm bg-input" placeholder="e.g., 24min" />
            </div>
            <div>
                <Label htmlFor={`ep-thumb-${episode.id}`} className="text-xs text-muted-foreground">Thumbnail URL</Label>
                <Input id={`ep-thumb-${episode.id}`} value={localThumbnail} onChange={(e) => { setLocalThumbnail(e.target.value); handleDetailChange(); }} type="url" className="h-9 text-sm bg-input" placeholder="https://..." />
            </div>
          </div>
        </div>
         {hasChanges && (
            <Button onClick={handleSaveDetails} size="sm" className="text-xs py-1.5 h-auto btn-primary-gradient" disabled={isUpdating}>
                {isUpdating ? <Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> : <Save className="mr-1.5 h-3 w-3" />}
                Save Details
            </Button>
        )}
        
        <Separator className="my-3 bg-border/50" />
        
        <h5 className="text-xs font-semibold text-muted-foreground mb-1.5">VIDEO SOURCES ({episode.sources?.length || 0})</h5>
        {(episode.sources && episode.sources.length > 0) ? (
          <div className="space-y-2.5">
            {episode.sources.map(source => (
              <div key={source.id} className="flex items-center justify-between p-2.5 rounded-md bg-muted/40 border border-border/40 shadow-sm hover:border-primary/30 transition-colors">
                <div className="flex-grow min-w-0 space-y-0.5">
                  <p className="text-sm font-medium text-foreground truncate" title={source.label}>{source.label}</p>
                  <p className="text-xs text-muted-foreground truncate" title={source.url}>{source.url}</p>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Badge variant="secondary" className="text-[0.65rem] px-1.5 py-0.5">{source.type.toUpperCase()}</Badge>
                    <Badge variant={source.category === 'DUB' ? 'default' : 'outline'} className={`text-[0.65rem] px-1.5 py-0.5 ${source.category === 'DUB' ? 'bg-sky-500/20 text-sky-600 border-sky-500/30' : ''}`}>{source.category}</Badge>
                    {source.quality && <Badge variant="outline" className="text-[0.65rem] px-1.5 py-0.5">{source.quality}</Badge>}
                  </div>
                </div>
                <div className="flex-shrink-0 flex items-center gap-1.5 ml-2">
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => onEditSource(source)} disabled={isUpdating}>
                    <Edit3 size={14} /> <span className="sr-only">Edit</span>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                       <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" disabled={isUpdating}>
                        <Trash2 size={14} /> <span className="sr-only">Delete</span>
                      </Button>
                    </AlertDialogTrigger>
                     <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Delete Source</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete the source: <span className="font-semibold">{source.label}</span>? This action cannot be undone.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onDeleteSource(source.id)} className="bg-destructive hover:bg-destructive/90">
                            Delete Source
                        </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-2 italic">No video sources added for this episode yet.</p>
        )}
      </CardContent>
    </Card>
  );
}


// Reusable Form Field Components for the Dialog
interface FormFieldItemProps {
  name: keyof VideoSourceFormData;
  label: string;
  placeholder?: string;
  form: ReturnType<typeof useForm<VideoSourceFormData>>;
  type?: string;
}
function FormFieldItem({ name, label, placeholder, form, type = "text" }: FormFieldItemProps) {
  const { register, formState: { errors } } = form;
  return (
    <div className="space-y-1">
      <Label htmlFor={name} className="text-sm font-medium">{label}</Label>
      <Input id={name} type={type} placeholder={placeholder} {...register(name)} className="bg-input h-9 text-sm focus:border-primary" />
      {errors[name] && <p className="text-xs text-destructive mt-0.5">{(errors[name] as any).message}</p>}
    </div>
  );
}

interface FormSelectItemFieldProps {
  name: keyof VideoSourceFormData;
  label: string;
  items: string[];
  form: ReturnType<typeof useForm<VideoSourceFormData>>;
  placeholder?: string;
}
function FormSelectItemField({ name, label, items, form, placeholder }: FormSelectItemFieldProps) {
  const { control, formState: { errors } } = form;
  return (
    <div className="space-y-1">
      <Label htmlFor={name} className="text-sm font-medium">{label}</Label>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <Select onValueChange={field.onChange} value={String(field.value)} defaultValue={String(field.value)}>
            <SelectTrigger id={name} className="bg-input h-9 text-sm focus:border-primary">
              <SelectValue placeholder={placeholder || `Select ${label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {items.map(item => (
                <SelectItem key={item} value={item} className="text-sm">{item.toUpperCase()}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
      {errors[name] && <p className="text-xs text-destructive mt-0.5">{(errors[name] as any).message}</p>}
    </div>
  );
}


    