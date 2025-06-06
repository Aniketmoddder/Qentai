
'use client';

import Link from 'next/link';
import { Search, Menu, LogOut, LogIn, UserPlus, User as UserIcon, LayoutGrid, Tag, Settings, Command } from 'lucide-react'; 
import Logo from '@/components/common/logo';
import Container from '@/components/layout/container';
import { Button } from '@/components/ui/button';
// Input component might not be needed directly in header anymore
// import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useState, useEffect, FormEvent, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import LiveSearchDialog from '@/components/search/LiveSearchDialog'; // Import the new dialog

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  // searchQuery for old desktop input is removed
  // mobileSearchQuery for old sheet search is removed
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  // isSearchDrawerOpen for old sheet search is removed
  const [isLiveSearchOpen, setIsLiveSearchOpen] = useState(false); // State for the new dialog
  
  const router = useRouter();
  const pathname = usePathname();
  const currentSearchParams = useSearchParams();
  const { user, appUser, loading: authLoading } = useAuth(); 
  const { toast } = useToast();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    const headerElement = document.querySelector('header');
    if (headerElement) {
      document.documentElement.style.setProperty('--header-height', `${headerElement.offsetHeight}px`);
    }
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Close menus on navigation
  useEffect(() => {
    if (isMobileMenuOpen) setIsMobileMenuOpen(false);
    if (isLiveSearchOpen) setIsLiveSearchOpen(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, currentSearchParams]); 

  // Global keyboard shortcut for Live Search Dialog (Ctrl+S or Cmd+S)
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

  // handleSearchSubmit is removed as search is handled within LiveSearchDialog

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
    if (itemHref.includes('?')) {
        const [pathOnly, queryPart] = itemHref.split('?');
        if (pathname !== pathOnly) return false;

        const currentQueryParams = new URLSearchParams(currentSearchParams.toString());
        const itemQueryParams = new URLSearchParams(queryPart);
        
        let allMatch = true;
        itemQueryParams.forEach((value, key) => {
            if (currentQueryParams.get(key) !== value) {
                allMatch = false;
            }
        });
        if ((itemHref === '/browse' || itemHref === '/browse?sort=top') && currentQueryParams.has('genre') && !itemQueryParams.has('genre')) {
            return false;
        }
        if ((itemHref === '/browse' || itemHref === '/browse?sort=top') && currentQueryParams.has('type') && !itemQueryParams.has('type')) {
            return false;
        }
        if(itemHref === '/browse' && currentQueryParams.has('sort') && !itemQueryParams.has('sort')) {
            return false;
        }
        return allMatch;
    }
    return pathname === itemHref;
  };

  return (
    <>
      <header 
        className={`sticky top-0 z-50 transition-all duration-200 ease-in-out ${
          isScrolled ? 'bg-background/90 backdrop-blur-md shadow-lg' : 'bg-transparent'
        }`}
      >
        <Container className="flex items-center justify-between py-3">
          <div className="flex items-center gap-4">
            <Logo iconSize={27} />
            <nav className="hidden lg:flex items-center space-x-5">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`text-sm font-medium hover:text-primary transition-colors ${isNavItemActive(item.href) ? 'text-primary' : 'text-muted-foreground'}`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Old desktop search input removed. Search icon now opens LiveSearchDialog */}
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary" onClick={() => setIsLiveSearchOpen(true)}>
              <Search className="h-5 w-5" />
              <span className="sr-only">Open search</span>
            </Button>

            {!authLoading && user && appUser ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0">
                    <Avatar className="h-8 w-8">
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
                  <DropdownMenuItem asChild>
                    <Link href="/profile/settings" className="flex items-center cursor-pointer text-foreground hover:bg-primary/10">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
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
            ) : !authLoading && !user ? (
              <div className="hidden md:flex items-center space-x-2">
                  <Button asChild variant="ghost" className="text-muted-foreground hover:text-primary px-3 h-8 text-sm">
                      <Link href="/login">Login</Link>
                  </Button>
                  <Button asChild className="btn-primary-gradient rounded-full px-4 h-8 text-sm">
                      <Link href="/register">Sign Up</Link>
                  </Button>
              </div>
            ) : authLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            ): null }

            <div className="lg:hidden">
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="bg-card p-0 flex flex-col w-[80vw] max-w-xs sm:max-w-sm border-l-border">
                  <SheetHeader className="p-4 pb-2 border-b border-border"> 
                    <SheetTitle><Logo iconSize={27} /></SheetTitle> 
                  </SheetHeader>
                  <div className="flex-grow overflow-y-auto">
                    <nav className="flex flex-col space-y-1 p-3">
                      {navItems.map((item) => (
                        <SheetClose asChild key={item.label}>
                          <Link
                            href={item.href}
                            className={`text-base font-medium hover:text-primary transition-colors py-2.5 px-3 rounded-md hover:bg-primary/10 ${isNavItemActive(item.href) ? 'text-primary bg-primary/15' : 'text-foreground'}`}
                          >
                            {item.label === 'Genres' && <Tag className="inline-block w-4 h-4 mr-1.5" />}
                            {item.label}
                          </Link>
                        </SheetClose>
                      ))}
                      {!authLoading && user && appUser && (
                        <>
                          <SheetClose asChild>
                            <Link
                              href="/profile"
                              className={`text-base font-medium hover:text-primary transition-colors py-2.5 px-3 rounded-md hover:bg-primary/10 flex items-center ${pathname === "/profile" ? 'text-primary bg-primary/15' : 'text-foreground'}`}
                            >
                              <UserIcon className="mr-2 h-4 w-4" /> Profile
                            </Link>
                          </SheetClose>
                          <SheetClose asChild>
                            <Link
                              href="/profile/settings"
                              className={`text-base font-medium hover:text-primary transition-colors py-2.5 px-3 rounded-md hover:bg-primary/10 flex items-center ${pathname === "/profile/settings" ? 'text-primary bg-primary/15' : 'text-foreground'}`}
                            >
                              <Settings className="mr-2 h-4 w-4" /> Settings
                            </Link>
                          </SheetClose>
                        </>
                      )}
                      {appUser && (appUser.role === 'owner' || appUser.role === 'admin') && (
                          <SheetClose asChild>
                            <Link
                              href="/admin"
                              className={`text-base font-medium hover:text-primary transition-colors py-2.5 px-3 rounded-md hover:bg-primary/10 flex items-center ${pathname === "/admin" ? 'text-primary bg-primary/15' : 'text-foreground'}`}
                            >
                              <LayoutGrid className="mr-2 h-4 w-4" /> Admin Panel
                            </Link>
                          </SheetClose>
                      )}
                    </nav>
                  </div>
                  <div className="p-3 border-t border-border space-y-2.5">
                    {!authLoading && user ? (
                      <SheetClose asChild>
                          <Button variant="outline" onClick={handleLogout} className="w-full text-destructive border-destructive/70 hover:bg-destructive/10">
                            <LogOut className="mr-2 h-4 w-4"/> Log Out
                          </Button>
                      </SheetClose>
                    ) : !authLoading && !user ? (
                      <>
                        <SheetClose asChild>
                          <Button asChild variant="outline" className="w-full text-foreground border-primary/70 hover:bg-primary/10 hover:text-primary">
                            <Link href="/login"><LogIn className="mr-2 h-4 w-4"/>Login</Link>
                          </Button>
                        </SheetClose>
                        <SheetClose asChild>
                          <Button asChild variant="default" className="w-full btn-primary-gradient rounded-md">
                            <Link href="/register"><UserPlus className="mr-2 h-4 w-4"/>Sign Up</Link>
                          </Button>
                        </SheetClose>
                      </>
                    ) : authLoading ? (
                        <div className="flex justify-center py-2"> 
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                    ): null}
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
