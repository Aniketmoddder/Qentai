'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import ProfileDetailsForm from '@/components/profile/ProfileDetailsForm';
import PasswordChangeForm from '@/components/profile/PasswordChangeForm';
import { UserCircle, KeyRound, ArrowLeft, Loader2, ShieldBan, AlertCircle } from 'lucide-react';
import Container from '@/components/layout/container';
import { Button } from '@/components/ui/button';
import BannedUserModule from '@/components/common/BannedUserModule';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

export default function AccountSettingsPage() {
  const { user, appUser, loading: authLoading, isInitializing } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const needsSetup = searchParams.get('initialSetup') === 'true' || (appUser && (appUser.photoURL === null || appUser.bannerImageUrl === null));


  if (isInitializing || authLoading || (!user && !authLoading) || appUser === undefined) {
    return (
      <Container className="flex items-center justify-center min-h-[calc(100vh-var(--header-height)-1px)]">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </Container>
    );
  }
  
  if (!user || !appUser) {
     router.push('/login?redirect=/profile/settings');
     return null;
  }

  if (appUser.status === 'banned') {
    return <BannedUserModule />;
  }

  return (
    <Container className="py-8 md:py-12 min-h-[calc(100vh-var(--header-height,4rem)-var(--footer-height,0px)-1px)]">
      <Button variant="outline" onClick={() => router.push('/profile')} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Profile
      </Button>
      
      <div className="max-w-3xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-primary text-center">Account Settings</h1>
        
        {needsSetup && (
          <Alert variant="default" className="bg-primary/10 border-primary/30 text-primary">
            <AlertCircle className="h-5 w-5 !text-primary" /> {/* Ensure icon color matches */}
            <AlertTitle className="font-semibold">Complete Your Profile!</AlertTitle>
            <AlertDescription>
              Please select an avatar and banner to personalize your Qentai experience.
            </AlertDescription>
          </Alert>
        )}

        <Card className="shadow-xl border-border/50">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-foreground flex items-center">
              <UserCircle className="w-6 h-6 mr-2 text-primary" /> Profile Details
            </CardTitle>
            <CardDescription>Update your personal information, avatar, and banner.</CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileDetailsForm />
          </CardContent>
        </Card>

        <Card className="shadow-xl border-border/50">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-foreground flex items-center">
              <KeyRound className="w-6 h-6 mr-2 text-primary" /> Change Password
            </CardTitle>
            <CardDescription>Update your account password. Choose a strong and unique password.</CardDescription>
          </CardHeader>
          <CardContent>
            <PasswordChangeForm />
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}
