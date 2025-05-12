// src/components/home/HeroSkeleton.tsx
import { Skeleton } from '@/components/ui/skeleton';
import Container from '@/components/layout/container';

export default function HeroSkeleton() {
  return (
    <section className="relative h-[65vh] md:h-[80vh] w-full flex items-end -mt-[calc(var(--header-height,4rem)+1px)] bg-card/30 animate-pulse">
      <div className="absolute inset-0">
        <Skeleton className="w-full h-full opacity-50 bg-muted/50" /> {/* Banner Placeholder */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent"></div>
      </div>
      <Container className="relative z-10 pb-12 md:pb-20 text-foreground">
        <div className="max-w-2xl space-y-3 md:space-y-4">
          <Skeleton className="h-6 w-28 mb-2 rounded-md bg-muted/50" /> {/* Badge Placeholder */}
          <Skeleton className="h-10 md:h-14 w-4/5 rounded-md bg-muted/50" /> {/* Title Placeholder */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm">
            <Skeleton className="h-5 w-16 rounded-md bg-muted/50" /> {/* Meta Item Placeholder */}
            <Skeleton className="h-5 w-20 rounded-md bg-muted/50" /> {/* Meta Item Placeholder */}
            <Skeleton className="h-5 w-24 rounded-md bg-muted/50" /> {/* Meta Item Placeholder */}
          </div>
          <Skeleton className="h-4 w-full rounded-md bg-muted/50" /> {/* Synopsis Line 1 Placeholder */}
          <Skeleton className="h-4 w-11/12 rounded-md bg-muted/50" /> {/* Synopsis Line 2 Placeholder */}
          <Skeleton className="h-4 w-5/6 mb-3 md:mb-4 rounded-md bg-muted/50" /> {/* Synopsis Line 3 Placeholder */}
          <div className="flex flex-wrap gap-3 sm:gap-4">
            <Skeleton className="h-11 w-36 rounded-full bg-primary/40" /> {/* Button Placeholder */}
            <Skeleton className="h-11 w-32 rounded-full bg-muted/50" /> {/* Button Placeholder */}
          </div>
        </div>
      </Container>
    </section>
  );
}

