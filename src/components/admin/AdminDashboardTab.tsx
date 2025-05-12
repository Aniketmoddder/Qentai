
'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // Using ShadCN Card
import { BarChart, Users, Film, Tv as TvIcon, Loader2, AlertCircle, Eye, BookmarkPlus, LibraryBig } from 'lucide-react';
import { getAllAnimes } from '@/services/animeService';
import { getAllAppUsers } from '@/services/appUserService';
import type { Anime } from '@/types/anime';

interface Stats {
  totalAnime: number;
  totalUsers: number;
  movies: number;
  tvShows: number;
  latestUser?: string; // Name or email of the latest user
  mostStreamed?: string; // Title of most streamed (placeholder)
  mostBookmarked?: string; // Title of most bookmarked (placeholder)
}

export default function AdminDashboardTab() {
  const [stats, setStats] = useState<Stats>({
    totalAnime: 0,
    totalUsers: 0,
    movies: 0,
    tvShows: 0,
    latestUser: 'N/A',
    mostStreamed: 'N/A',
    mostBookmarked: 'N/A',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [animes, appUsers] = await Promise.all([
          getAllAnimes({ count: -1, filters: {} }), // Ensure filters object is passed
          getAllAppUsers(-1),
        ]);

        const moviesCount = animes.filter(anime => anime.type === 'Movie').length;
        const tvShowsCount = animes.filter(anime => anime.type === 'TV').length;
        
        let latestUserDisplay = 'N/A';
        if (appUsers.length > 0) {
          // Assuming appUsers are sorted by createdAt descending from service
          const latest = appUsers[0];
          latestUserDisplay = latest.displayName || latest.email || 'Unknown';
        }

        setStats({
          totalAnime: animes.length,
          totalUsers: appUsers.length,
          movies: moviesCount,
          tvShows: tvShowsCount,
          latestUser: latestUserDisplay,
          // mostStreamed and mostBookmarked would require tracking logic
          mostStreamed: animes.length > 0 ? animes[0].title : 'N/A', // Placeholder
          mostBookmarked: animes.length > 1 ? animes[1].title : (animes.length > 0 ? animes[0].title : 'N/A'), // Placeholder
        });
      } catch (err) {
        console.error('Failed to fetch admin dashboard stats:', err);
        setError('Could not load dashboard statistics. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-destructive/10 border border-destructive/30 rounded-lg flex flex-col items-center text-destructive">
        <AlertCircle className="h-12 w-12 mb-3" />
        <h3 className="font-semibold text-lg">Error Loading Statistics</h3>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
        <DashboardStatCard icon={Users} title="Total Users" value={stats.totalUsers.toString()} />
        <DashboardStatCard icon={BarChart} title="Latest User" value={stats.latestUser || 'N/A'} isTextValue />
        <DashboardStatCard icon={Eye} title="Most Streamed" value={stats.mostStreamed || 'N/A'} isTextValue />
        <DashboardStatCard icon={BookmarkPlus} title="Most Bookmarked" value={stats.mostBookmarked || 'N/A'} isTextValue />
      </div>
      
      {/* Charts Section - Placeholder for now */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="bg-card shadow-lg border-border/30">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-primary">Acquisition Trends</CardTitle>
          </CardHeader>
          <CardContent className="h-72 flex items-center justify-center text-muted-foreground">
            {/* Placeholder for Line Chart */}
            <p>User Signups Chart (Coming Soon)</p>
          </CardContent>
        </Card>
        <Card className="bg-card shadow-lg border-border/30">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-primary">Recent Users</CardTitle>
          </CardHeader>
          <CardContent className="h-72 flex items-center justify-center text-muted-foreground">
            {/* Placeholder for Recent Users List */}
            <p>Recent Users List (Coming Soon)</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
         <Card className="bg-card shadow-lg border-border/30">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-primary">Anime Preferences by User</CardTitle>
          </CardHeader>
          <CardContent className="h-72 flex items-center justify-center text-muted-foreground">
            {/* Placeholder for Pie Chart */}
            <p>Anime Type Preferences Chart (Coming Soon)</p>
          </CardContent>
        </Card>
         <Card className="bg-card shadow-lg border-border/30">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-primary">Dub vs Sub Preferences</CardTitle>
          </CardHeader>
          <CardContent className="h-72 flex items-center justify-center text-muted-foreground">
            {/* Placeholder for Pie Chart */}
            <p>Dub/Sub Preferences Chart (Coming Soon)</p>
          </CardContent>
        </Card>
      </div>

       {/* Additional Cards for Content Type counts (similar to original request) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 mt-6">
        <DashboardStatCard icon={LibraryBig} title="Total Content" value={stats.totalAnime.toString()} />
        <DashboardStatCard icon={Film} title="Movies" value={stats.movies.toString()} />
        <DashboardStatCard icon={TvIcon} title="TV Shows" value={stats.tvShows.toString()} />
         {/* You can add another relevant stat here if needed */}
      </div>
    </div>
  );
}

interface DashboardStatCardProps {
  icon: React.ElementType;
  title: string;
  value: string;
  isTextValue?: boolean; // To adjust styling for text values like names
}

function DashboardStatCard({ icon: Icon, title, value, isTextValue }: DashboardStatCardProps) {
  return (
    <Card className="bg-card shadow-md border-border/30 hover:shadow-primary/20 transition-shadow duration-200">
      <CardContent className="p-4 sm:p-5 flex items-center space-x-3 sm:space-x-4">
        <div className="p-3 rounded-lg bg-primary/15 text-primary">
          <Icon className="w-6 h-6 sm:w-7 sm:h-7" />
        </div>
        <div>
          <p className="text-xs sm:text-sm font-medium text-muted-foreground">{title}</p>
          <p className={`font-bold text-foreground ${isTextValue ? 'text-base sm:text-lg truncate' : 'text-xl sm:text-2xl'}`} title={isTextValue ? value : undefined}>
            {value}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

