'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import BannedUserModule from '@/components/common/BannedUserModule';
import { Loader2 } from 'lucide-react'; // For loading state if appUser is still undefined

interface AuthStatusGuardProps {
  children: React.ReactNode;
}

export default function AuthStatusGuard({ children }: AuthStatusGuardProps) {
  const { appUser, loading: authContextLoading } = useAuth();
  const pathname = usePathname();

  // If auth context is still loading Firebase user or initial appUser, show a loader or null.
  // This prevents premature rendering of BannedUserModule or children.
  // AuthProvider itself shows a more elaborate loader for the initial app load.
  // This guard focuses on post-initial-load status.
  if (authContextLoading || appUser === undefined) {
    // Minimal loader, or could return null if AuthProvider's loader is sufficient
    // For critical layout shifts, it's better if AuthProvider handles the full initial load screen.
    // This guard primarily acts once basic auth state is known.
    if (pathname !== '/') { // Avoid full screen loader if on homepage when potentially not needed.
        // return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
    }
     // Allow children to render if appUser is still undefined, AuthProvider handles main loading.
     // If we block children here, the app might not render anything until appUser is fully resolved.
  }

  // Check for banned status only if appUser data has been resolved (not undefined)
  if (appUser && appUser.status === 'banned' && pathname !== '/') {
    return <BannedUserModule />;
  }
  
  // If not banned, or on the homepage, or appUser info not yet fully loaded by AuthProvider, render children.
  return <>{children}</>;
}
