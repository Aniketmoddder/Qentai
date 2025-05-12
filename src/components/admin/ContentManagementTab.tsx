'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { getAllAnimes, deleteAnimeFromFirestore, updateAnimeIsFeatured } from '@/services/animeService';
import type { Anime } from '@/types/anime';
import { Button } from '@/components/ui/button';
import { Loader2, Edit, Trash2, Search, AlertCircle, RefreshCw, Star, StarOff } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export default function ContentManagementTab() {
  const [animes, setAnimes] = useState<Anime[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [togglingFeaturedId, setTogglingFeaturedId] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const fetchAnimes = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedAnimes = await getAllAnimes(200); 
      setAnimes(fetchedAnimes);
    } catch (err) {
      console.error('Failed to fetch anime list:', err);
      setError('Failed to load anime content. Please try again.');
      toast({ variant: 'destructive', title: 'Fetch Error', description: 'Could not load anime list.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnimes();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  const handleDelete = async (animeId: string, animeTitle: string) => {
    try {
      await deleteAnimeFromFirestore(animeId);
      toast({ title: 'Anime Deleted', description: `${animeTitle} has been successfully deleted.` });
      setAnimes(prevAnimes => prevAnimes.filter(anime => anime.id !== animeId));
    } catch (err) {
      console.error('Failed to delete anime:', err);
      toast({ variant: 'destructive', title: 'Delete Error', description: `Could not delete ${animeTitle}.` });
    }
  };

  const handleToggleFeatured = async (anime: Anime) => {
    setTogglingFeaturedId(anime.id);
    try {
      const newFeaturedStatus = !anime.isFeatured;
      await updateAnimeIsFeatured(anime.id, newFeaturedStatus);
      setAnimes(prevAnimes =>
        prevAnimes.map(a =>
          a.id === anime.id ? { ...a, isFeatured: newFeaturedStatus } : a
        )
      );
      toast({
        title: `Feature Status Updated`,
        description: `${anime.title} is now ${newFeaturedStatus ? 'featured' : 'not featured'}.`,
      });
    } catch (err) {
      console.error('Failed to toggle featured status:', err);
      toast({ variant: 'destructive', title: 'Update Error', description: `Could not update featured status for ${anime.title}.` });
    } finally {
      setTogglingFeaturedId(null);
    }
  };

  const filteredAnimes = animes.filter(anime =>
    anime.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    anime.genre.some(g => g.toLowerCase().includes(searchTerm.toLowerCase())) ||
    anime.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (animeId: string) => {
    router.push(`/admin/edit-anime/${animeId}`);
  };

  return (
    <Card className="shadow-lg border-border/40">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-semibold text-primary">Content Library</CardTitle>
        <CardDescription>View, edit, feature, or delete existing anime and movies in the database.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by title, genre, ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-input border-border/70 focus:border-primary h-10"
            />
          </div>
          <Button onClick={fetchAnimes} className="w-full sm:w-auto" variant="outline" disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh List
          </Button>
        </div>

        {isLoading && <div className="flex justify-center py-10"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>}
        
        {error && !isLoading && (
          <div className="text-center py-10 text-destructive bg-destructive/5 p-6 rounded-lg">
            <AlertCircle className="mx-auto h-12 w-12 mb-3" />
            <p className="text-lg font-medium">{error}</p>
          </div>
        )}

        {!isLoading && !error && filteredAnimes.length === 0 && (
          <p className="text-center py-10 text-muted-foreground text-lg">
            {searchTerm ? `No content found matching "${searchTerm}".` : 'No anime content found in the database yet.'}
          </p>
        )}

        {!isLoading && !error && filteredAnimes.length > 0 && (
          <div className="space-y-4">
            {filteredAnimes.map(anime => (
              <Card key={anime.id} className="flex flex-col sm:flex-row items-start sm:items-center p-4 gap-4 bg-card/70 hover:bg-card/90 transition-colors duration-200 ease-in-out rounded-lg shadow-sm border border-border/30">
                <div className="flex-shrink-0 w-20 h-28 relative rounded-md overflow-hidden border border-border/20">
                  <Image 
                    src={anime.coverImage || `https://picsum.photos/seed/${anime.id}/100/150`} 
                    alt={anime.title} 
                    fill
                    sizes="80px" 
                    className="object-cover"
                    data-ai-hint="anime poster"
                     />
                </div>
                <div className="flex-grow">
                  <h4 className="font-semibold text-lg text-foreground flex items-center">
                    {anime.title} <span className="text-sm text-muted-foreground ml-1">({anime.year})</span>
                    {anime.isFeatured && <Badge variant="default" className="ml-2 text-xs bg-yellow-500/20 text-yellow-700 border-yellow-500/30"><Star className="w-3 h-3 mr-1"/>Featured</Badge>}
                  </h4>
                  <div className="text-xs text-muted-foreground mt-1">
                    <span>ID: {anime.id}</span> | <span>Type: <Badge variant="secondary" className="text-xs">{anime.type}</Badge></span> | <span>Status: <Badge variant={anime.status === 'Completed' ? 'default' : 'outline'} className={`text-xs ${anime.status === 'Completed' ? 'bg-green-500/20 text-green-700' : anime.status === 'Ongoing' ? 'bg-sky-500/20 text-sky-700' : '' }`}>{anime.status}</Badge></span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {anime.genre.slice(0,4).map(g => <Badge key={g} variant="outline" className="text-xs">{g}</Badge>)}
                    {anime.genre.length > 4 && <Badge variant="outline" className="text-xs">+{anime.genre.length - 4} more</Badge>}
                  </div>
                </div>
                <div className="flex-shrink-0 flex flex-col sm:flex-row items-center gap-2 mt-3 sm:mt-0 w-full sm:w-auto">
                  <div className="flex items-center space-x-2">
                    <Label htmlFor={`featured-switch-${anime.id}`} className="text-xs cursor-pointer flex items-center">
                        {togglingFeaturedId === anime.id ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : anime.isFeatured ? <StarOff className="h-3.5 w-3.5 mr-1.5 text-yellow-600" /> : <Star className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />}
                        {anime.isFeatured ? 'Unfeature' : 'Feature'}
                    </Label>
                    <Switch
                        id={`featured-switch-${anime.id}`}
                        checked={anime.isFeatured || false}
                        onCheckedChange={() => handleToggleFeatured(anime)}
                        disabled={togglingFeaturedId === anime.id}
                        className="data-[state=checked]:bg-yellow-500 data-[state=unchecked]:bg-input"
                    />
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleEdit(anime.id)} className="w-full sm:w-auto hover:bg-primary/10 hover:border-primary">
                    <Edit className="mr-1.5 h-3.5 w-3.5" /> Edit
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" className="w-full sm:w-auto">
                        <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete &quot;{anime.title}&quot; and all its associated data from the database.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(anime.id, anime.title)}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          Confirm Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
