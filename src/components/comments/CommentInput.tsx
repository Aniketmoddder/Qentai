
// src/components/comments/CommentInput.tsx
'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Send, Loader2, UserCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CommentInputProps {
  animeId: string;
  episodeId: string;
  parentId?: string | null; // For replies
  onCommentPosted: (newComment: any) => void; // Adjust 'any' to Comment type later
  placeholder?: string;
  buttonText?: string;
  onCancelReply?: () => void; // If it's a reply input
}

export default function CommentInput({
  animeId,
  episodeId,
  parentId = null,
  onCommentPosted,
  placeholder = "Add a public comment...",
  buttonText = "Comment",
  onCancelReply
}: CommentInputProps) {
  const { user, appUser } = useAuth();
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !appUser) {
      toast({ variant: 'destructive', title: 'Not Logged In', description: 'Please log in to post a comment.' });
      return;
    }
    if (!commentText.trim()) {
      toast({ variant: 'destructive', title: 'Empty Comment', description: 'Comment cannot be empty.' });
      return;
    }

    setIsSubmitting(true);
    try {
      // Dynamically import addComment only when needed (client-side)
      const { addComment } = await import('@/services/commentService');
      const newComment = await addComment({
        animeId,
        episodeId,
        userId: user.uid,
        userDisplayName: appUser.displayName || appUser.username || 'Anonymous',
        userUsername: appUser.username || null,
        userPhotoURL: appUser.photoURL,
        text: commentText.trim(),
        parentId,
      });
      onCommentPosted(newComment);
      setCommentText('');
      if (parentId && onCancelReply) onCancelReply(); // Close reply box if it was a reply
      toast({ title: parentId ? 'Reply Posted' : 'Comment Posted', description: 'Your thoughts have been shared!' });
    } catch (error) {
      console.error('Failed to post comment:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to post comment. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const getAvatarFallback = () => {
    if (appUser?.fullName) return appUser.fullName.charAt(0).toUpperCase();
    if (appUser?.displayName) return appUser.displayName.charAt(0).toUpperCase();
    if (appUser?.email) return appUser.email.charAt(0).toUpperCase();
    return <UserCircle size={18}/>;
  };


  return (
    <form onSubmit={handleCommentSubmit} className="flex items-start gap-3 p-3 border border-border/30 bg-card/50 rounded-lg shadow-sm">
      {user && appUser ? (
        <Avatar className="h-10 w-10 flex-shrink-0 border border-border/20">
          <AvatarImage src={appUser.photoURL || undefined} alt={appUser.displayName || 'User'} />
          <AvatarFallback>{getAvatarFallback()}</AvatarFallback>
        </Avatar>
      ) : (
        <Avatar className="h-10 w-10 flex-shrink-0 border border-border/20">
             <AvatarFallback><UserCircle size={20} className="text-muted-foreground"/></AvatarFallback>
        </Avatar>
      )}
      <div className="flex-grow space-y-2">
        <Textarea
          placeholder={user ? placeholder : "Please log in to comment..."}
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          className="text-sm bg-input border-border/70 focus:border-primary min-h-[40px] resize-none"
          rows={parentId ? 2 : 1}
          disabled={!user || isSubmitting}
        />
        <div className="flex justify-end items-center gap-2">
          {parentId && onCancelReply && (
            <Button type="button" variant="ghost" size="sm" onClick={onCancelReply} disabled={isSubmitting} className="text-xs">
              Cancel
            </Button>
          )}
          <Button type="submit" size="sm" disabled={!user || isSubmitting || !commentText.trim()} className="btn-primary-gradient text-xs">
            {isSubmitting ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Send className="mr-1.5 h-3.5 w-3.5" />}
            {buttonText}
          </Button>
        </div>
      </div>
    </form>
  );
}
