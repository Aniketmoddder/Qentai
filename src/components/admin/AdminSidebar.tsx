'use client';

import React from 'react';
import Link from 'next/link';
import Logo from '@/components/common/logo';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { AdminNavItem } from '@/app/admin/layout'; 
import { useAuth } from '@/hooks/use-auth';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';

interface AdminSidebarProps {
  navItems: AdminNavItem[];
  currentAppUserRole?: 'owner' | 'admin' | 'member';
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
  pathname: string;
}

export default function AdminSidebar({
  navItems,
  currentAppUserRole,
  isSidebarOpen,
  setIsSidebarOpen,
  pathname,
}: AdminSidebarProps) {
  const { toast } = useToast();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
      router.push('/login');
    } catch (error) {
      console.error("Logout failed", error);
      toast({ variant: "destructive", title: "Logout Failed", description: "Could not log out." });
    }
  };

  const filteredNavItems = navItems.filter(item => {
    if (item.isOwnerOnly && currentAppUserRole !== 'owner') return false;
    if (item.isThemeSettings && currentAppUserRole !== 'owner') return false;
    if (item.isAdminOrOwner && !(currentAppUserRole === 'admin' || currentAppUserRole === 'owner')) return false;
    return true;
  });

  const commonLinkClasses = "flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors duration-150 ease-in-out";
  const activeLinkClasses = "bg-primary/15 text-primary shadow-sm";
  const inactiveLinkClasses = "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground";


  return (
    <>
      {/* Mobile Sidebar (Sheet-like, controlled by isSidebarOpen) */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 ease-in-out md:hidden",
          isSidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsSidebarOpen(false)}
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-full w-64 transform flex-col border-r border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar-background))] shadow-xl transition-transform duration-300 ease-in-out md:static md:z-auto md:w-60 md:translate-x-0 md:shadow-none md:border-r md:border-[hsl(var(--sidebar-border))]",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-center border-b border-[hsl(var(--sidebar-border))] px-4 shadow-sm">
          <Logo iconSize={24}/>
        </div>
        <ScrollArea className="flex-1 py-4">
          <nav className="space-y-1 px-3">
            {filteredNavItems.map((item) => {
               const isActive = item.exactMatch ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={cn(
                    commonLinkClasses,
                    isActive ? activeLinkClasses : inactiveLinkClasses
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <item.icon className={cn("mr-3 h-5 w-5 flex-shrink-0", isActive ? "text-primary" : "text-sidebar-foreground/70 group-hover:text-sidebar-accent-foreground")} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </ScrollArea>
        <div className="mt-auto border-t border-[hsl(var(--sidebar-border))] p-3">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className={cn(commonLinkClasses, inactiveLinkClasses, "w-full justify-start")}
          >
            <LogOut className="mr-3 h-5 w-5 text-sidebar-foreground/70 group-hover:text-sidebar-accent-foreground" />
            Logout
          </Button>
        </div>
      </aside>
    </>
  );
}
