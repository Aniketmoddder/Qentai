'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, LockKeyhole } from 'lucide-react';

const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required.'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters.'),
  confirmNewPassword: z.string().min(6, 'Confirm new password must be at least 6 characters.'),
}).refine(data => data.newPassword === data.confirmNewPassword, {
  message: "New passwords don't match.",
  path: ['confirmNewPassword'],
});

type PasswordChangeFormValues = z.infer<typeof passwordChangeSchema>;

export default function PasswordChangeForm() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PasswordChangeFormValues>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    },
  });

  const onSubmit = async (data: PasswordChangeFormValues) => {
    if (!user || !user.email) {
      toast({ variant: 'destructive', title: 'Error', description: 'User not authenticated or email not available.' });
      return;
    }

    setIsSubmitting(true);
    try {
      // Re-authenticate the user
      const credential = EmailAuthProvider.credential(user.email, data.currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Update the password
      await updatePassword(user, data.newPassword);

      toast({ title: 'Password Updated', description: 'Your password has been successfully changed.' });
      form.reset();
    } catch (error: any) {
      console.error("Error changing password:", error);
      let errorMessage = "Failed to change password. Please try again.";
      if (error.code === 'auth/wrong-password') {
        errorMessage = "Incorrect current password.";
        form.setError("currentPassword", { type: "manual", message: errorMessage });
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = "Too many attempts. Please try again later.";
      } else if (error.message) {
        errorMessage = error.message.replace('Firebase: ', '').split(' (')[0];
      }
      toast({ variant: 'destructive', title: 'Password Change Failed', description: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!user) {
     return <p className="text-muted-foreground">You need to be logged in to change your password.</p>;
  }
  // If user signed in with Google, password change is not applicable here
  const isGoogleSignIn = user.providerData.some(provider => provider.providerId === "google.com");
  if (isGoogleSignIn) {
    return <p className="text-sm text-muted-foreground p-4 bg-muted/30 rounded-md">Password management is handled by Google for accounts signed in with Google.</p>;
  }


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="currentPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Current Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Enter your current password" {...field} className="bg-input border-border/70 focus:border-primary" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Enter your new password" {...field} className="bg-input border-border/70 focus:border-primary" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmNewPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm New Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Confirm your new password" {...field} className="bg-input border-border/70 focus:border-primary" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto btn-primary-gradient">
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LockKeyhole className="mr-2 h-4 w-4" />}
          Change Password
        </Button>
      </form>
    </Form>
  );
}
