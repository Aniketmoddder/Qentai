
import Container from '@/components/layout/container';
import Logo from '@/components/common/logo';
import Link from 'next/link';
import { Github, Twitter, Send, ListChecks, History, Tag } from 'lucide-react'; 
import { Button } from '@/components/ui/button';
import ThemeSwitcher from '@/components/theme/ThemeSwitcher';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = [
    { href: '/', label: 'Home' },
    { href: '/browse?sort=top', label: 'Top Animes' },
    { href: '/genres', label: 'Genres' },
    { href: '/browse', label: 'Browse All' },
    { href: '/profile?tab=wishlist', label: 'Watchlist' },
    { href: '/profile?tab=history', label: 'History' },
    { href: '/contact', label: 'Contact Us' },
  ];

  return (
    <footer className="bg-card border-t border-border/30 pt-10 pb-8 mt-16">
      <Container>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-y-8 gap-x-6 mb-8">
          
          <div className="md:col-span-5 lg:col-span-6 space-y-3">
            <Logo iconSize={27} />
            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
              Your ultimate destination for anime streaming. Discover new series and enjoy your favorites, all in one place.
            </p>
          </div>

          <div className="md:col-span-4 lg:col-span-3">
            <h3 className="text-base font-semibold text-foreground mb-4">Quick Links</h3>
            <ul className="space-y-2 columns-2">
              {footerLinks.map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5 py-1">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="md:col-span-3 lg:col-span-3 space-y-4">
              <div>
                  <h3 className="text-base font-semibold text-foreground mb-3">Follow Us</h3>
                  <div className="flex space-x-2">
                      <Button variant="ghost" size="icon" asChild className="text-muted-foreground w-9 h-9">
                          <Link href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter"><Twitter size={18} /></Link>
                      </Button>
                      <Button variant="ghost" size="icon" asChild className="text-muted-foreground w-9 h-9">
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
        
        <div className="mt-8 pt-6 border-t border-border/30 text-center text-xs text-muted-foreground">
          &copy; {currentYear} Qentai. All rights reserved. This is a project for portfolio purposes and is not an official service.
        </div>
      </Container>
    </footer>
  );
}
