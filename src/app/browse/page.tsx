// src/app/browse/page.tsx
import type { SuspenseProps } from 'react'; 
import { Suspense } from 'react';
import Container from '@/components/layout/container';
import AnimeCard from '@/components/anime/anime-card';
import type { Anime } from '@/types/anime';
import { getAllAnimes } from '@/services/animeService';
import { AlertCircle, Loader2, ListFilter, FilterX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { FirestoreError } from 'firebase/firestore';

interface BrowsePageProps {
  searchParams: {
    genre?: string;
    type?: Anime['type']; 
    sort?: 'top' | 'title' | 'year' | 'updatedAt' | 'createdAt' | 'popularity' | string; // Ensure popularity is an option
    sortOrder?: 'asc' | 'desc';
    filter?: 'featured' | string;
    q?: string; 
  };
}

async function BrowseContent({ searchParams }: BrowsePageProps) {
  const { genre, type, sort, sortOrder, filter: queryFilter, q: searchQuery } = searchParams;
  let animeList: Anime[] = [];
  let pageTitle = 'Browse All Anime';
  let fetchError: string | null = null;

  try {
    const filters: Parameters<typeof getAllAnimes>[0]['filters'] = {}; 
     if (searchQuery) {
      pageTitle = `Search Results for "${searchQuery}"`;
    } else if (type) {
      filters.type = type;
      pageTitle = type === 'Movie' ? 'Movies' : type === 'TV' ? 'TV Series' : `Browse ${type}`;
    }
    
    if (genre) {
      filters.genre = genre;
      pageTitle = `${genre} Anime`;
       if (!filters.sortBy && !sort) { // Default sort for genre if not otherwise specified
        filters.sortBy = 'popularity'; 
        filters.sortOrder = 'desc';
      }
    }
    
    if (sort) {
      filters.sortBy = sort as 'averageRating' | 'year' | 'title' | 'createdAt' | 'updatedAt' | 'popularity';
      if (sort === 'top') { 
          filters.sortBy = 'averageRating';
          filters.sortOrder = 'desc'; 
          pageTitle = 'Top Rated Anime';
      } else {
          pageTitle = `Sorted by ${sort.charAt(0).toUpperCase() + sort.slice(1)}`;
      }
    }

    if (sortOrder) { 
        filters.sortOrder = sortOrder;
    }

    if (queryFilter === 'featured') {
      filters.featured = true;
      pageTitle = 'Featured Anime';
      if (!filters.sortBy && !sort) { // Default sort for featured if not otherwise specified
        filters.sortBy = 'popularity';
        filters.sortOrder = 'desc';
      }
    }
    
    if (!filters.sortBy && !sort && !genre && !type && !queryFilter) { // Default for "Browse All"
        filters.sortBy = 'updatedAt';
        filters.sortOrder = 'desc';
    }
    
    animeList = await getAllAnimes({ count: 50, filters });

  } catch (error) {
    console.error("Failed to fetch animes for browse page:", error);
    if (error instanceof FirestoreError && error.code === 'failed-precondition' && error.message.includes("index")) {
      fetchError = `The current filter/sort combination requires a Firestore index that hasn't been created yet. Please check the browser's developer console for a direct link to create the missing index in your Firebase project. Details: ${error.message}`;
    } else if (error instanceof Error) {
      fetchError = `Could not load anime data: ${error.message}`;
    }
     else {
      fetchError = "Could not load anime data. Please try again later.";
    }
    pageTitle = "Error Loading Anime";
  }

  return (
    <Container className="py-8 min-h-[calc(100vh-var(--header-height,4rem)-var(--footer-height,0px)-1px)]">
      <div className="mb-6 md:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground section-title-bar">{pageTitle}</h1>
      </div>

      {fetchError && (
        <div className="my-8 p-6 bg-destructive/10 border border-destructive/30 rounded-lg flex flex-col items-start text-destructive">
          <div className="flex items-center mb-2">
            <AlertCircle className="h-6 w-6 mr-3 flex-shrink-0" />
            <h3 className="font-semibold text-lg">Error Loading Content</h3>
          </div>
          <p className="text-sm ml-9 whitespace-pre-line">{fetchError}</p>
           <Button asChild variant="link" className="mt-3 ml-auto text-destructive hover:text-destructive/80">
            <Link href="/">Go Back to Home</Link>
          </Button>
        </div>
      )}

      {!fetchError && animeList.length === 0 && (
        <div className="text-center py-10 bg-card p-8 rounded-lg shadow-md">
          <FilterX className="mx-auto h-12 w-12 text-primary mb-4" />
          <p className="text-xl font-semibold text-foreground mb-2">No Anime Found</p>
          <p className="text-muted-foreground mb-6">
            We couldn&apos;t find any anime matching your criteria. Try a different filter or check back later!
          </p>
          <Button asChild variant="outline">
            <Link href="/">Go Back to Home</Link>
          </Button>
        </div>
      )}

      {!fetchError && animeList.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-3 gap-y-4 sm:gap-x-4 place-items-center sm:place-items-stretch">
          {animeList.map((anime) => (
            <AnimeCard key={anime.id} anime={anime} sizeVariant="small" />
          ))}
        </div>
      )}
    </Container>
  );
}

function LoadingFallback() {
  return (
    <Container className="flex items-center justify-center min-h-[calc(100vh-var(--header-height)-1px)]">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
        <p className="text-lg text-muted-foreground">Loading anime...</p>
      </div>
    </Container>
  );
}


export default function BrowsePage(props: BrowsePageProps) {
  const key = JSON.stringify(props.searchParams);
  return (
    <Suspense key={key} fallback={<LoadingFallback />}>
      <BrowseContent {...props} />
    </Suspense>
  );
}
