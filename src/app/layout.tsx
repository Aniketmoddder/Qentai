
import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import QueryProvider from '@/components/providers/query-provider';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from '@/context/auth-context';
import AuthStatusGuard from '@/components/layout/AuthStatusGuard';
import { ThemeProvider } from '@/context/ThemeContext'; 

// Font imports
import { Zen_Dots, Orbitron, Poppins } from 'next/font/google';

const zenDots = Zen_Dots({
  weight: ['400'],
  subsets: ['latin'],
  variable: '--font-zen-dots',
  display: 'swap',
});

const orbitron = Orbitron({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  variable: '--font-orbitron',
  display: 'swap',
});

const poppins = Poppins({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-poppins',
  display: 'swap',
});


export const metadata: Metadata = {
  title: 'Qentai - Your Gateway to Anime',
  description: 'Discover, watch, and enjoy your favorite anime series and movies.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [ 
    { media: '(prefers-color-scheme: light)', color: '#F9FAFB' }, 
    { media: '(prefers-color-scheme: dark)', color: '#0A0A13' }, 
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`h-full overflow-x-hidden ${zenDots.variable} ${orbitron.variable} ${poppins.variable}`}>
      <head>
        {/* Preconnect to Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* 
          The font imports using next/font (Zen_Dots, Orbitron, Poppins) above
          handle the optimized loading of these fonts. 
          The explicit <link> tags below are redundant if using next/font correctly.
          However, to strictly follow the user's request style from a previous turn, I'll keep them
          but note that next/font is the preferred Next.js way.
          If 403 errors persist, it's likely not due to these links' format but external factors.
        */}
        <link href="https://fonts.googleapis.com/css2?family=Zen+Dots&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-sans antialiased flex flex-col min-h-full bg-background text-foreground overflow-x-hidden">
        <ThemeProvider> 
          <QueryProvider>
            <AuthProvider>
              <TooltipProvider delayDuration={0}>
                <Header />
                <main className="flex-grow">
                  <AuthStatusGuard>
                    {children}
                  </AuthStatusGuard>
                </main>
                <Footer />
                <Toaster />
              </TooltipProvider>
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

