
'use client';

import type { UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type * as z from 'zod';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import React from 'react';

interface AuthFormProps<T extends z.ZodType<any, any>> {
  formSchema: T;
  onSubmit: (values: z.infer<T>) => Promise<void>;
  isRegister?: boolean;
  isLoading: boolean;
  error: string | null;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  defaultValues?: Partial<z.infer<T>>;
  children?: (form: UseFormReturn<z.infer<T>>) => React.ReactNode; // Added children prop
}

export function AuthForm<T extends z.ZodType<any, any>>({
  formSchema,
  onSubmit,
  isRegister = false,
  isLoading,
  error,
  setError,
  defaultValues,
  children, // Destructure children
}: AuthFormProps<T>) {
  const form = useForm<z.infer<T>>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues || (isRegister ? { fullName: '', username: '', email: '', password: '', confirmPassword: '', photoURL: '' } : { identifier: '', password: '' }) as z.infer<T>,
  });

  const handleFormChange = () => {
    if (error) {
      setError(null); 
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" onChange={handleFormChange}>
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Authentication Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {isRegister && (
          <>
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Son Goku" {...field} />
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
                    <Input placeholder="e.g., goku_dbz" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="name@example.com" {...field} type="email" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}
        {!isRegister && (
            <FormField
            control={form.control}
            name="identifier" 
            render={({ field }) => (
                <FormItem>
                <FormLabel>Email or Username</FormLabel> 
                <FormControl>
                    <Input placeholder="name@example.com or your_username" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        )}
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input placeholder="••••••••" {...field} type="password" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {isRegister && (
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                  <Input placeholder="••••••••" {...field} type="password" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        {/* Render custom children if provided, passing the form instance */}
        {children && children(form)}

        <Button type="submit" className="w-full btn-primary-gradient" disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            isRegister ? 'Create Account' : 'Sign In'
          )}
        </Button>
         <div className="mt-4 text-center text-sm">
          {isRegister ? (
            <>
              Already have an account?{' '}
              <Link href="/login" className="underline text-primary hover:text-primary/80">
                Sign in
              </Link>
            </>
          ) : (
            <>
              Don&apos;t have an account?{' '}
              <Link href="/register" className="underline text-primary hover:text-primary/80">
                Sign up
              </Link>
            </>
          )}
        </div>
        {!isRegister && (
            <div className="mt-2 text-center text-sm">
                <Link href="/forgot-password" /* Implement this page later */ className="underline text-muted-foreground hover:text-primary/80">
                    Forgot password?
                </Link>
            </div>
        )}
      </form>
    </Form>
  );
}

