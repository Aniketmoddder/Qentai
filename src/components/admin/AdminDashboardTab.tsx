
'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart as BarChartIcon, Users, Film, Tv as TvIcon, Loader2, AlertCircle, Eye, BookmarkPlus, LibraryBig, UserCheck, TrendingUp, PieChart as PieChartIcon, Tags } from 'lucide-react';
import { getAllAnimes } from '@/services/animeService';
import { getAllAppUsers } from '@/services/appUserService';
import type { Anime } from '@/types/anime';
import type { AppUser } from '@/types/appUser';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, Sector } from 'recharts';
import { useTheme } from '@/context/ThemeContext';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { format, parseISO } from 'date-fns';
import { Badge } from '../ui/badge';
import Link from 'next/link';

interface Stats {
  totalAnime: number;
  totalUsers: number;
  movies: number;
  tvShows: number;
}

interface ChartData {
  userAcquisition: { name: string; users: number }[];
  contentTypes: { name: string; value: number }[];
  genreDistribution: { name: string; count: number }[];
}

const getChartColors = (themeValue: string | undefined) => {
    if (typeof window === 'undefined') {
        return ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F'];
    }
    const style = getComputedStyle(document.documentElement);
    // Use theme values if available, otherwise fallback to defaults
    return [
      style.getPropertyValue('--chart-1').trim() || '#8884d8',
      style.getPropertyValue('--chart-2').trim() || '#82ca9d',
      style.getPropertyValue('--chart-3').trim() || '#ffc658',
      style.getPropertyValue('--chart-4').trim() || '#ff8042',
      style.getPropertyValue('--chart-5').trim() || '#00C49F',
      style.getPropertyValue('--primary').trim() || '#6B5BF1'
    ];
};

const getAvatarFallback = (user: AppUser) => {
    if (user.displayName) return user.displayName.charAt(0).toUpperCase();
    if (user.email) return user.email.charAt(0).toUpperCase();
    return 'U';
};


export default function AdminDashboardTab() {
  const [stats, setStats] = useState<Stats>({
    totalAnime: 0,
    totalUsers: 0,
    movies: 0,
    tvShows: 0,
  });
  const [chartData, setChartData] = useState<ChartData>({
      userAcquisition: [],
      contentTypes: [],
      genreDistribution: [],
  });
  const [recentUsers, setRecentUsers] = useState<AppUser[]>([]);
  const [topContent, setTopContent] = useState<Anime[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { theme } = useTheme();
  const [chartColors, setChartColors] = useState(getChartColors(theme));
  const [activePieIndex, setActivePieIndex] = useState(0);

  useEffect(() => {
    setChartColors(getChartColors(theme));
  }, [theme]);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [animes, appUsers] = await Promise.all([
          getAllAnimes({ count: -1, filters: { sortBy: 'popularity', sortOrder: 'desc' } }), // Explicitly sort by popularity
          getAllAppUsers(-1),
        ]);

        // Process stats
        const moviesCount = animes.filter(anime => anime.type === 'Movie').length;
        const tvShowsCount = animes.filter(anime => anime.type === 'TV').length;
        
        setStats({
          totalAnime: animes.length,
          totalUsers: appUsers.length,
          movies: moviesCount,
          tvShows: tvShowsCount,
        });

        // Process Recent Users
        const sortedUsers = [...appUsers].sort((a,b) => parseISO(b.createdAt as string).getTime() - parseISO(a.createdAt as string).getTime());
        setRecentUsers(sortedUsers.slice(0, 5));

        // Process Top Content (already sorted by popularity from the fetch)
        setTopContent(animes.slice(0, 5));

        // Process User Acquisition Chart Data
        const userAcquisitionData: { [key: string]: number } = {};
        appUsers.forEach(user => {
            if (user.createdAt) {
                const month = format(parseISO(user.createdAt as string), 'yyyy-MM');
                userAcquisitionData[month] = (userAcquisitionData[month] || 0) + 1;
            }
        });
        const last12Months = Array.from({length: 12}, (_, i) => {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            return format(d, 'yyyy-MM');
        }).reverse();
        
        const formattedUserAcquisition = last12Months.map(month => ({
            name: format(parseISO(`${month}-01`), 'MMM yy'),
            users: userAcquisitionData[month] || 0
        }));

        // Process Content Type Chart Data
        const contentTypesCount = animes.reduce((acc, anime) => {
            const type = anime.type || 'Unknown';
            acc[type] = (acc[type] || 0) + 1;
            return acc;
        }, {} as { [key: string]: number });
        const formattedContentTypes = Object.entries(contentTypesCount).map(([name, value]) => ({ name, value }));
        
        // Process Genre Distribution
        const genreCounts = animes.reduce((acc, anime) => {
            (anime.genre || []).forEach(g => {
                acc[g] = (acc[g] || 0) + 1;
            });
            return acc;
        }, {} as Record<string, number>);

        const genreDistributionData = Object.entries(genreCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 15); // Top 15 genres

        setChartData({
            userAcquisition: formattedUserAcquisition,
            contentTypes: formattedContentTypes,
            genreDistribution: genreDistributionData,
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

  const onPieEnter = useCallback((_: any, index: number) => {
    setActivePieIndex(index);
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
  
  const ActiveShape = (props: any) => {
      const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent } = props;
      return (
        <g>
          <text x={cx} y={cy} dy={-8} textAnchor="middle" fill={fill} className="text-lg font-bold">
            {payload.value}
          </text>
           <text x={cx} y={cy} dy={12} textAnchor="middle" fill="hsl(var(--muted-foreground))" className="text-xs">
            ({(percent * 100).toFixed(0)}%)
          </text>
          <Sector
            cx={cx}
            cy={cy}
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            startAngle={startAngle}
            endAngle={endAngle}
            fill={fill}
          />
          <Sector
            cx={cx}
            cy={cy}
            startAngle={startAngle}
            endAngle={endAngle}
            innerRadius={outerRadius + 6}
            outerRadius={outerRadius + 10}
            fill={fill}
          />
        </g>
      );
    };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardStatCard icon={LibraryBig} title="Total Content" value={stats.totalAnime.toString()} />
        <DashboardStatCard icon={Users} title="Total Users" value={stats.totalUsers.toString()} />
        <DashboardStatCard icon={TvIcon} title="TV Shows" value={stats.tvShows.toString()} />
        <DashboardStatCard icon={Film} title="Movies" value={stats.movies.toString()} />
      </div>
      
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2 bg-card shadow-lg border-border/30">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-primary flex items-center">
              <TrendingUp className="mr-2 h-5 w-5"/> User Acquisition
            </CardTitle>
            <CardDescription className="text-xs">New user signups over the last 12 months.</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.userAcquisition} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border)/0.5)"/>
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false}/>
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: 'hsl(var(--accent)/0.1)' }}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: 'var(--radius)',
                  }}
                  labelStyle={{ color: 'hsl(var(--popover-foreground))' }}
                />
                <Bar dataKey="users" fill={chartColors[0]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="bg-card shadow-lg border-border/30">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-primary flex items-center">
              <UserCheck className="mr-2 h-5 w-5"/> Recent Users
            </CardTitle>
            <CardDescription className="text-xs">The 5 most recently joined users.</CardDescription>
          </CardHeader>
          <CardContent className="h-72 flex flex-col justify-center space-y-3 pr-2">
            {recentUsers.map(user => (
              <div key={user.uid} className="flex items-center space-x-3 hover:bg-muted/50 p-1.5 rounded-md">
                <Avatar className="h-9 w-9 border-2 border-primary/20">
                  <AvatarImage src={user.photoURL || undefined} alt={user.displayName || user.email || ''} />
                  <AvatarFallback>{getAvatarFallback(user)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{user.displayName || user.email}</p>
                    <p className="text-xs text-muted-foreground truncate">Joined {format(parseISO(user.createdAt as string), 'dd MMM yyyy')}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

       <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="bg-card shadow-lg border-border/30">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-primary flex items-center">
              <PieChartIcon className="mr-2 h-5 w-5"/> Content Type Distribution
            </CardTitle>
             <CardDescription className="text-xs">Breakdown of content by type in the library.</CardDescription>
          </CardHeader>
          <CardContent className="h-72 w-full flex items-center justify-center">
             <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                    <Tooltip
                        cursor={{ fill: 'hsl(var(--accent)/0.1)' }}
                        contentStyle={{
                            backgroundColor: 'hsl(var(--popover))',
                            borderColor: 'hsl(var(--border))',
                            borderRadius: 'var(--radius)',
                        }}
                    />
                    <Legend
                        iconSize={10}
                        formatter={(value, entry) => <span className="text-muted-foreground">{value}</span>}
                    />
                    <Pie
                        activeIndex={activePieIndex}
                        activeShape={<ActiveShape />}
                        data={chartData.contentTypes}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        onMouseEnter={onPieEnter}
                        paddingAngle={5}
                    >
                      {chartData.contentTypes.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                      ))}
                    </Pie>
                 </PieChart>
             </ResponsiveContainer>
          </CardContent>
        </Card>
         <Card className="xl:col-span-2 bg-card shadow-lg border-border/30">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-primary flex items-center">
              <Tags className="mr-2 h-5 w-5"/> Genre Preferences
            </CardTitle>
            <CardDescription className="text-xs">Distribution of top genres across all content.</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={chartData.genreDistribution} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border)/0.5)"/>
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" width={80} stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ fill: 'hsl(var(--accent)/0.1)' }}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: 'var(--radius)',
                  }}
                  labelStyle={{ color: 'hsl(var(--popover-foreground))' }}
                />
                <Bar dataKey="count" fill={chartColors[1]} radius={[0, 4, 4, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="bg-card shadow-lg border-border/30">
            <CardHeader>
                <CardTitle className="text-lg font-semibold text-primary flex items-center">
                    <TrendingUp className="mr-2 h-5 w-5"/> Most Popular Content
                </CardTitle>
                <CardDescription className="text-xs">Top 5 content by popularity score.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {topContent.map((anime, index) => (
                        <div key={anime.id} className="flex items-center space-x-4 p-2 rounded-md hover:bg-muted/50">
                            <span className="text-lg font-bold text-muted-foreground w-6 text-center">{index + 1}</span>
                            <Avatar className="h-12 w-12 rounded-md">
                                <AvatarImage src={anime.coverImage || undefined} alt={anime.title} className="object-cover"/>
                                <AvatarFallback>{anime.title.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-grow min-w-0">
                                <Link href={`/anime/${anime.id}`} className="font-medium text-foreground truncate hover:underline block">{anime.title}</Link>
                                <p className="text-xs text-muted-foreground">{anime.type} • {anime.year}</p>
                            </div>
                            <Badge variant="secondary" className="flex-shrink-0">
                                Pop: {anime.popularity?.toLocaleString() || 'N/A'}
                            </Badge>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface DashboardStatCardProps {
  icon: React.ElementType;
  title: string;
  value: string;
  isTextValue?: boolean;
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

    