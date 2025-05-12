'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { getAnimeById, updateAnimeInFirestore, getAllAnimes } from '@/services/animeService';
import type { Anime } from '@/types/anime';
import { Loader2, Save, ArrowLeft, AlertCircle, Youtube, Wand, Link as LinkIcon } from 'lucide-react'; 
import Container from '@/components/layout/container';
import { ScrollArea } from '@/components/ui/scroll-area';
import Link from 'next/link';
import { Switch } from '@/components/ui/switch';


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
  isFeatured: z.boolean().optional(),
  averageRating: z.coerce.number().min(0).max(10).optional(),
  aniListId: z.coerce.number().int().positive('AniList ID must be a positive number.').optional().nullable().transform(val => val === '' || val === null ? null : Number(val)),
});

type AnimeFormData = z.infer<typeof animeSchema>;

const ADMIN_EMAIL = 'ninjax.desi@gmail.com';
const INITIAL_GENRES = ['Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Sci-Fi', 'Slice of Life', 'Romance', 'Horror', 'Mystery', 'Thriller', 'Sports', 'Supernatural', 'Mecha', 'Historical', 'Music', 'School', 'Shounen', 'Shoujo', 'Seinen', 'Josei', 'Isekai', 'Psychological', 'Ecchi', 'Harem', 'Demons', 'Magic', 'Martial Arts', 'Military', 'Parody', 'Police', 'Samurai', 'Space', 'Super Power', 'Vampire', 'Game'];

export default function EditAnimePage() {
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const animeId = params.id as string;

  const { user, loading: authLoading } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  
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
      isFeatured: false,
      averageRating: 0,
      aniListId: null, 
    },
  });


  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login?redirect=/admin');
        setIsAuthorized(false);
      } else if (user.email !== ADMIN_EMAIL) {
        toast({ variant: 'destructive', title: 'Unauthorized', description: 'You do not have permission to access this page.' });
        router.push('/');
        setIsAuthorized(false);
      } else {
        setIsAuthorized(true);
      }
    }
  }, [user, authLoading, router, toast]);
  
  const fetchAnimeData = useCallback(async () => {
    if (!animeId) {
      setFetchError("Anime ID is missing.");
      setIsPageLoading(false);
      return;
    }
    setIsPageLoading(true);
    setFetchError(null);
    try {
      const animeData = await getAnimeById(animeId);
      if (animeData) {
        form.reset({
          title: animeData.title || '',
          coverImage: animeData.coverImage || '',
          bannerImage: animeData.bannerImage || '',
          year: animeData.year || new Date().getFullYear(),
          genre: animeData.genre || [],
          status: animeData.status || 'Unknown',
          synopsis: animeData.synopsis || '',
          type: animeData.type || 'TV',
          trailerUrl: animeData.trailerUrl || '',
          downloadPageUrl: animeData.downloadPageUrl || '',
          isFeatured: animeData.isFeatured || false,
          averageRating: animeData.averageRating || 0,
          aniListId: animeData.aniListId || null, 
        });
        setSelectedGenres(animeData.genre || []);
      } else {
        setFetchError('Anime not found.');
        toast({ variant: 'destructive', title: 'Error', description: 'Anime with this ID was not found.' });
      }
    } catch (err) {
      console.error('Failed to fetch anime data:', err);
      setFetchError('Failed to load anime data. Please try again.');
      toast({ variant: 'destructive', title: 'Fetch Error', description: 'Could not load anime data for editing.' });
    } finally {
      setIsPageLoading(false);
    }
  }, [animeId, form, toast]);


  useEffect(() => {
    if (isAuthorized) {
        fetchAnimeData();
    }
  }, [isAuthorized, fetchAnimeData]);

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
    if (isAuthorized) {
        fetchAllUniqueGenres();
    }
  }, [isAuthorized]);


  const handleGenreChange = (genre: string) => {
    const newSelectedGenres = selectedGenres.includes(genre)
      ? selectedGenres.filter(g => g !== genre)
      : [...selectedGenres, genre];
    setSelectedGenres(newSelectedGenres);
    form.setValue('genre', newSelectedGenres, { shouldValidate: true });
  };

  const onSubmit = async (data: AnimeFormData) => {
    setIsSubmitting(true);
    try {
      const updateData: Partial<Omit<Anime, 'episodes' | 'id'>> = { 
        ...data,
        aniListId: data.aniListId || undefined, 
        trailerUrl: data.trailerUrl || undefined,
        downloadPageUrl: data.downloadPageUrl || undefined,
      };
      await updateAnimeInFirestore(animeId, updateData);
      toast({ title: 'Content Updated', description: `${data.title} has been successfully updated.` });
      router.push('/admin?tab=content-management'); 
    } catch (err) {
      console.error('Failed to update content:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      toast({ variant: 'destructive', title: 'Update Error', description: `Failed to update content: ${errorMessage}` });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (authLoading || isAuthorized === null) {
    return (
      <Container className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-16 h-16 animate-spin text-primary" />
      </Container>
    );
  }

  if (!isAuthorized && !authLoading) {
     return (
      <Container className="py-12 text-center">
        <AlertCircle className="mx-auto h-16 w-16 text-destructive mb-4" />
        <h1 className="text-3xl font-bold text-destructive">Access Denied</h1>
        <p className="text-muted-foreground text-lg">You do not have permission to view this page.</p>
        <Button asChild variant="link" className="mt-6 text-lg">
          <Link href="/">Go to Homepage</Link>
        </Button>
      </Container>
    );
  }

  if (isPageLoading) {
    return (
      <Container className="py-12 text-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading anime data...</p>
      </Container>
    );
  }

  if (fetchError) {
    return (
      <Container className="py-12 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-bold text-destructive">Error Loading Data</h1>
        <p className="text-muted-foreground">{fetchError}</p>
        <Button asChild variant="link" className="mt-4">
            <Link href="/admin?tab=content-management">Go Back</Link>
        </Button>
      </Container>
    );
  }

  return (
    <Container className="py-8 md:py-12">
      <Button variant="outline" onClick={() => router.push('/admin?tab=content-management')} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Content Management
      </Button>
      <Card className="shadow-xl border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl font-semibold text-primary">Edit: {form.getValues('title') || 'Content'}</CardTitle>
          <CardDescription>Modify the details for this anime/movie. Episode management is handled in the "Episodes" tab.</CardDescription>
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


            <FormFieldItem name="averageRating" label="Average Rating (0-10)" type="number" placeholder="e.g., 7.5" form={form} />
            
            <div>
              <Label htmlFor="isFeatured" className="font-medium flex items-center space-x-2 cursor-pointer">
                <Controller
                    name="isFeatured"
                    control={form.control}
                    render={({ field }) => (
                        <Switch
                            id="isFeatured"
                            checked={field.value || false}
                            onCheckedChange={field.onChange}
                            className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-input"
                        />
                    )}
                />
                <span>Featured Anime</span>
              </Label>
                {form.formState.errors.isFeatured && <p className="text-sm text-destructive mt-1">{form.formState.errors.isFeatured.message}</p>}
            </div>

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
            
            <Button type="submit" disabled={isSubmitting} className="w-full btn-primary-gradient text-base py-3">
              {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
              Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>
    </Container>
  );
}

interface FormFieldItemProps {
  name: keyof AnimeFormData; 
  label: string;
  placeholder?: string;
  type?: string;
  form: ReturnType<typeof useForm<AnimeFormData>>;
  isTextarea?: boolean;
  Icon?: React.ElementType;
}

function FormFieldItem({ name, label, placeholder, type = "text", form, isTextarea = false, Icon }: FormFieldItemProps) {
  const { register, formState: { errors } } = form;
  const error = errors[name];

  return (
    <div className="space-y-1">
      <Label htmlFor={name} className="text-xs font-medium flex items-center">
        {Icon && <Icon className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />}
        {label}
      </Label>
      {isTextarea ? (
        <Textarea id={name} placeholder={placeholder} {...register(name)} className="bg-input border-border/70 focus:border-primary text-sm" rows={3} />
      ) : (
        <Input id={name} type={type} placeholder={placeholder} {...register(name, type === 'number' ? { setValueAs: (value) => value === '' ? null : Number(value) } : {})} className="bg-input border-border/70 focus:border-primary h-9 text-sm" />
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
