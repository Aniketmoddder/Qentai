
'use client';

import type { Anime } from '@/types/anime';
import { Button } from '@/components/ui/button';
import { Heart, Bookmark, Loader2, AlertCircle, RotateCcw } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import React, { useState, useEffect, useCallback } from 'react';
import {
  addToFavorites,
  removeFromFavorites,
  isFavorite,
  addToWishlist,
  removeFromWishlist,
  isInWishlist,
} from '@/services/userDataService';
import { FirestoreError } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface AnimeInteractionControlsProps {
  anime: Anime;
  className?: string;
}

export default function AnimeInteractionControls({ anime, className }: AnimeInteractionControlsProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [isFavorited, setIsFavorited] = useState(false);
  const [isInWishlisted, setIsInWishlisted] = useState(false);
  
  const [loadingFavoriteToggle, setLoadingFavoriteToggle] = useState(false);
  const [loadingWishlistToggle, setLoadingWishlistToggle] = useState(false);
  
  const [isCheckingInitialStatus, setIsCheckingInitialStatus] = useState(true);
  const [initialStatusError, setInitialStatusError] = useState<string | null>(null);

  const getErrorMessage = (error: unknown): string => {
    if (error instanceof FirestoreError) {
      if (error.code === 'unavailable' || error.message.toLowerCase().includes('offline')) {
        return "Network error. Please check your connection and try again. Also, ensure Firestore is enabled in your Firebase project console.";
      }
      if (error.code === 'permission-denied') {
        return "Permission denied. You may not have access to perform this action.";
      }
      return `Error: ${error.message} (Code: ${error.code})`;
    }
    if (error instanceof Error) {
      return error.message;
    }
    return "An unknown error occurred. Please try again.";
  };

  const checkStatus = useCallback(async () => {
    if (!user || !anime.id) {
      setIsFavorited(false);
      setIsInWishlisted(false);
      setIsCheckingInitialStatus(false);
      setInitialStatusError(null);
      return;
    }

    setIsCheckingInitialStatus(true);
    setInitialStatusError(null);
    try {
      const [favStatus, wishStatus] = await Promise.all([
        isFavorite(user.uid, anime.id),
        isInWishlist(user.uid, anime.id)
      ]);
      setIsFavorited(favStatus);
      setIsInWishlisted(wishStatus);
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      setInitialStatusError(message);
      toast({ variant: "destructive", title: "Status Check Failed", description: message });
      setIsFavorited(false); 
      setIsInWishlisted(false);
    } finally {
      setIsCheckingInitialStatus(false);
    }
  }, [user, anime.id, toast]);

  useEffect(() => {
    if (user && anime.id) {
      checkStatus();
    } else {
      setIsCheckingInitialStatus(false);
      setInitialStatusError(null);
      setIsFavorited(false);
      setIsInWishlisted(false);
    }
  }, [user, anime.id, checkStatus]);


  const handleFavoriteToggle = async () => {
    if (!user) {
      toast({ variant: "destructive", title: "Not Logged In", description: "Please log in to manage favorites." });
      return;
    }
    if (initialStatusError && !isFavorited) { 
        toast({ variant: "destructive", title: "Cannot Update Favorites", description: "Please resolve the status loading issue first." });
        return;
    }
    setLoadingFavoriteToggle(true);
    try {
      if (isFavorited) {
        await removeFromFavorites(user.uid, anime.id);
        setIsFavorited(false);
        toast({ title: "Removed from Favorites", description: `${anime.title} has been removed from your favorites.` });
      } else {
        await addToFavorites(user.uid, anime.id);
        setIsFavorited(true);
        toast({ title: "Added to Favorites", description: `${anime.title} has been added to your favorites.` });
      }
      setInitialStatusError(null); 
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      toast({ variant: "destructive", title: "Error Updating Favorites", description: message });
    } finally {
      setLoadingFavoriteToggle(false);
    }
  };

  const handleWishlistToggle = async () => {
    if (!user) {
      toast({ variant: "destructive", title: "Not Logged In", description: "Please log in to manage wishlist." });
      return;
    }
    if (initialStatusError && !isInWishlisted) { 
        toast({ variant: "destructive", title: "Cannot Update Wishlist", description: "Please resolve the status loading issue first." });
        return;
    }
    setLoadingWishlistToggle(true);
    try {
      if (isInWishlisted) {
        await removeFromWishlist(user.uid, anime.id);
        setIsInWishlisted(false);
        toast({ title: "Removed from Wishlist", description: `${anime.title} has been removed from your wishlist.` });
      } else {
        await addToWishlist(user.uid, anime.id);
        setIsInWishlisted(true);
        toast({ title: "Added to Wishlist", description: `${anime.title} has been added to your wishlist.` });
      }
       setInitialStatusError(null); 
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      toast({ variant: "destructive", title: "Error Updating Wishlist", description: message });
    } finally {
      setLoadingWishlistToggle(false);
    }
  };
  
  const commonButtonClasses = "w-full py-3 rounded-lg text-base sm:w-auto sm:flex-1 md:flex-initial"; // sm:flex-1 makes them share space on sm+
  const skeletonClasses = "h-12 w-full sm:w-auto sm:flex-1 md:flex-initial rounded-lg";


  if (isCheckingInitialStatus) {
    return (
        <div className={cn("flex flex-col sm:flex-row gap-3", className)}>
            <Skeleton className={skeletonClasses} />
            <Skeleton className={skeletonClasses} />
        </div>
    );
  }

  if (initialStatusError) {
    return (
      <div className={cn("p-4 bg-destructive/10 border border-destructive/30 rounded-lg", className)}>
        <div className="flex items-start text-destructive mb-2">
          <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm">Error Loading Status</p>
            <p className="text-xs">{initialStatusError}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={checkStatus} className="w-full mt-2 border-destructive text-destructive hover:bg-destructive/20">
          <RotateCcw className="mr-2 h-3 w-3" /> Retry
        </Button>
      </div>
    );
  }

   if (!user) { // Buttons for non-logged in users
    return (
      <div className={cn("flex flex-col sm:flex-row gap-3", className)}>
        <Button 
          variant="outline" 
          size="lg" 
          className={cn(commonButtonClasses, "bg-card hover:bg-card/80 text-card-foreground border-border/50")}
          onClick={() => toast({ title: 'Login Required', description: 'Please log in to manage your favorites.'})}
        >
          <Heart className="mr-2 h-5 w-5" /> Add to Favorites
        </Button>
        <Button 
          variant="outline" 
          size="lg" 
          className={cn(commonButtonClasses, "bg-card hover:bg-card/80 text-card-foreground border-border/50")}
          onClick={() => toast({ title: 'Login Required', description: 'Please log in to manage your wishlist.'})}
        >
          <Bookmark className="mr-2 h-5 w-5" /> Add to Wishlist
        </Button>
      </div>
    );
  }

  // Buttons for logged-in users
  return (
    <div className={cn("flex flex-col sm:flex-row gap-3", className)}>
      <Button
        variant="outline"
        size="lg"
        className={cn(commonButtonClasses, "bg-card hover:bg-card/80 text-card-foreground border-border/50")}
        onClick={handleFavoriteToggle}
        disabled={loadingFavoriteToggle || isCheckingInitialStatus}
      >
        {loadingFavoriteToggle ? (
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        ) : (
          <Heart className={cn("mr-2 h-5 w-5", isFavorited ? 'fill-destructive text-destructive' : '')} />
        )}
        {isFavorited ? 'In Favorites' : 'Add to Favorites'}
      </Button>
      <Button
        variant="outline"
        size="lg"
        className={cn(commonButtonClasses, "bg-card hover:bg-card/80 text-card-foreground border-border/50")}
        onClick={handleWishlistToggle}
        disabled={loadingWishlistToggle || isCheckingInitialStatus}
      >
        {loadingWishlistToggle ? (
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        ) : (
          <Bookmark className={cn("mr-2 h-5 w-5", isInWishlisted ? 'fill-primary text-primary' : '')} />
        )}
        {isInWishlisted ? 'In Wishlist' : 'Add to Wishlist'}
      </Button>
    </div>
  );
}


    