
'use client';

import Link from 'next/link';
import { Search, Menu, LogOut, LogIn, UserPlus, User as UserIcon, LayoutGrid, Tag, Settings, Command } from 'lucide-react'; 
import Logo from '@/components/common/logo';
import Container from '@/components/layout/container';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose, SheetTrigger } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useState, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import LiveSearchDialog from '@/components/search/LiveSearchDialog';
import { cn } from '@/lib/utils';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLiveSearchOpen, setIsLiveSearchOpen] = useState(false);
  
  const router = useRouter();
  const pathname = usePathname();
  const currentSearchParams = useSearchParams();
  const { user, appUser, loading: authLoading } = useAuth(); 
  const { toast } = useToast();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  useEffect(() => {
    if (isMobileMenuOpen) setIsMobileMenuOpen(false);
    if (isLiveSearchOpen) setIsLiveSearchOpen(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, currentSearchParams]); 

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        setIsLiveSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/browse?sort=top', label: 'Top Anime' },
    { href: '/genres', label: 'Genres' },
    { href: '/browse', label: 'Browse All'}
  ];

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
      router.push('/'); 
    } catch (error) {
      console.error("Logout failed", error);
      toast({ variant: "destructive", title: "Logout Failed", description: "Could not log out. Please try again." });
    }
  };

  const getAvatarFallback = () => {
    if (appUser?.fullName) return appUser.fullName.charAt(0).toUpperCase();
    if (appUser?.displayName) return appUser.displayName.charAt(0).toUpperCase();
    if (appUser?.email) return appUser.email.charAt(0).toUpperCase();
    if (user?.displayName) return user.displayName.charAt(0).toUpperCase();
    if (user?.email) return user.email.charAt(0).toUpperCase();
    return 'U';
  };
  
  const isNavItemActive = (itemHref: string) => {
    if (itemHref === '/') return pathname === '/';
    // This logic handles query params for active state
    return pathname === itemHref.split('?')[0] && currentSearchParams.toString() === itemHref.split('?')[1];
  };

  return (
    <>
      <header 
        className={cn(
          "sticky top-0 z-50 h-16 transition-all duration-300 ease-in-out",
          isScrolled 
            ? 'bg-background/80 backdrop-blur-lg border-b border-border/50 shadow-md' 
            : 'bg-gradient-to-b from-black/50 to-transparent'
        )}
      >
        <Container className="flex h-full items-center justify-between">
          <div className="flex items-center gap-4">
            <Logo iconSize={24} />
            <nav className="hidden lg:flex items-center space-x-6">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-primary",
                    isNavItemActive(item.href) ? 'text-primary' : 'text-foreground/80'
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            <Button variant="ghost" size="icon" className="text-foreground/80 hover:text-primary" onClick={() => setIsLiveSearchOpen(true)}>
              <Search className="h-5 w-5" />
              <span className="sr-only">Open search</span>
            </Button>

            {authLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            ) : user && appUser ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={appUser.photoURL || user.photoURL || undefined} alt={appUser.displayName || user.displayName || 'User'} />
                      <AvatarFallback>{getAvatarFallback()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-popover border-border shadow-xl" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none text-foreground">{appUser.fullName || appUser.displayName || user.displayName || user.email?.split('@')[0]}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {appUser.email || user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-border" />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center cursor-pointer text-foreground hover:bg-primary/10">
                      <UserIcon className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  {(appUser.role === 'owner' || appUser.role === 'admin') && ( 
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="flex items-center cursor-pointer text-foreground hover:bg-primary/10">
                          <LayoutGrid className="mr-2 h-4 w-4" /> Admin Panel
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator className="bg-border"/> 
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:bg-destructive/20 focus:text-destructive cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden md:flex items-center space-x-2">
                  <Button asChild variant="ghost" className="text-foreground/80 hover:text-primary px-3 h-9 text-sm">
                      <Link href="/login">Login</Link>
                  </Button>
                  <Button asChild className="btn-primary-gradient rounded-full px-4 h-9 text-sm">
                      <Link href="/register">Sign Up</Link>
                  </Button>
              </div>
            )}

            <div className="lg:hidden">
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-foreground/80 hover:text-primary">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="bg-card p-0 flex flex-col w-[80vw] max-w-xs sm:max-w-sm border-l-border">
                  <SheetHeader className="p-4 pb-2 border-b border-border"> 
                    <SheetTitle><Logo iconSize={24} /></SheetTitle> 
                  </SheetHeader>
                  <div className="flex-grow overflow-y-auto">
                    <nav className="flex flex-col space-y-1 p-3">
                      {navItems.map((item) => (
                        <SheetClose asChild key={item.label}>
                          <Link
                            href={item.href}
                            className={cn(
                              "text-base font-medium hover:text-primary transition-colors py-2.5 px-3 rounded-md hover:bg-primary/10",
                              isNavItemActive(item.href) ? 'text-primary bg-primary/15' : 'text-foreground'
                            )}
                          >
                            {item.label}
                          </Link>
                        </SheetClose>
                      ))}
                    </nav>
                  </div>
                  <div className="p-3 border-t border-border mt-auto">
                    {user ? (
                      <SheetClose asChild>
                          <Button variant="outline" onClick={handleLogout} className="w-full text-destructive border-destructive/70 hover:bg-destructive/10">
                            <LogOut className="mr-2 h-4 w-4"/> Log Out
                          </Button>
                      </SheetClose>
                    ) : (
                      <div className="space-y-2">
                        <SheetClose asChild>
                          <Button asChild variant="outline" className="w-full">
                            <Link href="/login">Login</Link>
                          </Button>
                        </SheetClose>
                        <SheetClose asChild>
                          <Button asChild variant="default" className="w-full btn-primary-gradient">
                            <Link href="/register">Sign Up</Link>
                          </Button>
                        </SheetClose>
                      </div>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </Container>
      </header>
      <LiveSearchDialog isOpen={isLiveSearchOpen} onOpenChange={setIsLiveSearchOpen} />
    </>
  );
}
