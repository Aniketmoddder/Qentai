'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AnimeCard from '@/components/anime/anime-card';
import AnimeCardSkeleton from '@/components/anime/AnimeCardSkeleton'; // Import skeleton
import type { Anime } from '@/types/anime';
import { getUserFavoriteIds, getUserWishlistIds } from '@/services/userDataService';
import { getAnimesByIds } from '@/services/animeService';
import { Loader2, User, Heart, Bookmark, AlertCircle, RotateCcw, Edit3, ShieldBan } from 'lucide-react';
import Container from '@/components/layout/container';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from '@/components/ui/button';
import { FirestoreError } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import BannedUserModule from '@/components/common/BannedUserModule';

export default function ProfilePage() {
  const { user, appUser, loading: authLoading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('favorites');
  const [favoritesList, setFavoritesList] = useState<Anime[]>([]);
  const [wishlistList, setWishlistList] = useState<Anime[]>([]);
  const [isLoadingLists, setIsLoadingLists] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/profile');
    }
  }, [user, authLoading, router]);

  const getErrorMessage = (error: unknown): string => {
    if (error instanceof FirestoreError) {
      if (error.code === 'unavailable' || error.message.toLowerCase().includes('offline')) {
        return "Network error. Could not fetch your lists. Please check your internet connection and try again.";
      }
      if (error.code === 'permission-denied') {
        return "Permission denied. Unable to load your lists.";
      }
      return `Error fetching lists: ${error.message} (Code: ${error.code})`;
    }
    if (error instanceof Error) {
      return error.message;
    }
    return "An unknown error occurred while fetching your lists. Please try again later.";
  };

  const fetchFullAnimeDetails = async (ids: string[]): Promise<Anime[]> => {
    if (ids.length === 0) return [];
    return getAnimesByIds(ids);
  };

  const fetchLists = useCallback(async () => {
    if (user) {
      setIsLoadingLists(true);
      setListError(null);
      try {
        const [favoriteIds, wishlistIds] = await Promise.all([
          getUserFavoriteIds(user.uid),
          getUserWishlistIds(user.uid)
        ]);

        const [resolvedFavorites, resolvedWishlist] = await Promise.all([
          fetchFullAnimeDetails(favoriteIds),
          fetchFullAnimeDetails(wishlistIds),
        ]);
        
        setFavoritesList(resolvedFavorites);
        setWishlistList(resolvedWishlist);

      } catch (error: unknown) {
        console.error("Failed to fetch user lists:", error);
        const message = getErrorMessage(error);
        setListError(message);
      } finally {
        setIsLoadingLists(false);
      }
    }
  }, [user]);

  useEffect(() => {
    if (user && (activeTab === 'favorites' || activeTab === 'wishlist')) {
      fetchLists();
    }
  }, [user, fetchLists, activeTab]);

  if (authLoading || (!user && !authLoading) || appUser === undefined) {
    return (
      <Container className="flex items-center justify-center min-h-[calc(100vh-var(--header-height)-1px)]">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </Container>
    );
  }
  
  if (!user || !appUser) { 
    router.push('/login?redirect=/profile'); 
    return null; 
  }
  
  if (appUser.status === 'banned') {
    return <BannedUserModule />;
  }


  const renderAnimeList = (list: Anime[], type: 'favorite' | 'wishlist') => {
    if (isLoadingLists) {
      return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-3 gap-y-4 sm:gap-x-4 place-items-center sm:place-items-stretch">
          {[...Array(6)].map((_, index) => (
            <AnimeCardSkeleton key={index} />
          ))}
        </div>
      );
    }
    if (listError && (type === 'favorite' && activeTab === 'favorites' || type === 'wishlist' && activeTab === 'wishlist')) { 
      return (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading {type === 'favorite' ? 'Favorites' : 'Wishlist'}</AlertTitle>
          <AlertDescription>
            {listError}
            <Button variant="outline" size="sm" onClick={fetchLists} className="mt-3 ml-auto">
              <RotateCcw className="mr-2 h-3 w-3" /> Retry
            </Button>
          </AlertDescription>
        </Alert>
      );
    }
    if (list.length === 0) {
      return (
        <div className="text-center py-10 text-muted-foreground">
          <p>
            {type === 'favorite'
              ? "You haven't added any anime to your favorites yet."
              : "Your wishlist is empty."}
          </p>
          <p>Explore anime and add some to your list!</p>
        </div>
      );
    }
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-3 gap-y-4 sm:gap-x-4 place-items-center sm:place-items-stretch">
        {list.map(anime => (
          <AnimeCard key={anime.id} anime={anime} sizeVariant="small"/>
        ))}
      </div>
    );
  };

  const defaultBanner = 'https://picsum.photos/seed/default-banner/1600/400';
  const defaultAvatar = `https://avatar.vercel.sh/${appUser.username || appUser.email || appUser.uid}.png?size=128`;

  return (
    <div className="min-h-[calc(100vh-var(--header-height,4rem)-var(--footer-height,0px)-1px)]">
      <section className="relative h-[30vh] md:h-[40vh] w-full bg-card -mt-[calc(var(--header-height,4rem)+1px)]">
        <Image
          src={appUser.bannerImageUrl || defaultBanner}
          alt={`${appUser.displayName || 'User'}'s banner`}
          fill
          style={{ objectFit: 'cover' }}
          className="opacity-70"
          priority
          data-ai-hint="anime landscape profile"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
      </section>

      <Container className="relative z-10 -mt-16 md:-mt-24 pb-12">
        <div className="flex flex-col sm:flex-row items-center sm:items-end space-y-4 sm:space-y-0 sm:space-x-6 mb-8">
          <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-background shadow-xl overflow-hidden flex-shrink-0 bg-muted">
            <Image
              src={appUser.photoURL || defaultAvatar}
              alt={appUser.displayName || 'User Avatar'}
              fill
              style={{ objectFit: 'cover' }}
              data-ai-hint="character avatar"
            />
          </div>
          <div className="flex-grow text-center sm:text-left">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-0.5">{appUser.fullName || appUser.displayName || 'User Profile'}</h1>
            <p className="text-muted-foreground text-sm md:text-base">@{appUser.username || appUser.email?.split('@')[0]}</p>
            {user.email && <p className="text-muted-foreground text-xs md:text-sm mt-0.5">{user.email}</p>}
          </div>
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href="/profile/settings">
              <Edit3 className="mr-2 h-4 w-4" /> Edit Profile
            </Link>
          </Button>
        </div>
      
        {listError && !isLoadingLists && (activeTab === 'favorites' || activeTab === 'wishlist') && ( 
           <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error Loading Lists</AlertTitle>
              <AlertDescription>
                {listError}
                <Button variant="outline" size="sm" onClick={fetchLists} className="mt-3 ml-auto">
                  <RotateCcw className="mr-2 h-3 w-3" /> Retry
                </Button>
              </AlertDescription>
            </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <ScrollArea className="w-full whitespace-nowrap sm:whitespace-normal mb-6 pb-2">
            <TabsList className="inline-flex sm:flex gap-2 p-0 bg-transparent">
              <TabsTrigger
                value="favorites"
                className={cn(
                  "flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-md border transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  activeTab === 'favorites'
                    ? 'bg-destructive/10 text-destructive border-destructive hover:bg-destructive/20'
                    : 'bg-card text-card-foreground border-border hover:bg-muted'
                )}
              >
                <Heart className={cn("w-5 h-5", activeTab === 'favorites' && 'fill-destructive')} /> Favorites
              </TabsTrigger>
              <TabsTrigger
                value="wishlist"
                className={cn(
                  "flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-md border transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  activeTab === 'wishlist'
                    ? 'bg-primary/10 text-primary border-primary hover:bg-primary/20'
                    : 'bg-card text-card-foreground border-border hover:bg-muted'
                )}
              >
                <Bookmark className={cn("w-5 h-5", activeTab === 'wishlist' && 'fill-primary')} /> Wishlist
              </TabsTrigger>
            </TabsList>
            <ScrollBar orientation="horizontal" className="sm:hidden h-1.5" />
          </ScrollArea>
          
          <TabsContent value="favorites">
            {renderAnimeList(favoritesList, 'favorite')}
          </TabsContent>
          <TabsContent value="wishlist">
            {renderAnimeList(wishlistList, 'wishlist')}
          </TabsContent>
        </Tabs>
      </Container>
    </div>
  );
}
