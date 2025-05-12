
'use client';

import { useSearchParams } from 'next/navigation';
import Container from '@/components/layout/container';
import AnimeCard from '@/components/anime/anime-card';
import type { Anime } from '@/types/anime';
import { useEffect, useState, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { AlertCircle, Loader2 } from 'lucide-react';
import { searchAnimes } from '@/services/animeService'; // Import the new search function

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q');
  const [searchResults, setSearchResults] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const performSearch = async () => {
      if (query) {
        setLoading(true);
        setError(null);
        try {
          const results = await searchAnimes(query);
          setSearchResults(results);
        } catch (err) {
          console.error("Search failed:", err);
          setError("Failed to perform search. Please try again.");
        } finally {
          setLoading(false);
        }
      } else {
        setSearchResults([]);
        setLoading(false);
        setError(null);
      }
    };
    performSearch();
  }, [query]);

  if (loading) {
    return (
      <Container className="py-12 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
        <p className="text-muted-foreground">Searching...</p>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container className="py-12 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <p className="text-xl font-semibold text-destructive mb-2">Search Error</p>
        <p className="text-muted-foreground">{error}</p>
         <Button asChild variant="link" className="mt-4">
            <Link href="/">Go Back to Home</Link>
          </Button>
      </Container>
    );
  }

  return (
    <Container className="py-8 min-h-[calc(100vh-var(--header-height,4rem)-var(--footer-height,0px)-1px)]">
      <h1 className="text-3xl font-bold mb-6 text-foreground">
        {query ? `Search Results for "${query}"` : 'Search'}
      </h1>

      {!query && (
        <div className="text-center py-10">
          <p className="text-muted-foreground text-lg">
            Please enter a search term in the search bar above.
          </p>
        </div>
      )}

      {query && searchResults.length === 0 && !loading && (
        <div className="text-center py-10 bg-card p-8 rounded-lg shadow-md">
          <AlertCircle className="mx-auto h-12 w-12 text-primary mb-4" />
          <p className="text-xl font-semibold text-foreground mb-2">No Results Found</p>
          <p className="text-muted-foreground mb-6">
            We couldn&apos;t find any anime matching your search for &quot;{query}&quot;.
          </p>
          <Button asChild variant="outline">
            <Link href="/">Go Back to Home</Link>
          </Button>
        </div>
      )}

      {query && searchResults.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-5">
          {searchResults.map(anime => (
            <AnimeCard key={anime.id} anime={anime} />
          ))}
        </div>
      )}
    </Container>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <Container className="py-12 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
        <p className="text-muted-foreground">Loading search results...</p>
      </Container>
    }>
      <SearchContent />
    </Suspense>
  );
}
