'use client';

import React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { AlertTriangle, ShieldBan, Home } from 'lucide-react';
import Container from '../layout/container';

export default function BannedUserModule() {
  return (
    <Container className="flex flex-col items-center justify-center min-h-[calc(100vh-var(--header-height,4rem)-1px)] py-12 text-center">
      <div className="relative w-48 h-48 md:w-64 md:h-64 mb-8">
        <Image
          src="https://picsum.photos/seed/banned-user-troll/400/400" 
          alt="Funny Banned Image"
          fill
          style={{ objectFit: 'contain' }}
          className="rounded-full shadow-xl border-4 border-destructive"
          data-ai-hint="troll face funny"
        />
         <ShieldBan className="absolute -bottom-2 -right-2 w-16 h-16 text-destructive bg-background p-2 rounded-full border-2 border-destructive" />
      </div>
      <h1 className="text-4xl md:text-5xl font-bold text-destructive mb-4 font-zen-dots">
        Access Denied!
      </h1>
      <p className="text-lg md:text-xl text-muted-foreground mb-2 font-orbitron">
        Oops! Looks like your account has been put on a timeout.
      </p>
      <p className="text-base text-muted-foreground mb-8 max-w-md font-poppins">
        Maybe you tried to watch too much anime at once? Or perhaps you know what you did... 😜
        For now, this area is off-limits.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <Button asChild variant="outline" size="lg" className="border-primary text-primary hover:bg-primary/10">
          <Link href="/">
            <Home className="mr-2 h-5 w-5" />
            Go to Homepage (It's safe there!)
          </Link>
        </Button>
        <Button variant="destructive" size="lg" onClick={() => alert("Contacting support... just kidding! You're still banned. 😂")}>
          <AlertTriangle className="mr-2 h-5 w-5" />
          Complain to Support (Good Luck!)
        </Button>
      </div>
       <p className="text-xs text-muted-foreground mt-12 font-poppins">
        (If you genuinely believe this is an error, please contact the site administrator through other channels.)
      </p>
    </Container>
  );
}
