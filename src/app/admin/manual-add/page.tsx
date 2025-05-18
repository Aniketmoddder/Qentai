
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
import { addAnimeToFirestore, getAllAnimes } from '@/services/animeService'; // Added getAllAnimes
import type { Anime, Episode } from '@/types/anime';
import { Loader2, PlusCircle, Trash2, Save, CloudUpload, Youtube, Wand, Link as LinkIcon } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { slugify } from '@/lib/stringUtils';

const episodeSchema = z.object({
  id: z.string().optional(), 
  title: z.string().min(1, 'Episode title is required'),
  episodeNumber: z.coerce.number().min(0, 'Episode number must be 0 or positive (0 for movies/specials if needed)'),
  seasonNumber: z.coerce.number().min(0, 'Season number must be 0 or positive (0 for movies/specials if needed)'),
  thumbnail: z.string().url('Must be a valid URL for thumbnail').optional().or(z.literal('')),
  duration: z.string().optional(),
  url: z.string().url('Must be a valid URL for video').optional().or(z.literal('')),
  airDate: z.string().optional(),
  overview: z.string().optional(),
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

  const form = useForm<AnimeFormData>({
    resolver: zodResolver(animeSchema),
    defaultValues: {
      title: '',
      coverImage: '',
      bannerImage: '',
      year: new Date().getFullYear(),
      genre: [],
      status: 'Unknown',
      synopsis: '',
      type: 'TV',
      trailerUrl: '',
      downloadPageUrl: '',
      sourceAdmin: 'manual',
      episodes: [],
      aniListId: null,
    },
  });
  
  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: "episodes"
  });

  const watchType = form.watch("type");
  const watchTitle = form.watch("title");

  useEffect(() => {
    const fetchAllUniqueGenres = async () => {
        try {
            const animes = await getAllAnimes({ count: -1 }); // Fetch all animes
            const uniqueGenresFromDB = new Set<string>();
            animes.forEach(anime => anime.genre.forEach(g => {
                 if (typeof g === 'string' && g.trim() !== '') {
                    uniqueGenresFromDB.add(g.trim());
                 }
            }));
            
            const combinedGenres = new Set([...INITIAL_GENRES, ...Array.from(uniqueGenresFromDB)]);
            setAvailableGenres(Array.from(combinedGenres).sort());
        } catch (error) {
            console.warn("Could not fetch all unique genres for selector, using predefined list.", error);
            setAvailableGenres(INITIAL_GENRES.sort());
        }
    };
    fetchAllUniqueGenres();
  }, []);


  React.useEffect(() => {
    const animeTitleSlug = slugify(watchTitle || 'movie');
    if (watchType === 'Movie') {
        replace([{ 
            id: `${animeTitleSlug}-s1e1-${Date.now()}`.toLowerCase(),
            title: "Full Movie", 
            episodeNumber: 1, 
            seasonNumber: 1, 
            url: '', 
            thumbnail: '', 
            duration: '', 
            overview: '' 
        }]);
    } else {
        if (fields.length === 1 && fields[0].title === "Full Movie") {
            replace([]); 
        }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchType, watchTitle, replace]);


  const handleGenreChange = (genre: string) => {
    const newSelectedGenres = selectedGenres.includes(genre)
      ? selectedGenres.filter(g => g !== genre)
      : [...selectedGenres, genre];
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
            const animeTitleSlug = slugify(data.title); 
            return {
                ...ep,
                id: ep.id || `${animeTitleSlug}-s${ep.seasonNumber || 1}e${ep.episodeNumber || (index + 1)}-${Date.now()}`.toLowerCase()
            };
        }),
        trailerUrl: data.trailerUrl || undefined, 
        downloadPageUrl: data.downloadPageUrl || undefined,
      };

      const newAnimeId = await addAnimeToFirestore(animeDataForDb); 
      toast({ title: 'Content Added', description: `${data.title} has been successfully added with ID: ${newAnimeId}.` });
      form.reset();
      setSelectedGenres([]);
      replace([]); 
    } catch (err) {
      console.error('Failed to add content:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      toast({ variant: 'destructive', title: 'Save Error', description: `Failed to add content: ${errorMessage}` });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-lg border-border/40">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-semibold text-primary flex items-center">
          <CloudUpload className="w-6 h-6 mr-2" /> Manually Add Content
        </CardTitle>
        <CardDescription>Add new Anime, Movies, OVAs, or Specials directly to the database. Fill in all required fields.</CardDescription>
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
                  <Button
                    key={genre}
                    type="button"
                    variant={selectedGenres.includes(genre) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleGenreChange(genre)}
                    className="text-xs h-8 justify-start"
                  >
                    {genre}
                  </Button>
                ))}
              </div>
            </ScrollArea>
            {form.formState.errors.genre && <p className="text-sm text-destructive mt-1">{form.formState.errors.genre.message}</p>}
          </div>
          
          {watchType === 'Movie' ? (
             <Card className="p-4 bg-card/60 border-border/30">
                <CardHeader className="p-0 pb-3">
                    <CardTitle className="text-lg font-medium">Movie Details</CardTitle>
                </CardHeader>
                <CardContent className="p-0 space-y-3">
                    <FormFieldItem name={`episodes.0.url`} label="Movie Video URL" placeholder="https://example.com/movie.mp4" form={form} />
                    <FormFieldItem name={`episodes.0.thumbnail`} label="Movie Thumbnail URL (Optional)" placeholder="https://example.com/movie_thumb.jpg" form={form} />
                    <FormFieldItem name={`episodes.0.duration`} label="Movie Duration (e.g., 1h 30min)" placeholder="e.g., 1h 30min" form={form} />
                    <p className="text-xs text-muted-foreground mt-1">For movies, provide a single video URL and optional details here. This will be stored as the main content.</p>
                </CardContent>
             </Card>
          ): (
            <Card className="p-4 bg-card/60 border-border/30">
              <CardHeader className="p-0 pb-3 flex flex-row justify-between items-center">
                <CardTitle className="text-lg font-medium">Episodes</CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const animeTitleSlug = slugify(form.getValues('title') || 'episode');
                    append({ 
                        id: `${animeTitleSlug}-s1e${fields.length + 1}-${Date.now()}`.toLowerCase(),
                        title: '', episodeNumber: (fields.length + 1), seasonNumber: 1, url: '', thumbnail: '', duration: '', overview: ''
                    })
                  }}
                  className="text-xs"
                >
                  <PlusCircle className="mr-1.5 h-3.5 w-3.5" /> Add Episode
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {fields.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No episodes added yet for this TV series/OVA/Special.</p>}
                <ScrollArea className={fields.length > 0 ? "max-h-[400px] space-y-3 pr-2 -mr-2" : "space-y-3"}>
                    {fields.map((field, index) => (
                    <div key={field.id} className="p-3 border rounded-md bg-card/50 space-y-2.5 relative mt-2 first:mt-0">
                        <div className="flex justify-between items-center mb-1">
                        <p className="font-medium text-sm text-primary">Episode {index + 1}</p>
                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="text-destructive hover:bg-destructive/10 h-7 w-7 absolute top-1 right-1">
                            <Trash2 className="h-4 w-4" />
                        </Button>
                        </div>
                        <FormFieldItem name={`episodes.${index}.title`} label="Episode Title" placeholder="e.g., The Adventure Begins" form={form} fieldIndex={index}/>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <FormFieldItem name={`episodes.${index}.episodeNumber`} label="Episode No." type="number" placeholder="1" form={form} fieldIndex={index} />
                            <FormFieldItem name={`episodes.${index}.seasonNumber`} label="Season No." type="number" placeholder="1" form={form} fieldIndex={index}/>
                        </div>
                        <FormFieldItem name={`episodes.${index}.url`} label="Video URL" placeholder="https://example.com/episode.mp4" form={form} fieldIndex={index}/>
                        <FormFieldItem name={`episodes.${index}.thumbnail`} label="Thumbnail URL (Optional)" placeholder="https://example.com/thumb.jpg" form={form} fieldIndex={index}/>
                        <FormFieldItem name={`episodes.${index}.duration`} label="Duration (Optional)" placeholder="e.g., 24min" form={form} fieldIndex={index}/>
                        <FormFieldItem name={`episodes.${index}.overview`} label="Episode Overview (Optional)" placeholder="Short summary of the episode" form={form} isTextarea fieldIndex={index}/>
                    </div>
                    ))}
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          <Button type="submit" disabled={isLoading} className="w-full btn-primary-gradient text-base py-3">
            {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
            Add Content to Database
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

interface FormFieldItemProps {
  name: any; 
  label: string;
  placeholder?: string;
  type?: string;
  form: ReturnType<typeof useForm<AnimeFormData>>;
  isTextarea?: boolean;
  fieldIndex?: number;
  Icon?: React.ElementType; 
}

function FormFieldItem({ name, label, placeholder, type = "text", form, isTextarea = false, fieldIndex, Icon }: FormFieldItemProps) {
  const { register, formState: { errors } } = form;
  
  let error;
  if (name.startsWith('episodes.')) {
      const parts = name.split('.');
      const episodeIndex = parseInt(parts[1]);
      const fieldName = parts[2] as keyof Episode;
      if (errors.episodes && errors.episodes[episodeIndex] && errors.episodes[episodeIndex]?.[fieldName]) {
          error = errors.episodes[episodeIndex]?.[fieldName];
      }
  } else {
      error = errors[name as keyof AnimeFormData];
  }

  const inputId = fieldIndex !== undefined ? `episodes.${fieldIndex}.${name.split('.').pop()}` : name;


  return (
    <div className="space-y-1">
      <Label htmlFor={inputId} className="text-xs font-medium flex items-center">
        {Icon && <Icon className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />}
        {label}
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

interface FormSelectItemProps {
  name: keyof AnimeFormData; 
  label: string;
  items: string[];
  form: ReturnType<typeof useForm<AnimeFormData>>;
}

function FormSelectItem({ name, label, items, form }: FormSelectItemProps) {
  const { control, formState: { errors } } = form;
  const error = errors[name];

  return (
    <div className="space-y-1">
      <Label htmlFor={name} className="font-medium">{label}</Label>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <Select onValueChange={field.onChange} value={String(field.value)} defaultValue={String(field.value)}> 
            <SelectTrigger id={name} className="bg-input border-border/70 focus:border-primary h-10 text-sm">
              <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {items.map(item => (
                <SelectItem key={item} value={item} className="text-sm">{item}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
      {error && <p className="text-sm text-destructive mt-1">{(error as any).message}</p>}
    </div>
  );
}

