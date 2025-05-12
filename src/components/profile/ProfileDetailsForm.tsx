'use client';

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form'; 
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { updateAppUserProfile } from '@/services/appUserService';
import { updateProfile as updateFirebaseAuthProfile } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, Save } from 'lucide-react';
import AvatarSelector from '@/components/common/AvatarSelector'; 
import BannerSelector from '@/components/common/BannerSelector'; // Import BannerSelector

const profileDetailsSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters.').max(50, 'Full name must be at most 50 characters.'),
  username: z.string().min(3, 'Username must be at least 3 characters.').max(20, 'Username must be at most 20 characters.').regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores.'),
  photoURL: z.string().url('Must be a valid URL.').optional().or(z.literal('')),
  bannerImageUrl: z.string().url('Must be a valid URL for banner.').optional().or(z.literal('')),
});

type ProfileDetailsFormValues = z.infer<typeof profileDetailsSchema>;

export default function ProfileDetailsForm() {
  const { user, appUser, refreshAppUser } = useAuth(); 
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ProfileDetailsFormValues>({
    resolver: zodResolver(profileDetailsSchema),
    defaultValues: {
      fullName: '',
      username: '',
      photoURL: '',
      bannerImageUrl: '',
    },
  });

  useEffect(() => {
    if (appUser) {
      form.reset({
        fullName: appUser.fullName || appUser.displayName || '',
        username: appUser.username || '',
        photoURL: appUser.photoURL || '',
        bannerImageUrl: appUser.bannerImageUrl || '',
      });
    }
  }, [appUser, form]);

  const onSubmit = async (data: ProfileDetailsFormValues) => {
    if (!user || !appUser) {
      toast({ variant: 'destructive', title: 'Error', description: 'User not found.' });
      return;
    }

    setIsSubmitting(true);
    try {
      await updateAppUserProfile(user.uid, {
        fullName: data.fullName,
        username: data.username,
        photoURL: data.photoURL || null,
        bannerImageUrl: data.bannerImageUrl || null,
      });

      if (auth.currentUser && (auth.currentUser.displayName !== data.fullName || auth.currentUser.photoURL !== (data.photoURL || null))) {
        await updateFirebaseAuthProfile(auth.currentUser, {
          displayName: data.fullName,
          photoURL: data.photoURL || null, 
        });
      }
      
      await refreshAppUser();

      toast({ title: 'Profile Updated', description: 'Your profile details have been saved.' });
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({ variant: 'destructive', title: 'Update Failed', description: error.message || 'Could not update profile.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!appUser) {
    return <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="Your full name" {...field} className="bg-input border-border/70 focus:border-primary" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="Your unique username" {...field} className="bg-input border-border/70 focus:border-primary" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Controller
          control={form.control}
          name="photoURL"
          render={({ field }) => (
            <AvatarSelector
              currentAvatarUrl={field.value}
              onAvatarSelect={(url) => field.onChange(url)}
              title="Change Avatar"
              sectionTitle="Characters"
            />
          )}
        />
         {form.formState.errors.photoURL && <FormMessage>{form.formState.errors.photoURL.message}</FormMessage>}
        
        <Controller
          control={form.control}
          name="bannerImageUrl"
          render={({ field }) => (
            <BannerSelector
              currentBannerUrl={field.value}
              onBannerSelect={(url) => field.onChange(url)}
              title="Change Banner"
              sectionTitle="Profile Banners"
            />
          )}
        />
        {form.formState.errors.bannerImageUrl && <FormMessage>{form.formState.errors.bannerImageUrl.message}</FormMessage>}

        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto btn-primary-gradient">
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save Changes
        </Button>
      </form>
    </Form>
  );
}
