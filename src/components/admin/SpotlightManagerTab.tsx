
'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import type { SpotlightSlide } from '@/types/spotlight';
import type { Anime } from '@/types/anime';
import { getSpotlightSlides, addSpotlightSlide, updateSpotlightSlide, deleteSpotlightSlide } from '@/services/spotlightService';
import { searchAnimes } from '@/services/animeService';
import { useDebounce } from '@/hooks/useDebounce';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Presentation, AlertCircle, PlusCircle, Edit3, Trash2, Search, CheckCircle, GripVertical, Wand, Link as LinkIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';


const MAX_SPOTLIGHTS = 8;

const spotlightFormSchema = z.object({
  order: z.coerce.number().min(1, 'Order must be at least 1').max(MAX_SPOTLIGHTS, `Max ${MAX_SPOTLIGHTS} spotlights`),
  status: z.enum(['live', 'draft']),
  animeId: z.string().min(1, 'An anime must be selected.'),
  overrideTitle: z.string().optional(),
  overrideDescription: z.string().max(200, 'Description cannot exceed 200 characters.').optional(),
  trailerUrl: z.string().url('Must be a valid video URL.'),
  backgroundImageUrl: z.string().url('Must be a valid image URL.'),
});

type SpotlightFormData = z.infer<typeof spotlightFormSchema>;


export default function SpotlightManagerTab() {
  const [slides, setSlides] = useState<SpotlightSlide[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<SpotlightSlide | null>(null);

  const { toast } = useToast();

  const fetchSlides = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedSlides = await getSpotlightSlides();
      setSlides(fetchedSlides);
    } catch (err) {
      console.error("Failed to fetch spotlights:", err);
      setError("Could not load spotlight data.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSlides();
  }, [fetchSlides]);

  const handleOpenForm = (slide: SpotlightSlide | null = null) => {
    setEditingSlide(slide);
    setIsFormOpen(true);
  };
  
  const handleDelete = async (slideId: string) => {
    setIsSaving(true);
    try {
      await deleteSpotlightSlide(slideId);
      setSlides(prev => prev.filter(s => s.id !== slideId));
      toast({ title: "Spotlight Deleted", description: "The slide has been removed from the spotlight." });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: "Failed to delete spotlight slide." });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleFormSubmit = async (data: SpotlightFormData) => {
    setIsSaving(true);
    try {
      const payload = {
        ...data,
        overrideTitle: data.overrideTitle || null,
        overrideDescription: data.overrideDescription || null,
      };

      if (editingSlide) {
        await updateSpotlightSlide(editingSlide.id, payload);
        toast({ title: 'Spotlight Updated', description: 'The slide has been successfully updated.' });
      } else {
        await addSpotlightSlide(payload);
        toast({ title: 'Spotlight Added', description: 'A new slide has been added to the spotlight.' });
      }
      setIsFormOpen(false);
      fetchSlides(); // Refresh the list
    } catch (err) {
       toast({ variant: 'destructive', title: 'Save Error', description: "Failed to save the spotlight slide." });
    } finally {
      setIsSaving(false);
    }
  };

  const sortedSlides = useMemo(() => slides.sort((a, b) => a.order - b.order), [slides]);

  return (
    <Card className="shadow-xl border-border/40">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-semibold text-primary flex items-center">
          <Presentation className="w-6 h-6 mr-2" /> Spotlight Manager
        </CardTitle>
        <CardDescription>Add, remove, and reorder up to {MAX_SPOTLIGHTS} spotlight slides for the homepage.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
        ) : error ? (
           <div className="text-center py-10 text-destructive bg-destructive/5 p-6 rounded-lg">
            <AlertCircle className="mx-auto h-12 w-12 mb-3" />
            <p className="text-lg font-medium">{error}</p>
          </div>
        ) : (
          <div className="space-y-4">
             <Button onClick={() => handleOpenForm()} disabled={slides.length >= MAX_SPOTLIGHTS}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Spotlight
              {slides.length >= MAX_SPOTLIGHTS && <span className="ml-2 text-xs">(Max Reached)</span>}
            </Button>
            {sortedSlides.length === 0 ? (
                <p className="text-center py-10 text-muted-foreground">No spotlight slides configured yet.</p>
            ) : (
                sortedSlides.map(slide => (
                    <SpotlightItemCard key={slide.id} slide={slide} onEdit={() => handleOpenForm(slide)} onDelete={() => handleDelete(slide.id)} />
                ))
            )}
          </div>
        )}
      </CardContent>

      {isFormOpen && (
        <SpotlightFormDialog
          isOpen={isFormOpen}
          onOpenChange={setIsFormOpen}
          onSubmit={handleFormSubmit}
          isSaving={isSaving}
          existingSlide={editingSlide}
          currentSlides={slides}
        />
      )}
    </Card>
  );
}


function SpotlightItemCard({ slide, onEdit, onDelete }: { slide: SpotlightSlide; onEdit: () => void; onDelete: () => void; }) {
  return (
    <div className="flex flex-col sm:flex-row items-center p-3 gap-4 bg-card/70 hover:bg-card/90 transition-colors duration-200 ease-in-out rounded-lg shadow-sm border border-border/30">
        <div className="flex-shrink-0 w-12 text-2xl font-bold flex items-center justify-center text-primary relative">
            <GripVertical className="absolute left-[-10px] top-1/2 -translate-y-1/2 text-muted-foreground/30" />
            {slide.order}
        </div>
        <Image src={slide.backgroundImageUrl} alt={slide.overrideTitle || 'Spotlight background'} width={128} height={72} className="w-32 h-auto object-cover rounded-md border border-border/20" data-ai-hint="anime background" />
        <div className="flex-grow text-center sm:text-left">
            <h4 className="font-semibold text-lg text-foreground">{slide.overrideTitle || `Anime ID: ${slide.animeId}`}</h4>
            <div className="text-xs text-muted-foreground mt-1">
                <Badge variant={slide.status === 'live' ? 'default' : 'secondary'} className={cn('capitalize', slide.status === 'live' && 'bg-green-500/20 text-green-700')}>{slide.status}</Badge>
                <p className="truncate mt-1" title={slide.trailerUrl}>Trailer: {slide.trailerUrl}</p>
            </div>
        </div>
        <div className="flex-shrink-0 flex items-center gap-2 mt-3 sm:mt-0">
            <Button variant="outline" size="sm" onClick={onEdit}><Edit3 className="mr-1.5 h-3.5 w-3.5" /> Edit</Button>
            <AlertDialog>
                <AlertDialogTrigger asChild><Button variant="destructive" size="sm"><Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete</Button></AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Delete Spotlight?</AlertDialogTitle><AlertDialogDescription>This will permanently remove this slide from the spotlight. Are you sure?</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={onDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    </div>
  )
}

// Form Dialog Component
interface SpotlightFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: SpotlightFormData) => Promise<void>;
  isSaving: boolean;
  existingSlide: SpotlightSlide | null;
  currentSlides: SpotlightSlide[];
}

function SpotlightFormDialog({ isOpen, onOpenChange, onSubmit, isSaving, existingSlide, currentSlides }: SpotlightFormDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Anime[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedAnime, setSelectedAnime] = useState<Anime | null>(null);
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const form = useForm<SpotlightFormData>({
    resolver: zodResolver(spotlightFormSchema),
    defaultValues: {
      order: existingSlide?.order || (currentSlides.length > 0 ? Math.max(...currentSlides.map(s => s.order)) + 1 : 1),
      status: existingSlide?.status || 'draft',
      animeId: existingSlide?.animeId || '',
      overrideTitle: existingSlide?.overrideTitle || '',
      overrideDescription: existingSlide?.overrideDescription || '',
      trailerUrl: existingSlide?.trailerUrl || '',
      backgroundImageUrl: existingSlide?.backgroundImageUrl || '',
    },
  });

  useEffect(() => {
    if (debouncedSearchQuery) {
      setIsSearching(true);
      searchAnimes(debouncedSearchQuery, 5)
        .then(setSearchResults)
        .finally(() => setIsSearching(false));
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearchQuery]);

  useEffect(() => {
    // If there's an existing slide, we might need to fetch its anime data to pre-populate 'selectedAnime'
    const prefillAnime = async () => {
      if (existingSlide?.animeId) {
        const result = await searchAnimes(existingSlide.animeId, 1);
        if (result.length > 0 && result[0].id === existingSlide.animeId) {
          setSelectedAnime(result[0]);
          form.setValue('overrideTitle', existingSlide.overrideTitle || result[0].title);
          form.setValue('overrideDescription', existingSlide.overrideDescription || result[0].synopsis);
        }
      }
    };
    if (isOpen) {
      prefillAnime();
    }
  }, [isOpen, existingSlide, form]);


  const handleAnimeSelect = (anime: Anime) => {
    setSelectedAnime(anime);
    form.setValue('animeId', anime.id, { shouldValidate: true });
    // Pre-fill fields if they are empty
    if (!form.getValues('overrideTitle')) form.setValue('overrideTitle', anime.title);
    if (!form.getValues('overrideDescription')) form.setValue('overrideDescription', anime.synopsis);
    if (!form.getValues('backgroundImageUrl')) form.setValue('backgroundImageUrl', anime.bannerImage || anime.coverImage || '');
    setSearchQuery('');
    setSearchResults([]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-card border-border shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-primary">{existingSlide ? 'Edit Spotlight Slide' : 'Add New Spotlight Slide'}</DialogTitle>
          <DialogDescription>Configure the slide details. Linked anime data can be overridden.</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2 max-h-[70vh] overflow-y-auto pr-2">
            
            {/* Anime Search and Selection */}
            <div>
              <Label>Link Anime</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal h-auto">
                    {selectedAnime ? (
                      <div className="flex items-center gap-2">
                        <Image src={selectedAnime.coverImage} alt={selectedAnime.title} width={40} height={60} className="rounded" data-ai-hint="anime poster"/>
                        <div>
                          <p className="font-semibold">{selectedAnime.title}</p>
                          <p className="text-xs text-muted-foreground">{selectedAnime.id}</p>
                        </div>
                      </div>
                    ) : 'Select an Anime'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                  <div className="p-2">
                    <div className="relative">
                       <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                       <Input placeholder="Search anime by title..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-8"/>
                    </div>
                  </div>
                  <ScrollArea className="max-h-60">
                    {isSearching ? <div className="p-4 text-center text-sm"><Loader2 className="h-4 w-4 animate-spin inline mr-2"/>Searching...</div>
                    : searchResults.length > 0 ? (
                      searchResults.map(anime => (
                        <div key={anime.id} onClick={() => handleAnimeSelect(anime)} className="flex items-center gap-2 p-2 hover:bg-accent cursor-pointer">
                            <Image src={anime.coverImage} alt={anime.title} width={32} height={48} className="rounded" data-ai-hint="anime poster"/>
                            <div>
                                <p className="text-sm font-semibold">{anime.title}</p>
                                <p className="text-xs text-muted-foreground">{anime.year} • {anime.type}</p>
                            </div>
                        </div>
                      ))
                    ) : debouncedSearchQuery ? <p className="p-4 text-center text-sm text-muted-foreground">No results.</p> : null}
                  </ScrollArea>
                </PopoverContent>
              </Popover>
              {form.formState.errors.animeId && <p className="text-xs text-destructive mt-1">{form.formState.errors.animeId.message}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormFieldItem name="order" label="Order" type="number" form={form} />
                <div className="space-y-1">
                    <Label>Status</Label>
                    <Controller name="status" control={form.control} render={({ field }) => (
                         <div className="flex items-center space-x-2 pt-2">
                            <Switch id="status" checked={field.value === 'live'} onCheckedChange={(checked) => field.onChange(checked ? 'live' : 'draft')} />
                            <Label htmlFor="status" className="capitalize">{field.value}</Label>
                        </div>
                    )}/>
                </div>
            </div>
            
            <FormFieldItem name="overrideTitle" label="Spotlight Title (Optional)" placeholder="Overrides anime title" form={form} Icon={Wand}/>
            <div className="space-y-1">
                <Label htmlFor="overrideDescription">Spotlight Description (Optional)</Label>
                <Textarea id="overrideDescription" placeholder="Overrides anime synopsis (max 200 chars)" {...form.register('overrideDescription')} className="bg-input"/>
                {form.formState.errors.overrideDescription && <p className="text-xs text-destructive mt-1">{form.formState.errors.overrideDescription.message}</p>}
            </div>

            <FormFieldItem name="trailerUrl" label="Trailer Video URL" placeholder="https://example.com/trailer.mp4" form={form} Icon={LinkIcon}/>
            <FormFieldItem name="backgroundImageUrl" label="Background Image URL" placeholder="https://example.com/background.jpg" form={form} Icon={LinkIcon}/>

            <DialogFooter className="pt-4">
            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
            <Button type="submit" disabled={isSaving} className="btn-primary-gradient">
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {existingSlide ? 'Save Changes' : 'Add Spotlight'}
            </Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Reusable Form Field Component
function FormFieldItem({ name, label, form, Icon, ...props }: { name: keyof SpotlightFormData; label: string; form: ReturnType<typeof useForm<SpotlightFormData>>, Icon?: React.ElementType } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-1">
      <Label htmlFor={name} className="flex items-center"><Icon className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" /> {label}</Label>
      <Input id={name} {...form.register(name)} {...props} className="bg-input" />
      {form.formState.errors[name] && <p className="text-xs text-destructive mt-1">{form.formState.errors[name]?.message}</p>}
    </div>
  );
}

    