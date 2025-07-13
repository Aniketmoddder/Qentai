
'use client';

import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { addAnimeToFirestore, getAllAnimes } from '@/services/animeService';
import type { Anime, Episode, VideoSource } from '@/types/anime';
import { Loader2, PlusCircle, Trash2, Save, CloudUpload, Youtube, Wand, Link as LinkIcon, Edit3, XCircle, ServerIcon, Clapperboard } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { slugify } from '@/lib/stringUtils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger as AlertDialogTriggerPrimitive } from "@/components/ui/alert-dialog"; 
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Form } from '@/components/ui/form';

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
  id: z.string().optional(),
  title: z.string().min(1, 'Episode title is required'),
  episodeNumber: z.coerce.number().min(0, 'Episode number must be 0 or positive (0 for movies/specials if needed)'),
  seasonNumber: z.coerce.number().min(0, 'Season number must be 0 or positive (0 for movies/specials if needed)'),
  thumbnail: z.string().url('Must be a valid URL for thumbnail').optional().or(z.literal('')),
  duration: z.string().optional(),
  overview: z.string().optional(),
  sources: z.array(videoSourceSchema).optional().default([]), 
});

const animeSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  coverImage: z.string().url('Cover image URL is required'),
  bannerImage: z.string().url('Banner image URL is optional').optional().or(z.literal('')),
  year: z.coerce.number().min(1900, 'Year must be valid').max(new Date().getFullYear() + 10, 'Year seems too far in future'),
  genre: z.array(z.string()).min(1, 'At least one genre is required'),
  status: z.enum(['Ongoing', 'Completed', 'Upcoming', 'Unknown']),
  synopsis: z.string().min(10, 'Synopsis must be at least 10 characters'),
  type: z.enum(['TV', 'Movie', 'OVA', 'Special', 'Unknown']),
  trailerUrl: z.string().url('Must be a valid YouTube URL').optional().or(z.literal('')),
  downloadPageUrl: z.string().url('Must be a valid URL for download page').optional().or(z.literal('')),
  sourceAdmin: z.literal('manual').default('manual'),
  episodes: z.array(episodeSchema).optional(),
  aniListId: z.coerce.number().int().positive('AniList ID must be a positive number.').optional().nullable().transform(val => val === '' || val === null ? null : Number(val)),
});

type AnimeFormData = z.infer<typeof animeSchema>;

const INITIAL_GENRES = ['Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Sci-Fi', 'Slice of Life', 'Romance', 'Horror', 'Mystery', 'Thriller', 'Sports', 'Supernatural', 'Mecha', 'Historical', 'Music', 'School', 'Shounen', 'Shoujo', 'Seinen', 'Josei', 'Isekai', 'Psychological', 'Ecchi', 'Harem', 'Demons', 'Magic', 'Martial Arts', 'Military', 'Parody', 'Police', 'Samurai', 'Space', 'Super Power', 'Vampire', 'Game'];


export default function ManualAddTab() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [availableGenres, setAvailableGenres] = useState<string[]>(INITIAL_GENRES);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

  const [isSourceDialogOpen, setIsSourceDialogOpen] = useState(false);
  const [currentEpisodeIndex, setCurrentEpisodeIndex] = useState<number | null>(null);
  const [editingSourceInfo, setEditingSourceInfo] = useState<{ episodeIndex: number; sourceIndex: number; source: VideoSourceFormData } | null>(null);
  const [sourceDialogKey, setSourceDialogKey] = useState(Date.now());

  const form = useForm<AnimeFormData>({
    resolver: zodResolver(animeSchema),
    defaultValues: {
      title: '', coverImage: '', bannerImage: '', year: new Date().getFullYear(), genre: [], status: 'Unknown',
      synopsis: '', type: 'TV', trailerUrl: '', downloadPageUrl: '', sourceAdmin: 'manual', episodes: [], aniListId: null,
    },
  });

  const { fields: episodeFields, append: appendEpisode, remove: removeEpisode, update: updateEpisodeField, replace: replaceEpisodes } = useFieldArray({
    control: form.control, name: "episodes"
  });
  
  const watchType = form.watch("type");
  const watchTitle = form.watch("title");

  useEffect(() => {
    const fetchAllUniqueGenres = async () => {
        try {
            const animes = await getAllAnimes({ count: -1 });
            const uniqueGenresFromDB = new Set<string>();
            animes.forEach(anime => anime.genre.forEach(g => {
                 if (typeof g === 'string' && g.trim() !== '') { uniqueGenresFromDB.add(g.trim()); }
            }));
            const combinedGenres = new Set([...INITIAL_GENRES, ...Array.from(uniqueGenresFromDB)]);
            setAvailableGenres(Array.from(combinedGenres).sort());
        } catch (error) {
            console.warn("Could not fetch all unique genres, using predefined list.", error);
            setAvailableGenres(INITIAL_GENRES.sort());
        }
    };
    fetchAllUniqueGenres();
  }, []);

  useEffect(() => {
    const animeTitleSlug = slugify(watchTitle || 'movie');
    if (watchType === 'Movie') {
        if (episodeFields.length === 0 || (episodeFields.length > 0 && episodeFields[0].title !== "Full Movie")) {
             replaceEpisodes([{
                id: `${animeTitleSlug}-s1e1-${Date.now()}`.toLowerCase(), title: "Full Movie", episodeNumber: 1, seasonNumber: 1,
                sources: [], thumbnail: '', duration: '', overview: ''
            }]);
        }
    } else {
        if (episodeFields.length === 1 && episodeFields[0].title === "Full Movie") {
            replaceEpisodes([]);
        }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchType, watchTitle, replaceEpisodes]); // Removed episodeFields from dependency array to avoid loop on RHF update

  const handleGenreChange = (genre: string) => {
    const newSelectedGenres = selectedGenres.includes(genre) ? selectedGenres.filter(g => g !== genre) : [...selectedGenres, genre];
    setSelectedGenres(newSelectedGenres);
    form.setValue('genre', newSelectedGenres, { shouldValidate: true });
  };

  const onSubmit = async (data: AnimeFormData) => {
    setIsLoading(true);
    try {
      const animeDataForDb: Omit<Anime, 'id' | 'createdAt' | 'updatedAt'> = {
        ...data,
        aniListId: data.aniListId || undefined,
        episodes: (data.episodes || []).map((ep, index) => {
            const animeTitleSlug = slugify(data.title || `item-${index}`);
            return {
                ...ep,
                id: ep.id || `${animeTitleSlug}-s${ep.seasonNumber || 1}e${ep.episodeNumber || (index + 1)}-${Date.now()}`.toLowerCase(),
                sources: (ep.sources || []).map((source, sourceIdx) => ({
                    ...source,
                    id: source.id || `source-${animeTitleSlug}-ep${ep.episodeNumber || index}-${Date.now()}-${sourceIdx}`,
                    url: source.url || '', 
                })),
                url: undefined, 
            };
        }),
        trailerUrl: data.trailerUrl || undefined,
        downloadPageUrl: data.downloadPageUrl || undefined,
      };

      const newAnimeId = await addAnimeToFirestore(animeDataForDb);
      toast({ title: 'Content Added', description: `${data.title} has been successfully added with ID: ${newAnimeId}.` });
      form.reset();
      setSelectedGenres([]);
      replaceEpisodes([]);
    } catch (err) {
      console.error('Failed to add content:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      toast({ variant: 'destructive', title: 'Save Error', description: `Failed to add content: ${errorMessage}` });
    } finally {
      setIsLoading(false);
    }
  };

  const sourceFormMethods = useForm<VideoSourceFormData>({
    resolver: zodResolver(videoSourceSchema),
    defaultValues: { url: '', label: '', type: 'mp4', category: 'SUB', quality: '' },
  });

  const openAddSourceDialog = (epIndex: number) => {
    setCurrentEpisodeIndex(epIndex);
    setEditingSourceInfo(null);
    sourceFormMethods.reset({ url: '', label: '', type: 'mp4', category: 'SUB', quality: '' });
    setSourceDialogKey(Date.now());
    setIsSourceDialogOpen(true);
  };

  const openEditSourceDialog = (epIndex: number, source: VideoSourceFormData, sourceIdx: number) => {
    setCurrentEpisodeIndex(epIndex);
    setEditingSourceInfo({ episodeIndex: epIndex, sourceIndex: sourceIdx, source: source });
    sourceFormMethods.reset(source);
    setSourceDialogKey(Date.now());
    setIsSourceDialogOpen(true);
  };

  const handleSourceFormSubmit = (data: VideoSourceFormData) => {
    if (currentEpisodeIndex === null) return;
    
    const currentEp = form.getValues(`episodes.${currentEpisodeIndex}`);
    let updatedSources: VideoSourceFormData[];

    if (editingSourceInfo && editingSourceInfo.episodeIndex === currentEpisodeIndex) { // Editing
      updatedSources = (currentEp.sources || []).map((s, idx) =>
        idx === editingSourceInfo.sourceIndex ? { ...s, ...data, id: s.id || `source-${Date.now()}` } : s 
      );
    } else { // Adding
      const newSource: VideoSourceFormData = { ...data, id: `source-${Date.now()}-${Math.random().toString(36).substr(2, 5)}` };
      updatedSources = [...(currentEp.sources || []), newSource];
    }
    updateEpisodeField(currentEpisodeIndex, { ...currentEp, sources: updatedSources });
    setIsSourceDialogOpen(false);
    setEditingSourceInfo(null);
    setCurrentEpisodeIndex(null);
  };

  const handleDeleteSource = (epIndex: number, sourceIndex: number) => {
    const currentEp = form.getValues(`episodes.${epIndex}`);
    const updatedSources = (currentEp.sources || []).filter((_, idx) => idx !== sourceIndex);
    updateEpisodeField(epIndex, { ...currentEp, sources: updatedSources });
  };


  return (
    <>
    <Card className="shadow-lg border-border/40">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-semibold text-primary flex items-center">
          <CloudUpload className="w-6 h-6 mr-2" /> Manually Add Content
        </CardTitle>
        <CardDescription>Add new Anime, Movies, OVAs, or Specials directly to the database. Manage video sources for each episode.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormFieldItem name="title" label="Title" placeholder="e.g., Grand Adventure Series" form={form} />
            <FormFieldItem name="year" label="Release Year" type="number" placeholder="e.g., 2023" form={form} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormFieldItem name="coverImage" label="Cover Image URL" placeholder="https://example.com/cover.jpg" form={form} />
            <FormFieldItem name="bannerImage" label="Banner Image URL (Optional)" placeholder="https://example.com/banner.jpg" form={form} />
          </div>
          <FormFieldItem name="synopsis" label="Synopsis" placeholder="A brief summary of the content..." form={form} isTextarea />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormSelectItem name="type" label="Type" items={['TV', 'Movie', 'OVA', 'Special', 'Unknown']} form={form} />
            <FormSelectItem name="status" label="Status" items={['Ongoing', 'Completed', 'Upcoming', 'Unknown']} form={form} />
            <FormFieldItem name="aniListId" label="AniList ID (Optional)" type="number" placeholder="e.g., 11061" form={form} Icon={Wand} />
          </div>
          <FormFieldItem name="trailerUrl" label="YouTube Trailer URL (Optional)" placeholder="https://www.youtube.com/watch?v=..." form={form} Icon={Youtube} />
          <FormFieldItem name="downloadPageUrl" label="Download Page URL (Optional)" placeholder="https://example.com/download-page" form={form} Icon={LinkIcon} />
          <div>
            <Label className="font-medium">Genres (Select multiple)</Label>
            <ScrollArea className="h-32 md:h-40 mt-1 p-2 border rounded-md bg-input/30">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {availableGenres.map(genre => (
                  <Button key={genre} type="button" variant={selectedGenres.includes(genre) ? 'default' : 'outline'} size="sm" onClick={() => handleGenreChange(genre)} className="text-xs h-8 justify-start">
                    {genre}
                  </Button>
                ))}
              </div>
            </ScrollArea>
            {form.formState.errors.genre && <p className="text-sm text-destructive mt-1">{form.formState.errors.genre.message}</p>}
          </div>

          <Card className="p-4 bg-card/60 border-border/30">
            <CardHeader className="p-0 pb-3 flex flex-row justify-between items-center">
              <CardTitle className="text-lg font-medium">Episodes & Sources</CardTitle>
              {watchType !== 'Movie' && (
                <Button type="button" variant="outline" size="sm" onClick={() => appendEpisode({ title: '', episodeNumber: (episodeFields.length + 1), seasonNumber: 1, sources: [] })} className="text-xs">
                  <PlusCircle className="mr-1.5 h-3.5 w-3.5" /> Add Episode
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-0">
              {episodeFields.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No episodes added yet.</p>}
              <ScrollArea className={episodeFields.length > 0 ? "max-h-[500px] space-y-3 pr-2 -mr-2" : "space-y-3"}>
                {episodeFields.map((episodeItem, epIndex) => ( // episodeItem is from useFieldArray, episode is the data
                  <EpisodeItem
                    key={episodeItem.id}
                    episodeData={form.getValues(`episodes.${epIndex}`)} // Pass actual episode data
                    episodeIndex={epIndex}
                    form={form}
                    removeEpisode={removeEpisode}
                    openAddSourceDialog={openAddSourceDialog}
                    openEditSourceDialog={openEditSourceDialog}
                    handleDeleteSource={handleDeleteSource}
                    isMovie={watchType === 'Movie'}
                  />
                ))}
              </ScrollArea>
            </CardContent>
          </Card>

          <Button type="submit" disabled={isLoading} className="w-full btn-primary-gradient text-base py-3">
            {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
            Add Content to Database
          </Button>
        </form>
      </CardContent>
    </Card>

    <Dialog open={isSourceDialogOpen} onOpenChange={setIsSourceDialogOpen}>
        <DialogContent key={sourceDialogKey} className="sm:max-w-[550px] bg-card border-border shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-primary">{editingSourceInfo ? 'Edit Source' : 'Add New Source'}</DialogTitle>
            <DialogDescription>Provide details for the video source. Ensure URL is correct and accessible.</DialogDescription>
          </DialogHeader>
          <Form {...sourceFormMethods}>
            <form onSubmit={sourceFormMethods.handleSubmit(handleSourceFormSubmit)} className="space-y-4 py-2">
                <DialogFormFieldItem name="label" label="Label / Server Name" placeholder="e.g., Server A - FastStream, VidPlay SUB" form={sourceFormMethods} />
                <DialogFormFieldItem name="url" label="Video URL (.mp4, .m3u8, or embed link)" placeholder="https://example.com/video.mp4" form={sourceFormMethods} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <DialogFormSelectItemField name="type" label="Type" items={['mp4', 'm3u8', 'embed']} form={sourceFormMethods} placeholder="Select source type"/>
                    <DialogFormSelectItemField name="category" label="Category" items={['SUB', 'DUB']} form={sourceFormMethods} placeholder="Select category"/>
                </div>
                <DialogFormFieldItem name="quality" label="Quality (Optional)" placeholder="e.g., 720p, 1080p, HD" form={sourceFormMethods} />
                <DialogFooter className="pt-4">
                <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                <Button type="submit" className="btn-primary-gradient">
                    <Save className="mr-2 h-4 w-4" /> {editingSourceInfo ? 'Save Changes' : 'Add Source'}
                </Button>
                </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface EpisodeItemProps {
  episodeData: Episode; 
  episodeIndex: number;
  form: ReturnType<typeof useForm<AnimeFormData>>;
  removeEpisode: (index: number) => void;
  openAddSourceDialog: (epIndex: number) => void;
  openEditSourceDialog: (epIndex: number, source: VideoSourceFormData, sourceIdx: number) => void;
  handleDeleteSource: (epIndex: number, sourceIndex: number) => void;
  isMovie: boolean;
}

function EpisodeItem({ episodeData, episodeIndex, form, removeEpisode, openAddSourceDialog, openEditSourceDialog, handleDeleteSource, isMovie }: EpisodeItemProps) {
  const sources = episodeData?.sources || [];
  
  return (
    <Card className="p-3 border rounded-md bg-card/50 space-y-2.5 relative mt-2 first:mt-0 shadow-sm">
      {!isMovie && (
        <div className="flex justify-between items-center mb-1">
          <p className="font-medium text-sm text-primary">Episode {episodeIndex + 1}</p>
          <Button type="button" variant="ghost" size="icon" onClick={() => removeEpisode(episodeIndex)} className="text-destructive hover:bg-destructive/10 h-7 w-7 absolute top-1 right-1">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      {!isMovie && (
        <>
          <FormFieldItem name={`episodes.${episodeIndex}.title`} label="Episode Title" placeholder="e.g., The Adventure Begins" form={form} fieldIndex={episodeIndex}/>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <FormFieldItem name={`episodes.${episodeIndex}.episodeNumber`} label="Episode No." type="number" placeholder="1" form={form} fieldIndex={episodeIndex} />
            <FormFieldItem name={`episodes.${episodeIndex}.seasonNumber`} label="Season No." type="number" placeholder="1" form={form} fieldIndex={episodeIndex}/>
          </div>
          <FormFieldItem name={`episodes.${episodeIndex}.thumbnail`} label="Thumbnail URL (Optional)" placeholder="https://example.com/thumb.jpg" form={form} fieldIndex={episodeIndex}/>
          <FormFieldItem name={`episodes.${episodeIndex}.duration`} label="Duration (Optional)" placeholder="e.g., 24min" form={form} fieldIndex={episodeIndex}/>
          <FormFieldItem name={`episodes.${episodeIndex}.overview`} label="Episode Overview (Optional)" placeholder="Short summary..." form={form} isTextarea fieldIndex={episodeIndex}/>
        </>
      )}

      {isMovie && sources.length > 0 && ( 
        <>
          {/* For movie, source editing is handled via dialog. Here we can display the first source if it exists */}
          <div className="text-sm text-muted-foreground">Main Movie Source:</div>
           <div className="flex items-center justify-between p-1.5 rounded-md bg-muted/30 border border-border/30 text-xs">
             <div className="flex-grow min-w-0">
               <p className="font-medium text-foreground/90 truncate" title={sources[0].label}>{sources[0].label}</p>
                <div className="flex items-center gap-1">
                    <Badge variant="secondary" className="text-[0.6rem] px-1 py-0">{sources[0].type.toUpperCase()}</Badge>
                    <Badge variant={sources[0].category === 'DUB' ? 'default' : 'outline'} className={`text-[0.6rem] px-1 py-0 ${sources[0].category === 'DUB' ? 'bg-sky-500/15 text-sky-600 border-sky-500/20' : ''}`}>{sources[0].category}</Badge>
                    {sources[0].quality && <Badge variant="outline" className="text-[0.6rem] px-1 py-0">{sources[0].quality}</Badge>}
                </div>
             </div>
             <div className="flex-shrink-0 flex items-center gap-0.5 ml-1">
                <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-primary" onClick={() => openEditSourceDialog(episodeIndex, sources[0] as VideoSourceFormData, 0)}>
                    <Edit3 size={12} />
                </Button>
             </div>
           </div>
        </>
      )}
      {isMovie && ( 
          <Button type="button" onClick={() => openAddSourceDialog(episodeIndex)} size="sm" variant="outline" className="w-full mt-2">
            <PlusCircle className="mr-1.5 h-4 w-4" /> {sources.length > 0 ? 'Edit Movie Source' : 'Add Movie Source'}
          </Button>
      )}


      {!isMovie && <Separator className="my-3 bg-border/40" />}
      
      {!isMovie && (
        <div>
            <div className="flex justify-between items-center mb-1.5">
                <h5 className="text-xs font-semibold text-muted-foreground">VIDEO SOURCES ({sources.length})</h5>
                <Button type="button" onClick={() => openAddSourceDialog(episodeIndex)} size="xs" variant="outline" className="h-6 px-2 text-[0.7rem] hover:bg-primary/10 hover:border-primary">
                    <PlusCircle className="mr-1 h-3 w-3" /> Add
                </Button>
            </div>
            {sources.length > 0 ? (
            <div className="space-y-1.5">
                {sources.map((source, sourceIndex) => (
                <div key={source.id || sourceIndex} className="flex items-center justify-between p-1.5 rounded-md bg-muted/30 border border-border/30 text-xs">
                    <div className="flex-grow min-w-0">
                    <p className="font-medium text-foreground/90 truncate" title={source.label}>{source.label}</p>
                    <div className="flex items-center gap-1 flex-wrap">
                        <Badge variant="secondary" className="text-[0.6rem] px-1 py-0">{source.type.toUpperCase()}</Badge>
                        <Badge variant={source.category === 'DUB' ? 'default' : 'outline'} className={`text-[0.6rem] px-1 py-0 ${source.category === 'DUB' ? 'bg-sky-500/15 text-sky-600 border-sky-500/20' : ''}`}>{source.category}</Badge>
                        {source.quality && <Badge variant="outline" className="text-[0.6rem] px-1 py-0">{source.quality}</Badge>}
                    </div>
                    </div>
                    <div className="flex-shrink-0 flex items-center gap-0.5 ml-1">
                    <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-primary" onClick={() => openEditSourceDialog(episodeIndex, source as VideoSourceFormData, sourceIndex)}>
                        <Edit3 size={12} />
                    </Button>
                    <AlertDialogTriggerPrimitive asChild>
                        <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:bg-destructive/10">
                            <Trash2 size={12} />
                        </Button>
                    </AlertDialogTriggerPrimitive>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Delete Source?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete &quot;{source.label}&quot;?
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteSource(episodeIndex, sourceIndex)} className="bg-destructive hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                    </div>
                </div>
                ))}
            </div>
            ) : (
            <p className="text-xs text-muted-foreground text-center py-1 italic">No sources added.</p>
            )}
        </div>
      )}
    </Card>
  );
}


interface FormFieldItemPropsExtended {
  name: any;
  label: string;
  placeholder?: string;
  type?: string;
  form: ReturnType<typeof useForm<AnimeFormData>>;
  isTextarea?: boolean;
  fieldIndex?: number; 
  Icon?: React.ElementType;
}

function FormFieldItem({ name, label, placeholder, type = "text", form, isTextarea = false, fieldIndex, Icon }: FormFieldItemPropsExtended) {
  const { register, formState: { errors } } = form;
  let error;

  const fieldNameParts = name.split('.');
  if (fieldNameParts[0] === 'episodes' && fieldNameParts.length > 2 && fieldIndex !== undefined) {
    const epIndex = parseInt(fieldNameParts[1]);
    const fieldName = fieldNameParts[2] as keyof Episode;
    if (errors.episodes && errors.episodes[epIndex] && errors.episodes[epIndex]?.[fieldName]) {
        error = errors.episodes[epIndex]?.[fieldName];
    }
  } else {
      error = errors[name as keyof AnimeFormData];
  }
  const inputId = fieldIndex !== undefined ? `episodes.${fieldIndex}.${fieldNameParts.pop()}` : name;

  return (
    <div className="space-y-1">
      <Label htmlFor={inputId} className="text-xs font-medium flex items-center">
        {Icon && <Icon className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />} {label}
      </Label>
      {isTextarea ? (
        <Textarea id={inputId} placeholder={placeholder} {...register(name)} className="bg-input border-border/70 focus:border-primary text-sm" rows={3} />
      ) : (
        <Input id={inputId} type={type} placeholder={placeholder} {...register(name, type === 'number' ? { setValueAs: (value) => value === '' ? null : Number(value) } : {})} className="bg-input border-border/70 focus:border-primary h-9 text-sm" />
      )}
      {error && <p className="text-xs text-destructive mt-0.5">{(error as any).message}</p>}
    </div>
  );
}

interface FormSelectItemPropsExtended {
  name: keyof AnimeFormData;
  label: string;
  items: string[];
  form: ReturnType<typeof useForm<AnimeFormData>>;
}
function FormSelectItem({ name, label, items, form }: FormSelectItemPropsExtended) {
  const { control, formState: { errors } } = form;
  const error = errors[name];
  return (
    <div className="space-y-1">
      <Label htmlFor={name} className="font-medium">{label}</Label>
      <Controller
        name={name} control={control}
        render={({ field }) => (
          <Select onValueChange={field.onChange} value={String(field.value)} defaultValue={String(field.value)}>
            <SelectTrigger id={name} className="bg-input border-border/70 focus:border-primary h-10 text-sm">
              <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {items.map(item => (<SelectItem key={item} value={item} className="text-sm">{item}</SelectItem>))}
            </SelectContent>
          </Select>
        )}
      />
      {error && <p className="text-sm text-destructive mt-1">{(error as any).message}</p>}
    </div>
  );
}

interface DialogFormFieldItemProps {
  name: keyof VideoSourceFormData;
  label: string;
  placeholder?: string;
  form: ReturnType<typeof useForm<VideoSourceFormData>>;
  type?: string;
}
function DialogFormFieldItem({ name, label, placeholder, form, type = "text" }: DialogFormFieldItemProps) {
  const { register, formState: { errors } } = form;
  return (
    <div className="space-y-1">
      <Label htmlFor={`dialog-${name}`} className="text-sm font-medium">{label}</Label>
      <Input id={`dialog-${name}`} type={type} placeholder={placeholder} {...register(name)} className="bg-input h-9 text-sm focus:border-primary" />
      {errors[name] && <p className="text-xs text-destructive mt-0.5">{(errors[name] as any).message}</p>}
    </div>
  );
}

interface DialogFormSelectItemFieldProps {
  name: keyof VideoSourceFormData;
  label: string;
  items: string[];
  form: ReturnType<typeof useForm<VideoSourceFormData>>;
  placeholder?: string;
}
function DialogFormSelectItemField({ name, label, items, form, placeholder }: DialogFormSelectItemFieldProps) {
  const { control, formState: { errors } } = form;
  return (
    <div className="space-y-1">
      <Label htmlFor={`dialog-${name}`} className="text-sm font-medium">{label}</Label>
      <Controller
        name={name} control={control}
        render={({ field }) => (
          <Select onValueChange={field.onChange} value={String(field.value)} defaultValue={String(field.value)}>
            <SelectTrigger id={`dialog-${name}`} className="bg-input h-9 text-sm focus:border-primary">
              <SelectValue placeholder={placeholder || `Select ${label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {items.map(item => (<SelectItem key={item} value={item} className="text-sm">{item.toUpperCase()}</SelectItem>))}
            </SelectContent>
          </Select>
        )}
      />
      {errors[name] && <p className="text-xs text-destructive mt-0.5">{(errors[name] as any).message}</p>}
    </div>
  );
}

    

    
