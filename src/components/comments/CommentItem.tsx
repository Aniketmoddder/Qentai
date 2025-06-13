
// src/components/comments/CommentItem.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type { Comment } from '@/types/comment';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ThumbsUp, ThumbsDown, MessageSquare, Flag, MoreHorizontal, Edit3, Trash2, UserCircle, Send, AlertCircle } from 'lucide-react';
import { formatDistanceToNowStrict, parseISO } from 'date-fns';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import CommentInput from './CommentInput'; // For replies
import { Textarea } from '../ui/textarea';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger, // Added missing import
} from "@/components/ui/alert-dialog";

interface CommentItemProps {
  comment: Comment;
  animeId: string;
  onReplyPosted: (reply: Comment, parentId: string) => void;
  onCommentUpdated: (updatedComment: Comment) => void;
  onCommentDeleted: (commentId: string, parentId?: string | null) => void;
  isReply?: boolean; // Indicates if this comment is a reply itself
}

export default function CommentItem({ 
    comment: initialComment, 
    animeId, 
    onReplyPosted, 
    onCommentUpdated,
    onCommentDeleted,
    isReply = false 
}: CommentItemProps) {
  const { user, appUser } = useAuth();
  const { toast } = useToast();
  
  const [comment, setComment] = useState<Comment>(initialComment);
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(initialComment.text);
  const [isInteracting, setIsInteracting] = useState<'like' | 'dislike' | 'edit' | 'delete' | null>(null);

  const [localLikes, setLocalLikes] = useState(initialComment.likes || 0);
  const [localDislikes, setLocalDislikes] = useState(initialComment.dislikes || 0);
  const [likedByCurrentUser, setLikedByCurrentUser] = useState(user ? initialComment.likedBy.includes(user.uid) : false);
  const [dislikedByCurrentUser, setDislikedByCurrentUser] = useState(user ? initialComment.dislikedBy.includes(user.uid) : false);
  
  useEffect(() => {
    setComment(initialComment);
    setLocalLikes(initialComment.likes || 0);
    setLocalDislikes(initialComment.dislikes || 0);
    setLikedByCurrentUser(user ? initialComment.likedBy.includes(user.uid) : false);
    setDislikedByCurrentUser(user ? initialComment.dislikedBy.includes(user.uid) : false);
    setEditText(initialComment.text);
  }, [initialComment, user]);

  const handleLike = async () => {
    if (!user) { toast({ variant: 'destructive', title: 'Login Required' }); return; }
    setIsInteracting('like');

    const originalLikes = localLikes;
    const originalDislikes = localDislikes;
    const originalLikedStatus = likedByCurrentUser;
    const originalDislikedStatus = dislikedByCurrentUser;

    if (likedByCurrentUser) {
      setLocalLikes(prev => prev - 1);
      setLikedByCurrentUser(false);
    } else {
      setLocalLikes(prev => prev + 1);
      setLikedByCurrentUser(true);
      if (dislikedByCurrentUser) {
        setLocalDislikes(prev => prev - 1);
        setDislikedByCurrentUser(false);
      }
    }

    try {
      const { toggleLikeComment, getDoc: getCommentDoc, doc: commentDoc, db: firestoreDb } = await import('@/services/commentService');
      await toggleLikeComment(comment.id, user.uid);
      
      const freshCommentSnap = await getCommentDoc(commentDoc(firestoreDb, 'comments', comment.id));
      if(freshCommentSnap.exists()){
        const freshData = freshCommentSnap.data() as Comment;
        // Ensure local state matches final DB state for all relevant fields
        setLocalLikes(freshData.likes);
        setLikedByCurrentUser(freshData.likedBy.includes(user.uid));
        setLocalDislikes(freshData.dislikes);
        setDislikedByCurrentUser(freshData.dislikedBy.includes(user.uid));
        // Create an updated comment object that reflects the new state
        const updatedCommentWithAllChanges = { ...comment, ...freshData };
        setComment(updatedCommentWithAllChanges);
        onCommentUpdated(updatedCommentWithAllChanges);
      }

    } catch (e) { 
      toast({ variant: 'destructive', title: 'Error Liking Comment' });
      setLocalLikes(originalLikes);
      setLikedByCurrentUser(originalLikedStatus);
      setLocalDislikes(originalDislikes);
      setDislikedByCurrentUser(originalDislikedStatus);
    }
    finally { setIsInteracting(null); }
  };

  const handleDislike = async () => {
    if (!user) { toast({ variant: 'destructive', title: 'Login Required' }); return; }
    setIsInteracting('dislike');

    const originalLikes = localLikes;
    const originalDislikes = localDislikes;
    const originalLikedStatus = likedByCurrentUser;
    const originalDislikedStatus = dislikedByCurrentUser;

    if (dislikedByCurrentUser) {
      setLocalDislikes(prev => prev - 1);
      setDislikedByCurrentUser(false);
    } else {
      setLocalDislikes(prev => prev + 1);
      setDislikedByCurrentUser(true);
      if (likedByCurrentUser) {
        setLocalLikes(prev => prev - 1);
        setLikedByCurrentUser(false);
      }
    }
    
    try {
      const { toggleDislikeComment, getDoc: getCommentDoc, doc: commentDoc, db: firestoreDb } = await import('@/services/commentService');
      await toggleDislikeComment(comment.id, user.uid);

      const freshCommentSnap = await getCommentDoc(commentDoc(firestoreDb, 'comments', comment.id));
       if(freshCommentSnap.exists()){
        const freshData = freshCommentSnap.data() as Comment;
        setLocalDislikes(freshData.dislikes);
        setDislikedByCurrentUser(freshData.dislikedBy.includes(user.uid));
        setLocalLikes(freshData.likes);
        setLikedByCurrentUser(freshData.likedBy.includes(user.uid));
        const updatedCommentWithAllChanges = { ...comment, ...freshData };
        setComment(updatedCommentWithAllChanges);
        onCommentUpdated(updatedCommentWithAllChanges);
      }
    } catch (e) { 
      toast({ variant: 'destructive', title: 'Error Disliking Comment' });
      setLocalLikes(originalLikes);
      setLikedByCurrentUser(originalLikedStatus);
      setLocalDislikes(originalDislikes);
      setDislikedByCurrentUser(originalDislikedStatus);
    }
    finally { setIsInteracting(null); }
  };


  const handleEditSubmit = async () => {
    if (!user || !editText.trim()) return;
    setIsInteracting('edit');
    try {
      const { editComment: editCommentService } = await import('@/services/commentService');
      await editCommentService(comment.id, user.uid, editText.trim());
      const updatedCommentData = { ...comment, text: editText.trim(), isEdited: true, updatedAt: new Date().toISOString() };
      setComment(updatedCommentData);
      onCommentUpdated(updatedCommentData);
      setIsEditing(false);
      toast({ title: 'Comment Updated' });
    } catch (e) { toast({ variant: 'destructive', title: 'Error Editing Comment' }); }
    finally { setIsInteracting(null); }
  };
  
  const handleDelete = async () => {
    if (!user) return;
    setIsInteracting('delete');
    try {
        const { deleteComment: deleteCommentService } = await import('@/services/commentService');
        await deleteCommentService(comment.id, user.uid);
        onCommentDeleted(comment.id, comment.parentId);
        toast({ title: 'Comment Deleted' });
    } catch (e) {
        toast({ variant: 'destructive', title: 'Error Deleting Comment', description: (e as Error).message });
    } finally {
        setIsInteracting(null);
    }
  };
  

  const timeAgo = comment.createdAt ? formatDistanceToNowStrict(parseISO(comment.createdAt as string), { addSuffix: true }) : 'some time ago';
  const isOwner = user && user.uid === comment.userId;

  const getAvatarFallback = () => {
    if (comment.userDisplayName) return comment.userDisplayName.charAt(0).toUpperCase();
    return <UserCircle size={isReply ? 16: 18}/>;
  };

  if (comment.isDeleted) {
    return (
      <div className={cn("flex items-center gap-2 p-2 rounded-md", isReply ? "ml-8 pl-2" : "bg-card/30")}>
        <AlertCircle size={16} className="text-muted-foreground flex-shrink-0"/>
        <p className="text-xs text-muted-foreground italic">{comment.text}</p>
      </div>
    )
  }

  return (
    <div className={cn("flex items-start gap-2.5 sm:gap-3", isReply ? "py-2" : "p-3 bg-card/50 rounded-lg shadow-sm")}>
      <Avatar className={cn("flex-shrink-0 border border-border/20", isReply ? "h-8 w-8" : "h-10 w-10")}>
        <AvatarImage src={comment.userPhotoURL || undefined} alt={comment.userDisplayName || 'User'} />
        <AvatarFallback>{getAvatarFallback()}</AvatarFallback>
      </Avatar>
      <div className="flex-grow">
        <div className="flex items-baseline gap-2 mb-0.5">
          <span className="text-xs sm:text-sm font-semibold text-foreground hover:underline cursor-pointer">
            {comment.userDisplayName || comment.userUsername || 'Anonymous User'}
          </span>
          <span className="text-xs text-muted-foreground">{timeAgo} {comment.isEdited && '(edited)'}</span>
        </div>
        
        {isEditing ? (
          <div className="space-y-2 my-1">
            <Textarea 
              value={editText} 
              onChange={(e) => setEditText(e.target.value)} 
              className="text-sm bg-input border-border/70 focus:border-primary min-h-[60px]"
              rows={2}
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="xs" onClick={() => { setIsEditing(false); setEditText(comment.text);}} disabled={isInteracting === 'edit'}>Cancel</Button>
              <Button size="xs" onClick={handleEditSubmit} disabled={isInteracting === 'edit' || !editText.trim()} className="btn-primary-gradient">
                {isInteracting === 'edit' ? <Loader2 className="h-3 w-3 animate-spin"/> : 'Save'}
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-foreground/90 whitespace-pre-line break-words">{comment.text}</p>
        )}

        {!isEditing && (
            <div className="flex items-center gap-1 sm:gap-2 text-muted-foreground mt-1.5">
            <Button variant="ghost" size="xs" onClick={handleLike} disabled={!user || isInteracting === 'like' || isInteracting === 'dislike'} className={cn("group hover:text-primary", likedByCurrentUser && "text-primary")}>
                {isInteracting === 'like' ? <Loader2 className="h-3.5 w-3.5 animate-spin"/> : <ThumbsUp size={14} className={cn("group-hover:fill-primary/20", likedByCurrentUser && "fill-primary text-primary")}/>}
                <span className="ml-1 text-xs tabular-nums">{localLikes}</span>
            </Button>
            <Button variant="ghost" size="xs" onClick={handleDislike} disabled={!user || isInteracting === 'like' || isInteracting === 'dislike'} className={cn("group hover:text-destructive", dislikedByCurrentUser && "text-destructive")}>
                {isInteracting === 'dislike' ? <Loader2 className="h-3.5 w-3.5 animate-spin"/> : <ThumbsDown size={14} className={cn("group-hover:fill-destructive/20", dislikedByCurrentUser && "fill-destructive text-destructive")}/>}
                 <span className="ml-1 text-xs tabular-nums">{localDislikes}</span>
            </Button>
            {!isReply && ( 
                <Button variant="ghost" size="xs" onClick={() => setIsReplying(!isReplying)} disabled={!user} className="hover:text-foreground">
                    <MessageSquare size={14} />
                    <span className="ml-1 text-xs">Reply {comment.replyCount && comment.replyCount > 0 ? `(${comment.replyCount})` : ''}</span>
                </Button>
            )}
            
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground ml-auto">
                    <MoreHorizontal size={16} /> <span className="sr-only">More options</span>
                </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40 bg-popover border-border shadow-xl">
                {isOwner && (
                    <>
                    <DropdownMenuItem onClick={() => { setIsEditing(true); setEditText(comment.text); }} className="text-xs gap-2 cursor-pointer">
                        <Edit3 size={14}/> Edit
                    </DropdownMenuItem>
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                           <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-xs text-destructive focus:text-destructive focus:bg-destructive/10 gap-2 cursor-pointer">
                                <Trash2 size={14}/> Delete
                            </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Delete Comment?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90" disabled={isInteracting === 'delete'}>
                                    {isInteracting === 'delete' ? <Loader2 className="animate-spin mr-1"/> : null} Delete
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                    <DropdownMenuSeparator />
                    </>
                )}
                <DropdownMenuItem onClick={() => toast({ title: 'Report Submitted (Demo)', description: 'Thank you for your feedback (this is a demo).' })} className="text-xs gap-2 cursor-pointer">
                    <Flag size={14}/> Report
                </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            </div>
        )}
        
        {isReplying && !isReply && (
          <div className="mt-2 pt-2 border-t border-border/20">
            <CommentInput
              animeId={animeId}
              episodeId={comment.episodeId}
              parentId={comment.id}
              onCommentPosted={(newReply) => {
                onReplyPosted(newReply, comment.id);
                setIsReplying(false);
              }}
              placeholder="Write a reply..."
              buttonText="Reply"
              onCancelReply={() => setIsReplying(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
