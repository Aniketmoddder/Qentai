'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams as useNextSearchParams } from 'next/navigation';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { z } from 'zod';
import { AuthForm } from '@/components/auth/auth-form';
import Container from '@/components/layout/container';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Logo from '@/components/common/logo';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Chrome, Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { getAppUserByUsername } from '@/services/appUserService';


const loginSchema = z.object({
  identifier: z.string().min(3, { message: 'Email or Username must be at least 3 characters.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useNextSearchParams();
  const { user, appUser, loading: authLoading, setLoading: setAuthContextLoading, refreshAppUser, isInitializing } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!isInitializing && !authLoading && user) {
      const redirectUrl = searchParams.get('redirect') || '/';
      // Check if profile setup is needed before final redirect
      if (appUser && (appUser.photoURL === null || appUser.bannerImageUrl === null)) {
        router.push('/profile/settings?initialSetup=true');
      } else {
        router.push(redirectUrl);
      }
    }
  }, [user, appUser, authLoading, isInitializing, router, searchParams]);

  const handleLogin = async (values: LoginFormValues) => {
    setIsLoading(true);
    setError(null);
    let emailToUse: string | null = null;

    try {
      if (values.identifier.includes('@')) {
        emailToUse = values.identifier;
      } else {
        const fetchedAppUser = await getAppUserByUsername(values.identifier);
        if (fetchedAppUser && fetchedAppUser.email) {
          emailToUse = fetchedAppUser.email;
        } else {
          setError("User with that username not found.");
          toast({
            variant: "destructive",
            title: "Login Failed",
            description: "User with that username not found.",
          });
          setIsLoading(false);
          return;
        }
      }

      if (!emailToUse) {
        setError("Invalid email or username.");
        toast({ variant: "destructive", title: "Login Failed", description: "Invalid email or username." });
        setIsLoading(false);
        return;
      }

      await signInWithEmailAndPassword(auth, emailToUse, values.password);
      await refreshAppUser(); // Ensure appUser context is updated

      toast({
        title: "Login Successful",
        description: "Welcome back!",
      });
      // Redirection handled by useEffect
    } catch (e: any) {
      let errorMessage = 'Failed to sign in. Please check your credentials.';
      if (e.code === 'auth/user-not-found' || e.code === 'auth/invalid-credential' || e.code === 'auth/wrong-password') {
        errorMessage = 'Invalid email/username or password.';
      } else if (e.message) {
        errorMessage = e.message.replace('Firebase: ', '').split(' (')[0] || errorMessage;
      }
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setError(null);
    setAuthContextLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      // onAuthStateChanged in AuthProvider will handle upsertAppUserInFirestore
      await refreshAppUser(); // Ensure appUser context is updated after potential upsert

      toast({
        title: "Login Successful",
        description: "Welcome!",
      });
      // Redirection handled by useEffect after appUser state is confirmed
    } catch (e: any) {
      let errorMessage = "Failed to sign in with Google. Please try again.";
      const errorCode = e.code;
      console.error("Google Sign-In Error:", e);

      if (errorCode === 'auth/popup-closed-by-user') {
        errorMessage = "Google Sign-In was cancelled. Please try again.";
      } else if (errorCode === 'auth/cancelled-popup-request') {
        errorMessage = "Google Sign-In request was cancelled. Please ensure only one sign-up window is open.";
      } else if (errorCode === 'auth/popup-blocked') {
        errorMessage = "Google Sign-In popup was blocked by your browser. Please disable your popup blocker and try again.";
      } else if (errorCode === 'auth/operation-not-allowed') {
        errorMessage = "Google Sign-In is not enabled for this app. Please check Firebase console settings.";
      } else if (errorCode === 'auth/unauthorized-domain') {
        errorMessage = "This domain is not authorized for Google Sign-In. Please check Firebase console settings (Authorized JavaScript origins).";
      } else if (e.message) {
        errorMessage = e.message.replace('Firebase: ', '').split(' (')[0] || errorMessage;
      }
      
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Google Sign-In Failed",
        description: `${errorMessage}${errorCode ? ` (Error: ${errorCode})` : ''}`,
      });
    } finally {
      setIsGoogleLoading(false);
      setAuthContextLoading(false);
    }
  };
  
  if (isInitializing || (authLoading && !user)) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
             <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
    );
  }
  // If user is logged in and profile complete, useEffect redirects.

  return (
    <Container className="flex items-center justify-center min-h-[calc(100vh-var(--header-height)-1px)] py-12">
      <Card className="w-full max-w-md shadow-2xl bg-card/80 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-6">
            <Logo iconSize={27} />
          </div>
          <CardTitle className="text-3xl font-bold">Welcome Back!</CardTitle>
          <CardDescription>Sign in to continue to Qentai.</CardDescription>
        </CardHeader>
        <CardContent>
          <AuthForm
            formSchema={loginSchema}
            onSubmit={handleLogin}
            isLoading={isLoading}
            error={error}
            setError={setError}
            defaultValues={{ identifier: '', password: ''}}
          />
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
            <div className="relative w-full">
                <Separator className="absolute top-1/2 -translate-y-1/2" />
                <p className="relative bg-card/80 px-2 text-xs text-muted-foreground text-center mx-auto w-fit">OR CONTINUE WITH</p>
            </div>
            <Button variant="outline" className="w-full hover:bg-primary/10" onClick={handleGoogleSignIn} disabled={isGoogleLoading || isLoading}>
                {isGoogleLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <Chrome className="mr-2 h-4 w-4" />
                )}
                Google
            </Button>
        </CardFooter>
      </Card>
    </Container>
  );
}
