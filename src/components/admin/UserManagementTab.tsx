
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { getAllAppUsers, updateUserStatusInFirestore, updateUserRoleInFirestore } from '@/services/appUserService';
import type { AppUser, AppUserRole } from '@/types/appUser';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, UserCog, UserCheck, UserX, ShieldCheck, ShieldAlert, RefreshCw, Search as SearchIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/hooks/use-auth'; // Import useAuth

const ADMIN_EMAIL = 'ninjax.desi@gmail.com';


export default function UserManagementTab() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const { appUser: currentUserData } = useAuth(); // Get current admin/owner info

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedUsers = await getAllAppUsers();
      setUsers(fetchedUsers);
    } catch (err) {
      console.error('Failed to fetch users list:', err);
      const errorMessage = err instanceof Error ? err.message : 'Could not load users.';
      setError(`Failed to load users. ${errorMessage}`);
      toast({ variant: 'destructive', title: 'Fetch Error', description: `Could not load users list. ${errorMessage}` });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleBan = async (userToUpdate: AppUser) => {
    if (userToUpdate.email === ADMIN_EMAIL) {
        toast({variant: "destructive", title: "Action Denied", description: "The owner account cannot be banned."});
        return;
    }
    setUpdatingUserId(userToUpdate.uid);
    const newStatus = userToUpdate.status === 'banned' ? 'active' : 'banned';
    try {
      await updateUserStatusInFirestore(userToUpdate.uid, newStatus);
      setUsers(prevUsers =>
        prevUsers.map(u =>
          u.uid === userToUpdate.uid ? { ...u, status: newStatus } : u
        )
      );
      toast({
        title: `User Status Updated`,
        description: `${userToUpdate.email || userToUpdate.displayName || userToUpdate.uid} is now ${newStatus}.`,
      });
    } catch (err) {
      console.error('Failed to update user status:', err);
      const errorMessage = err instanceof Error ? err.message : 'Could not update user status.';
      toast({ variant: 'destructive', title: 'Update Error', description: errorMessage });
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleChangeRole = async (uid: string, newRole: AppUserRole) => {
    setUpdatingUserId(uid);
    const userToUpdate = users.find(u => u.uid === uid);
    if (!userToUpdate) return;

    if (userToUpdate.email === ADMIN_EMAIL && newRole !== 'owner') {
        toast({variant: "destructive", title: "Action Denied", description: "The owner's role cannot be changed from 'owner'."});
        setUpdatingUserId(null);
        return;
    }
    // Ensure currentUserData is loaded before using it
     if (currentUserData && currentUserData.role === 'owner' && currentUserData.email !== ADMIN_EMAIL && newRole === 'owner') { 
      toast({ variant: "destructive", title: "Action Denied", description: "Cannot assign 'owner' role to this account."});
      setUpdatingUserId(null);
      return;
    }


    try {
      await updateUserRoleInFirestore(uid, newRole);
      setUsers(prevUsers =>
        prevUsers.map(u =>
          u.uid === uid ? { ...u, role: newRole } : u
        )
      );
      toast({
        title: `User Role Updated`,
        description: `${userToUpdate.email || userToUpdate.displayName || uid}'s role changed to ${newRole}.`,
      });
    } catch (err) {
      console.error('Failed to update user role:', err);
      const errorMessage = err instanceof Error ? err.message : 'Could not update user role.';
      toast({ variant: 'destructive', title: 'Update Error', description: errorMessage });
    } finally {
      setUpdatingUserId(null);
    }
  };

  const getAvatarFallback = (user: AppUser) => {
    if (user.displayName) return user.displayName.charAt(0).toUpperCase();
    if (user.email) return user.email.charAt(0).toUpperCase();
    return 'U';
  };

  const filteredUsers = users.filter(user =>
    (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (user.displayName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    user.uid.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const availableRoles: AppUserRole[] = ['owner', 'admin', 'member'];


  return (
    <Card className="shadow-lg border-border/40">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-semibold text-primary flex items-center">
          <UserCog className="w-6 h-6 mr-2" /> User Management
        </CardTitle>
        <CardDescription>View, manage roles, and status of registered users. Ensure the 'users' collection in Firestore is populated upon user sign-up/login.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:max-w-md">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by email, name, UID, role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-input border-border/70 focus:border-primary h-10"
            />
          </div>
          <Button onClick={fetchUsers} className="w-full sm:w-auto" variant="outline" disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Users
          </Button>
        </div>

        {isLoading && <div className="flex justify-center py-10"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>}
        
        {error && !isLoading && (
          <div className="text-center py-10 text-destructive bg-destructive/5 p-6 rounded-lg">
            <AlertCircle className="mx-auto h-12 w-12 mb-3" />
            <p className="text-lg font-medium">{error}</p>
          </div>
        )}

        {!isLoading && !error && filteredUsers.length === 0 && (
          <p className="text-center py-10 text-muted-foreground text-lg">
            {searchTerm ? `No users found matching "${searchTerm}".` : 
            "No users found in the 'users' Firestore collection. Ensure user documents are created upon registration/login."}
          </p>
        )}

        {!isLoading && !error && filteredUsers.length > 0 && (
          <div className="space-y-4">
            {filteredUsers.map(user => (
              <Card key={user.uid} className="flex flex-col md:flex-row items-start md:items-center p-4 gap-4 bg-card/70 hover:bg-card/90 transition-colors duration-200 ease-in-out rounded-lg shadow-sm border border-border/30">
                <Avatar className="h-12 w-12 md:h-16 md:w-16 border-2 border-primary/30">
                  <AvatarImage src={user.photoURL || undefined} alt={user.displayName || user.email || 'User'} />
                  <AvatarFallback className="bg-muted text-muted-foreground text-xl">{getAvatarFallback(user)}</AvatarFallback>
                </Avatar>
                <div className="flex-grow">
                  <h4 className="font-semibold text-lg text-foreground">
                    {user.displayName || 'N/A'} 
                    <span className="text-sm text-muted-foreground ml-1">({user.email || 'No Email'})</span>
                  </h4>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    UID: {user.uid}
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                     <Badge variant={user.status === 'active' ? 'default' : 'destructive'} className={`capitalize text-xs ${user.status === 'active' ? 'bg-green-500/20 text-green-700' : 'bg-red-500/20 text-red-700'}`}>
                      {user.status === 'active' ? <UserCheck className="w-3 h-3 mr-1"/> : <UserX className="w-3 h-3 mr-1"/>}
                      {user.status}
                    </Badge>
                    <Badge variant="secondary" className="capitalize text-xs">
                       {user.role === 'owner' ? <ShieldCheck className="w-3 h-3 mr-1 text-amber-500"/> :
                        user.role === 'admin' ? <ShieldAlert className="w-3 h-3 mr-1 text-primary"/> : 
                        null}
                      {user.role}
                    </Badge>
                    {user.createdAt && typeof user.createdAt === 'string' && <Badge variant="outline" className="text-xs">Joined: {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}</Badge>}
                  </div>
                </div>
                <div className="flex-shrink-0 flex flex-col md:flex-row items-stretch md:items-center gap-2 mt-3 md:mt-0 w-full md:w-auto">
                  <Select 
                    value={user.role} 
                    onValueChange={(newRole) => handleChangeRole(user.uid, newRole as AppUserRole)}
                    disabled={updatingUserId === user.uid || (user.email === ADMIN_EMAIL && user.role === 'owner')} 
                  >
                    <SelectTrigger className="w-full md:w-[150px] h-9 text-xs bg-input border-border/60 focus:border-primary">
                      <SelectValue placeholder="Change role" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableRoles.map(roleOption => (
                        <SelectItem 
                          key={roleOption} 
                          value={roleOption} 
                          className="text-xs capitalize"
                          disabled={(user.email === ADMIN_EMAIL && roleOption !== 'owner') || (roleOption === 'owner' && user.email !== ADMIN_EMAIL) } // Owner must remain owner, only primary admin can be owner
                        >
                          {roleOption}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant={user.status === 'banned' ? 'outline' : 'destructive'} 
                        size="sm" 
                        className="w-full md:w-auto text-xs h-9"
                        disabled={updatingUserId === user.uid || user.email === ADMIN_EMAIL}
                       >
                        {updatingUserId === user.uid && user.status === 'active' ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin"/> : user.status === 'banned' ? <UserCheck className="mr-1.5 h-3.5 w-3.5"/> : <UserX className="mr-1.5 h-3.5 w-3.5"/>}
                        {user.status === 'banned' ? 'Unban' : 'Ban User'}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirm {user.status === 'banned' ? 'Unban' : 'Ban'}</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to {user.status === 'banned' ? 'unban' : 'ban'} {user.email || user.displayName || user.uid}? 
                          {user.status !== 'banned' && " This will change their status and may restrict their access."}
                          {user.status === 'banned' && " This will restore their access."}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleToggleBan(user)}
                          className={user.status === 'banned' ? "bg-green-600 hover:bg-green-700" : "bg-destructive hover:bg-destructive/90"}
                        >
                          Confirm {user.status === 'banned' ? 'Unban' : 'Ban'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

