
'use client';

import type { Anime } from '@/types/anime';
import { Button } from '@/components/ui/button';
import { Heart, Bookmark, Loader2, AlertCircle, RotateCcw } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { gsap } from 'gsap';

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

  const heartIconRef = useRef<SVGSVGElement>(null);
  const bookmarkIconRef = useRef<SVGSVGElement>(null);
  const favButtonRef = useRef<HTMLButtonElement>(null);
  const wishButtonRef = useRef<HTMLButtonElement>(null);


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
        setIsFavorited(false); // Update React state first
        toast({ title: "Removed from Favorites", description: `${anime.title} has been removed from your favorites.` });
        // GSAP Animation for removing favorite
        if (heartIconRef.current && favButtonRef.current) {
          gsap.timeline()
            .to(favButtonRef.current, { scale: 0.97, duration: 0.1, ease: "power1.inOut" })
            .to(heartIconRef.current, { scale: 0.7, opacity: 0.6, duration: 0.2, ease: "power2.in" }, 0)
            .to(heartIconRef.current, { scale: 1, opacity: 1, duration: 0.3, ease: "power2.out" }, ">")
            .to(favButtonRef.current, { scale: 1, duration: 0.2, ease: "back.out(1.7)" }, "<");
        }
      } else {
        await addToFavorites(user.uid, anime.id);
        setIsFavorited(true); // Update React state first
        toast({ title: "Added to Favorites", description: `${anime.title} has been added to your favorites.` });
        // GSAP Animation for adding favorite
        if (heartIconRef.current && favButtonRef.current) {
          gsap.timeline()
            .to(favButtonRef.current, { scale: 0.97, duration: 0.1, ease: "power1.inOut" })
            .fromTo(heartIconRef.current, 
              { scale: 0.5, opacity: 0, rotation: -30 }, 
              { scale: 1.3, opacity: 1, rotation: 0, duration: 0.3, ease: "back.out(2.5)" }
            , "+=0.05")
            .to(heartIconRef.current, { scale: 1, duration: 0.4, ease: "elastic.out(1, 0.5)" })
            .to(favButtonRef.current, { scale: 1, duration: 0.2, ease: "back.out(1.7)" }, "<0.1");
        }
      }
      setInitialStatusError(null); 
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      toast({ variant: "destructive", title: "Error Updating Favorites", description: message });
      // Revert state on error if needed
      if (isFavorited) setIsFavorited(false); else setIsFavorited(true);
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
        setIsInWishlisted(false); // Update React state first
        toast({ title: "Removed from Wishlist", description: `${anime.title} has been removed from your wishlist.` });
        // GSAP Animation for removing from wishlist
        if (bookmarkIconRef.current && wishButtonRef.current) {
          gsap.timeline()
            .to(wishButtonRef.current, { scale: 0.97, duration: 0.1, ease: "power1.inOut" })
            .to(bookmarkIconRef.current, { scale: 0.7, opacity: 0.6, duration: 0.2, ease: "power2.in" }, 0)
            .to(bookmarkIconRef.current, { scale: 1, opacity: 1, duration: 0.3, ease: "power2.out" }, ">")
            .to(wishButtonRef.current, { scale: 1, duration: 0.2, ease: "back.out(1.7)" }, "<");
        }
      } else {
        await addToWishlist(user.uid, anime.id);
        setIsInWishlisted(true); // Update React state first
        toast({ title: "Added to Wishlist", description: `${anime.title} has been added to your wishlist.` });
        // GSAP Animation for adding to wishlist (stamp)
         if (bookmarkIconRef.current && wishButtonRef.current) {
            gsap.timeline()
              .to(wishButtonRef.current, { scale: 0.97, duration: 0.1, ease: "power1.inOut" })
              .to(bookmarkIconRef.current, { 
                y: 6, 
                scale: 0.7,
                rotation: -15,
                duration: 0.1, 
                ease: "power1.in"
              }, "+=0.05")
              .to(bookmarkIconRef.current, { 
                y: -4, 
                scale: 1.2,
                rotation: 5,
                duration: 0.15, 
                ease: "power1.out" 
              })
              .to(bookmarkIconRef.current, { 
                y: 0, 
                scale: 1, 
                rotation: 0,
                duration: 0.4, 
                ease: "elastic.out(1, 0.4)" 
              })
              .to(wishButtonRef.current, { scale: 1, duration: 0.2, ease: "back.out(1.7)" }, "<0.1");
        }
      }
       setInitialStatusError(null); 
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      toast({ variant: "destructive", title: "Error Updating Wishlist", description: message });
      // Revert state on error if needed
      if (isInWishlisted) setIsInWishlisted(false); else setIsInWishlisted(true);
    } finally {
      setLoadingWishlistToggle(false);
    }
  };
  
  const commonButtonClasses = "w-full py-3 rounded-lg text-base sm:w-auto sm:flex-1 md:flex-initial transition-all duration-200 ease-in-out focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";
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
        <Button variant="outline" size="sm" onClick={checkStatus} className="w-full mt-2 border-destructive text-destructive hover:bg-destructive/20 hover:text-destructive-foreground">
          <RotateCcw className="mr-2 h-3 w-3" /> Retry
        </Button>
      </div>
    );
  }

   if (!user) { 
    return (
      <div className={cn("flex flex-col sm:flex-row gap-3", className)}>
        <Button 
          variant="outline" 
          size="lg" 
          className={cn(commonButtonClasses, "bg-card text-card-foreground border-border/50 hover:bg-muted hover:border-border")}
          onClick={() => toast({ title: 'Login Required', description: 'Please log in to manage your favorites.'})}
        >
          <Heart className="mr-2 h-5 w-5 text-muted-foreground" /> Add to Favorites
        </Button>
        <Button 
          variant="outline" 
          size="lg" 
          className={cn(commonButtonClasses, "bg-card text-card-foreground border-border/50 hover:bg-muted hover:border-border")}
          onClick={() => toast({ title: 'Login Required', description: 'Please log in to manage your wishlist.'})}
        >
          <Bookmark className="mr-2 h-5 w-5 text-muted-foreground" /> Add to Wishlist
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col sm:flex-row gap-3 group", className)}>
      <Button
        ref={favButtonRef}
        variant="outline"
        size="lg"
        className={cn(
            commonButtonClasses, 
            "border-border/50", // Base border
            isFavorited 
                ? "bg-destructive/15 text-destructive border-destructive/50 hover:bg-destructive/25" // Active and its hover
                : "bg-card text-card-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/40" // Inactive and its hover
        )}
        onClick={handleFavoriteToggle}
        disabled={loadingFavoriteToggle || isCheckingInitialStatus}
      >
        {loadingFavoriteToggle ? (
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        ) : (
          <Heart 
            ref={heartIconRef} 
            className={cn(
              "mr-2 h-5 w-5 transition-all duration-150", 
              isFavorited ? 'fill-destructive text-destructive' : 'text-muted-foreground group-hover:text-destructive'
            )} 
          />
        )}
        {isFavorited ? 'In Favorites' : 'Add to Favorites'}
      </Button>
      <Button
        ref={wishButtonRef}
        variant="outline"
        size="lg"
        className={cn(
            commonButtonClasses, 
            "border-border/50", // Base border
            isInWishlisted
                ? "bg-primary/15 text-primary border-primary/50 hover:bg-primary/25" // Active and its hover
                : "bg-card text-card-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/40" // Inactive and its hover
        )}
        onClick={handleWishlistToggle}
        disabled={loadingWishlistToggle || isCheckingInitialStatus}
      >
        {loadingWishlistToggle ? (
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        ) : (
          <Bookmark 
            ref={bookmarkIconRef} 
            className={cn(
              "mr-2 h-5 w-5 transition-all duration-150", 
              isInWishlisted ? 'fill-primary text-primary' : 'text-muted-foreground group-hover:text-primary'
            )} 
          />
        )}
        {isInWishlisted ? 'In Wishlist' : 'Add to Wishlist'}
      </Button>
    </div>
  );
}
