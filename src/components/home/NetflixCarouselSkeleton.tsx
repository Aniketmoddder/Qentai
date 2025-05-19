
// src/components/home/NetflixCarouselSkeleton.tsx
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export default function NetflixCarouselSkeleton() {
  return (
    <div className="py-6 md:py-8 shows-carousel-container-wrapper">
      <Skeleton className="h-8 w-1/3 mb-6 rounded bg-muted/50 ml-4 md:ml-0" /> {/* Title Skeleton */}
      <div className="shows-swiper-container"> {/* Mimics Swiper container for padding */}
        <div className="flex overflow-x-auto pb-4 gap-x-4 sm:gap-x-5 px-4 scrollbar-hide"> {/* Mimics slide wrapper */}
          {[...Array(5)].map((_, index) => (
            <div key={`netflix-skel-${index}`} className={cn(
                "shows-swiper-slide !w-auto flex-shrink-0", // Mimic slide width behavior
              )}
            >
              <div className="carousel-item-wrapper"> {/* Mimic item wrapper for structure */}
                {/* Ranking Number Area Skeleton - a bit to the left and bottom */}
                <Skeleton className={cn(
                  "absolute opacity-30",
                  "h-[70px] w-[50px] sm:h-[90px] sm:w-[65px] md:h-[110px] md:w-[80px]", // Responsive size
                  "bottom-[5px] left-[-10px] sm:bottom-[8px] sm:left-[-15px]",
                  "rounded-md bg-muted/40" // Lighter skeleton for number area
                )} />
                {/* Poster Skeleton */}
                <Skeleton className={cn(
                  "show-poster-container bg-muted/50", // Use existing class for dimensions
                  "w-[150px] h-[225px] sm:w-[160px] sm:h-[240px] md:w-[180px] md:h-[270px]" // Explicit sizes
                )} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
