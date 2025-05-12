// src/components/home/HomePageGenreSection.tsx
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronRight, Tag, Zap, Compass, Ghost, Palette, Rocket, Drama, Heart as HeartIconLucide, School, Users, Swords, Brain, VenetianMask, History, Music, CookingPot, Film, Tv, Smile, Briefcase, Popcorn, Atom, Library } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { getUniqueGenres } from '@/services/animeService';

interface GenreItem {
  name: string;
  icon: React.ElementType;
}

const commonGenreIcons: Record<string, React.ElementType> = {
  'Action': Zap,
  'Adventure': Compass,
  'Animation': Film,
  'Comedy': Ghost, 
  'Crime': Briefcase, 
  'Demons': VenetianMask,
  'Drama': Drama,
  'Ecchi': HeartIconLucide, 
  'Family': Users, 
  'Fantasy': Palette,
  'Game': Rocket, 
  'Harem': Users, 
  'Historical': History,
  'Horror': VenetianMask,
  'Isekai': Compass, 
  'Josei': Users, 
  'Kids': Smile, 
  'Magic': Palette, 
  'Martial Arts': Swords,
  'Mecha': Atom, 
  'Military': Zap, 
  'Music': Music,
  'Mystery': Compass, 
  'Parody': Ghost, 
  'Police': Briefcase, 
  'Psychological': Brain,
  'Reality': Tv, 
  'Romance': HeartIconLucide,
  'Samurai': Swords, 
  'School': School,
  'Sci-Fi': Rocket,
  'Seinen': Users, 
  'Shoujo': Users, 
  'Shounen': Users, 
  'Slice of Life': CookingPot,
  'Soap': Drama, 
  'Space': Rocket, 
  'Sports': Popcorn, 
  'Super Power': Zap, 
  'Supernatural': Ghost, 
  'Talk': Users, 
  'Thriller': Zap, 
  'Vampire': VenetianMask, 
  'War & Politics': Swords, 
  'Western': Compass, 
  'Default': Library, // Using Library as a more generic default
};


export default function HomePageGenreSection() {
  const [displayGenres, setDisplayGenres] = useState<GenreItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchAndSetGenres() {
      setIsLoading(true);
      try {
        const allGenres = await getUniqueGenres(); 
        
        // Display up to 6-12 genres for the homepage from the fetched list
        const selectedForHomepage = allGenres.slice(0, 12).map(name => ({
          name,
          icon: commonGenreIcons[name] || commonGenreIcons['Default']
        }));
        
        setDisplayGenres(selectedForHomepage); 
      } catch (error) {
        console.error("Failed to load genres for home page section:", error);
        // Fallback to a smaller default list if fetching fails
        setDisplayGenres([
          { name: 'Action', icon: Zap },
          { name: 'Comedy', icon: Ghost },
          { name: 'Fantasy', icon: Palette },
          { name: 'Sci-Fi', icon: Rocket },
          { name: 'Romance', icon: HeartIconLucide},
          { name: 'Adventure', icon: Compass },
        ].slice(0,6));
      } finally {
        setIsLoading(false);
      }
    }
    fetchAndSetGenres();
  }, []);

  if (isLoading) {
    return (
      <section className="py-6 md:py-8">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground section-title-bar font-orbitron flex items-center">
            <Tag className="w-6 h-6 mr-2 text-primary" /> Explore by Genre
          </h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
          {[...Array(6)].map((_, index) => ( // Show 6 skeletons
            <Card key={index} className="animate-pulse bg-muted/50 h-[100px] md:h-[120px] rounded-lg shadow-sm border border-border/30"></Card>
          ))}
        </div>
      </section>
    );
  }

  if (displayGenres.length === 0) {
    return null; // Don't render the section if no genres are available to display
  }

  return (
    <section className="py-6 md:py-8">
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground section-title-bar font-orbitron flex items-center">
          <Tag className="w-6 h-6 mr-2 text-primary" /> Explore by Genre
        </h2>
        <Button variant="link" asChild className="text-primary hover:text-primary/80 font-poppins">
          <Link href="/genres">View All Genres <ChevronRight className="w-4 h-4 ml-1"/></Link>
        </Button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
        {displayGenres.map((genre) => {
          const isHeartGenre = ['romance', 'ecchi'].includes(genre.name.toLowerCase());
          return (
            <Link key={genre.name} href={`/browse?genre=${encodeURIComponent(genre.name)}`} passHref legacyBehavior={false}>
              <Card className="group bg-card hover:bg-primary/10 border-border/40 shadow-sm hover:shadow-primary/20 transition-all duration-300 ease-in-out transform hover:-translate-y-0.5 cursor-pointer h-[100px] md:h-[120px] rounded-lg">
                <CardContent className="p-3 md:p-4 flex flex-col items-center justify-center text-center h-full">
                  <genre.icon className={cn("w-7 h-7 md:w-8 md:h-8 mb-1.5 text-primary group-hover:text-primary transition-colors", isHeartGenre ? 'fill-primary' : '')} />
                  <p className="text-xs md:text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate w-full">
                    {genre.name}
                  </p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
