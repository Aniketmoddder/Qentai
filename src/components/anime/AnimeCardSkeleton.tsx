// src/components/anime/AnimeCardSkeleton.tsx
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface AnimeCardSkeletonProps {
  className?: string;
}

export default function AnimeCardSkeleton({ className }: AnimeCardSkeletonProps) {
  return (
    <div
      className={cn(
        "group block",
        "w-[45vw] max-w-[180px] sm:w-auto sm:max-w-[200px] md:max-w-[220px]", 
        className
      )}
    >
      <div
        className={cn(
          "bg-card/50 rounded-lg shadow-md flex flex-col overflow-hidden h-full animate-pulse border border-border/20" 
        )}
      >
        {/* Image Container Skeleton - maintaining aspect ratio */}
        <Skeleton className="relative w-full aspect-[2/3] rounded-t-lg bg-muted/50" />
        
        {/* Text Content Area Skeleton */}
        <div className="p-2.5 space-y-1.5 mt-auto">
          <Skeleton className="h-4 w-11/12 rounded bg-muted/40" /> 
          {/* <Skeleton className="h-3 w-3/4 rounded bg-muted/40" />  Optional: for subtext/genre */}
        </div>
      </div>
    </div>
  );
}

