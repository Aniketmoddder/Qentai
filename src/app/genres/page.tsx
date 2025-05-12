// src/app/genres/page.tsx
import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import Container from '@/components/layout/container';
import { getUniqueGenres } from '@/services/animeService';
import { Card, CardContent } from '@/components/ui/card';
import { Tag, Zap, Compass, Ghost, Palette, Rocket, Drama, AlertCircle, Loader2, Heart as HeartIconLucide, School, Users, Swords, Brain, VenetianMask, History, Music, CookingPot, Film, Tv, Smile, Briefcase, Popcorn, Atom } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Explore All Genres - Qentai',
  description: 'Discover anime by browsing through a comprehensive list of genres.',
};

// Expanded genre to icon mapping
const genreIcons: Record<string, React.ElementType> = {
  'Action': Zap,
  'Adventure': Compass,
  'Animation': Film,
  'Comedy': Ghost, // Kept Ghost for Comedy, Smile could also be used
  'Crime': Briefcase, // Using Briefcase for Crime
  'Demons': VenetianMask,
  'Drama': Drama,
  'Ecchi': HeartIconLucide, // Explicitly using Heart for Ecchi
  'Family': Users, // Re-using Users
  'Fantasy': Palette,
  'Game': Rocket, // Re-using Rocket
  'Harem': Users, // Re-using Users
  'Historical': History,
  'Horror': VenetianMask,
  'Isekai': Compass, // Re-using Compass
  'Josei': Users, // Re-using Users
  'Kids': Smile, // Using Smile for Kids
  'Magic': Palette, // Re-using Palette
  'Martial Arts': Swords,
  'Mecha': Atom, // Using Atom for Mecha/Robots
  'Military': Zap, // Re-using Zap
  'Music': Music,
  'Mystery': Compass, // Re-using Compass
  'Parody': Ghost, // Re-using Ghost
  'Police': Briefcase, // Re-using Briefcase
  'Psychological': Brain,
  'Reality': Tv, // Using TV for Reality
  'Romance': HeartIconLucide,
  'Samurai': Swords, // Re-using Swords
  'School': School,
  'Sci-Fi': Rocket,
  'Seinen': Users, // Re-using Users
  'Shoujo': Users, // Re-using Users
  'Shounen': Users, // Re-using Users
  'Slice of Life': CookingPot,
  'Soap': Drama, // Re-using Drama
  'Space': Rocket, // Re-using Rocket
  'Sports': Popcorn, // Using Popcorn for Sports entertainment
  'Super Power': Zap, // Re-using Zap
  'Supernatural': Ghost, // Re-using Ghost
  'Talk': Users, // Re-using Users
  'Thriller': Zap, // Re-using Zap
  'Vampire': VenetianMask, // Re-using VenetianMask
  'War & Politics': Swords, // Re-using Swords
  'Western': Compass, // Re-using Compass
  'Default': Tag,
};


async function GenresDisplay() {
  let genres: string[] = [];
  let error: string | null = null;
  const defaultFallbackGenres = ['Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Demons', 'Drama', 'Ecchi', 'Family', 'Fantasy', 'Game', 'Harem', 'Historical', 'Horror', 'Isekai', 'Josei', 'Kids', 'Magic', 'Martial Arts', 'Mecha', 'Military', 'Music', 'Mystery', 'Parody', 'Police', 'Psychological', 'Reality', 'Romance', 'Samurai', 'School', 'Sci-Fi', 'Seinen', 'Shoujo', 'Shounen', 'Slice of Life', 'Soap', 'Space', 'Sports', 'Super Power', 'Supernatural', 'Talk', 'Thriller', 'Vampire', 'War & Politics', 'Western'];


  try {
    genres = await getUniqueGenres();
    if (genres.length === 0) {
      console.warn("No genres fetched from DB, using comprehensive fallback list for Genres page.");
      genres = defaultFallbackGenres.sort();
    }
  } catch (e) {
    console.error("Failed to load genres for /genres page:", e);
    error = "Could not load genres at this time. Please try refreshing the page. Using fallback list.";
    genres = defaultFallbackGenres.sort();
  }

  if (error && genres.length === 0) { // Only show error if fallback also somehow fails (shouldn't)
    return (
      <div className="my-12 flex flex-col items-center text-center">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-destructive mb-2">Error Loading Genres</h2>
        <p className="text-muted-foreground">{error}</p>
        <Link href="/" className="mt-6">
          <Button variant="outline">Go Back Home</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-5">
      {genres.map((genre) => {
        const IconComponent = genreIcons[genre] || genreIcons['Default'];
        const isHeartGenre = ['romance', 'ecchi'].includes(genre.toLowerCase());
        return (
          <Link key={genre} href={`/browse?genre=${encodeURIComponent(genre)}`} passHref legacyBehavior={false}>
            <Card className="group bg-card hover:bg-primary/10 border-border/30 shadow-sm hover:shadow-primary/20 transition-all duration-300 ease-in-out transform hover:-translate-y-1 cursor-pointer h-full flex flex-col">
              <CardContent className="p-4 sm:p-5 flex flex-col items-center justify-center text-center flex-grow">
                <IconComponent className={cn("w-8 h-8 sm:w-9 sm:h-9 mb-2 text-primary group-hover:text-primary transition-colors", isHeartGenre ? 'fill-primary' : '')} />
                <p className="text-sm sm:text-base font-semibold text-foreground group-hover:text-primary transition-colors truncate w-full">
                  {genre}
                </p>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-var(--header-height)-1px)]">
      <Loader2 className="w-12 h-12 animate-spin text-primary" />
      <p className="ml-3 text-muted-foreground">Loading genres...</p>
    </div>
  );
}


export default function GenresPage() {
  return (
    <Container className="py-8 md:py-12 min-h-[calc(100vh-var(--header-height,4rem)-var(--footer-height,0px)-1px)]">
      <div className="mb-8 md:mb-10 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-primary mb-2 font-zen-dots">Explore All Genres</h1>
        <p className="text-lg text-muted-foreground font-orbitron">
          Find your next favorite anime by diving into diverse genres.
        </p>
      </div>
      <Suspense fallback={<LoadingFallback />}>
        <GenresDisplay />
      </Suspense>
    </Container>
  );
}
