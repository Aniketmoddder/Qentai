'use client';
import React, { useState, useEffect } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { useAuth } from '@/hooks/use-auth';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2, AlertCircle, GaugeCircle, UsersRound, DownloadCloud, LibraryBig, ListVideo, FilePlus2, Palette, Settings as SettingsIcon, Menu, Home } from 'lucide-react';
import Container from '@/components/layout/container'; 
import { Toaster } from '@/components/ui/toaster';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Logo from '@/components/common/logo';

export type AdminNavItem = {
  name: string;
  href: string;
  icon: React.ElementType;
  isOwnerOnly?: boolean;
  isAdminOrOwner?: boolean; 
  isThemeSettings?: boolean; 
  exactMatch?: boolean; 
};

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'ninjax.desi@gmail.com';

export const adminNavItems: AdminNavItem[] = [
  { name: 'Dashboard', href: '/admin', icon: GaugeCircle, exactMatch: true, isAdminOrOwner: true },
  { name: 'Content Lib.', href: '/admin/content-management', icon: LibraryBig, isAdminOrOwner: true },
  { name: 'Episode Editor', href: '/admin/episode-editor', icon: ListVideo, isAdminOrOwner: true },
  { name: 'TMDB Import', href: '/admin/tmdb-import', icon: DownloadCloud, isAdminOrOwner: true },
  { name: 'Manual Add', href: '/admin/manual-add', icon: FilePlus2, isAdminOrOwner: true },
  { name: 'User Mgt.', href: '/admin/user-management', icon: UsersRound, isOwnerOnly: true },
  { name: 'Theme Settings', href: '/admin/theme-settings', icon: Palette, isOwnerOnly: true, isThemeSettings: true },
];

export default function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const { user, appUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login?redirect=/admin');
      } else if (appUser && !(appUser.role === 'owner' || appUser.role === 'admin')) {
        toast({ variant: 'destructive', title: 'Unauthorized', description: 'You do not have permission to access the admin panel.' });
        router.push('/');
      } else if (appUser === null && user.email !== ADMIN_EMAIL) {
        toast({ variant: 'destructive', title: 'Access Error', description: 'Could not verify your admin permissions.' });
        router.push('/');
      }
    }
  }, [user, appUser, authLoading, router]);

  if (authLoading || (!user && !authLoading) || (user && appUser === undefined)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[hsl(var(--sidebar-background))] text-[hsl(var(--sidebar-foreground))]">
        <Loader2 className="w-16 h-16 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!user || (appUser && !(appUser.role === 'owner' || appUser.role === 'admin')) || (appUser === null && user?.email !== ADMIN_EMAIL) ) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
        <AlertCircle className="mx-auto h-16 w-16 text-destructive mb-4" />
        <h1 className="text-3xl font-bold text-destructive text-center">Access Denied</h1>
        <p className="text-muted-foreground text-lg text-center">You do not have permission to view the admin panel.</p>
        <Button onClick={() => router.push('/')} variant="link" className="mt-6 text-lg">
          Go to Homepage
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <AdminSidebar
        navItems={adminNavItems}
        currentAppUserRole={appUser?.role}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        pathname={pathname}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
         {/* New Mobile-only toggle bar */}
        <div className="md:hidden sticky top-0 z-20 flex items-center justify-between p-3 border-b border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar-background))] h-16 shadow-sm">
            <Button
            variant="ghost"
            size="icon"
            className="text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--sidebar-accent-foreground))]"
            onClick={() => setIsSidebarOpen(true)}
            >
            <Menu className="h-6 w-6" />
            <span className="sr-only">Open sidebar</span>
            </Button>
            <div className="flex-grow flex justify-center items-center"> {/* Centered Logo */}
                <Logo iconSize={24} />
            </div>
            <Button variant="outline" size="icon" asChild className="border-[hsl(var(--sidebar-border))] hover:bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-foreground))] w-9 h-9">
                <Link href="/"><Home size={18} /><span className="sr-only">View Site</span></Link>
            </Button>
        </div>
        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto bg-[hsl(var(--muted)/0.3)]">
          {children}
        </main>
      </div>
      <Toaster />
    </div>
  );
}

const toast = (options: { variant?: 'default' | 'destructive', title: string, description: string }) => {
  if (typeof window !== 'undefined') { 
    const { toast: showToast } = (window as any).___toastHook || {}; 
    if (showToast) {
      showToast(options);
    } else {
      console.warn("Toast hook not available for layout-level toast:", options.title);
    }
  }
};