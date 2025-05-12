
import Container from '@/components/layout/container';
import Logo from '@/components/common/logo';
import Link from 'next/link';
import { Github, Twitter, Send, ListChecks, History, Grid3X3 as QuickActionsIcon, Tag } from 'lucide-react'; 
import { Button } from '@/components/ui/button';
import ThemeSwitcher from '@/components/theme/ThemeSwitcher';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-card border-t border-border/30 pt-12 pb-8 mt-16 relative">
      <Container>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div className="space-y-3">
            <Logo iconSize={27} />
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your ultimate destination for anime streaming. Discover new series and enjoy your favorites, all in one place.
            </p>
          </div>

          <div className="md:pl-4">
            <h3 className="text-base font-semibold text-foreground mb-3">Qentai</h3>
            <ul className="space-y-1.5">
              <li><Link href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">Home</Link></li>
              <li><Link href="/browse?sort=top" className="text-sm text-muted-foreground hover:text-primary transition-colors">Top Animes</Link></li>
              <li><Link href="/genres" className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center"><Tag size={14} className="mr-1.5"/>Genres</Link></li>
              <li><Link href="/browse" className="text-sm text-muted-foreground hover:text-primary transition-colors">Browse All</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-base font-semibold text-foreground mb-3">Help</h3>
            <ul className="space-y-1.5">
              <li><Link href="/contact" className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center"><Send size={14} className="mr-1.5"/>Message Us</Link></li>
              <li><Link href="/profile?tab=wishlist" className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center"><ListChecks size={14} className="mr-1.5"/>Watchlist</Link></li>
              <li><Link href="/profile?tab=history" className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center"><History size={14} className="mr-1.5"/>History</Link></li>
            </ul>
          </div>
          
           <div className="space-y-4">
            <div>
                <h3 className="text-base font-semibold text-foreground mb-3">Follow Us</h3>
                <div className="flex space-x-3">
                <Button variant="ghost" size="icon" asChild className="text-muted-foreground hover:text-primary w-8 h-8">
                    <Link href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter"><Twitter size={18} /></Link>
                </Button>
                <Button variant="ghost" size="icon" asChild className="text-muted-foreground hover:text-primary w-8 h-8">
                    <Link href="https://github.com" target="_blank" rel="noopener noreferrer" aria-label="Github"><Github size={18} /></Link>
                </Button>
                </div>
            </div>
            <div>
                 <h3 className="text-base font-semibold text-foreground mb-2">Theme</h3>
                 <ThemeSwitcher />
            </div>
          </div>

        </div>
        
        <div className="mt-10 pt-6 border-t border-border/30 text-center text-xs text-muted-foreground">
          &copy; {currentYear} Qentai. All rights reserved. Not an official service.
        </div>
      </Container>

      <div className="absolute -top-5 right-8 md:right-12">
        <Button size="icon" className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full w-12 h-12 shadow-lg hover:shadow-primary/50">
          <QuickActionsIcon size={24} />
          <span className="sr-only">Quick Actions</span>
        </Button>
      </div>
    </footer>
  );
}
