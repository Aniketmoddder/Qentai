
// src/components/comments/CommentsSection.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import type { Comment } from '@/types/comment';
import { getCommentsForEpisode, getRepliesForComment } from '@/services/commentService';
import CommentInput from './CommentInput';
import CommentItem from './CommentItem';
import { Loader2, MessageCircle, RefreshCcw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface CommentsSectionProps {
  animeId: string;
  episodeId: string;
}

export default function CommentsSection({ animeId, episodeId }: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [repliesMap, setRepliesMap] = useState<Record<string, Comment[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visibleReplies, setVisibleReplies] = useState<Record<string, boolean>>({});

  const fetchComments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedComments = await getCommentsForEpisode(animeId, episodeId);
      setComments(fetchedComments);
      setRepliesMap({}); 
      setVisibleReplies({});
    } catch (err) {
      console.error('Failed to fetch comments:', err);
      setError('Could not load comments. Please try refreshing.');
    } finally {
      setIsLoading(false);
    }
  }, [animeId, episodeId]);

  useEffect(() => {
    if (animeId && episodeId) {
      fetchComments();
    }
  }, [animeId, episodeId, fetchComments]);

  const handleCommentPosted = (newComment: Comment) => {
    if (newComment.parentId) { 
      setRepliesMap(prev => ({
        ...prev,
        [newComment.parentId!]: [newComment, ...(prev[newComment.parentId!] || [])] // Add new reply to the beginning
      }));
      setComments(prevComments => prevComments.map(c => 
        c.id === newComment.parentId ? { ...c, replyCount: (c.replyCount || 0) + 1 } : c
      ));
    } else { 
      setComments(prev => [newComment, ...prev]); // Add new top-level comment to the beginning
    }
  };
  
  const handleCommentUpdated = (updatedComment: Comment) => {
    if (updatedComment.parentId) {
      setRepliesMap(prev => ({
        ...prev,
        [updatedComment.parentId!]: (prev[updatedComment.parentId!] || []).map(r => r.id === updatedComment.id ? updatedComment : r)
      }));
    } else {
      setComments(prev => prev.map(c => c.id === updatedComment.id ? updatedComment : c));
    }
  };

  const handleCommentDeleted = (commentId: string, parentId?: string | null) => {
     if (parentId) {
        setRepliesMap(prev => {
            const parentReplies = (prev[parentId] || []).filter(r => r.id !== commentId);
            // If a comment was soft-deleted (isDeleted = true), it might still be in the list
            // The item component handles rendering for isDeleted. Here we just remove if it was a hard delete.
            // Or, if we want to remove soft-deleted from view immediately:
            // const parentReplies = (prev[parentId] || []).filter(r => r.id !== commentId || (r.id === commentId && !r.isDeleted));
            return { ...prev, [parentId]: parentReplies };
        });
        setComments(prevComments => prevComments.map(c => 
            c.id === parentId ? { ...c, replyCount: Math.max(0, (c.replyCount || 0) - 1) } : c
        ));
     } else {
        // For top-level comments, if soft-deleted, it will be handled by CommentItem's rendering.
        // If it's a hard delete, filter it out.
        // For now, we assume onCommentDeleted is called when the comment should be visually removed or marked.
        // If it's marked (soft delete), handleCommentUpdated should have been called with the new state.
        // If it's a hard delete, filter it.
        setComments(prev => prev.filter(c => c.id !== commentId));
     }
  };

  const toggleRepliesVisibility = async (commentId: string) => {
    if (visibleReplies[commentId]) {
      setVisibleReplies(prev => ({ ...prev, [commentId]: false }));
    } else {
      setVisibleReplies(prev => ({ ...prev, [commentId]: true }));
      // Fetch replies only if they haven't been fetched yet or if the reply list is empty (could be 0 replies originally)
      if (!repliesMap[commentId] || repliesMap[commentId].length === 0) {
        const currentComment = comments.find(c => c.id === commentId) || Object.values(repliesMap).flat().find(r => r.id === commentId);
        if (currentComment && (currentComment.replyCount || 0) > 0 && (!repliesMap[commentId] || repliesMap[commentId].length === 0)) {
            try {
            const fetchedReplies = await getRepliesForComment(commentId);
            setRepliesMap(prev => ({ ...prev, [commentId]: fetchedReplies }));
            } catch (err) {
            console.error(`Failed to fetch replies for comment ${commentId}:`, err);
            // setError(`Could not load replies for comment ${commentId}.`); // Avoid global error for this
            }
        } else if (currentComment && (currentComment.replyCount === 0 || currentComment.replyCount === undefined) && !repliesMap[commentId]) {
            // If replyCount is 0 or undefined, and we haven't tried fetching, set to empty array
            setRepliesMap(prev => ({ ...prev, [commentId]: [] }));
        }
      }
    }
  };

  return (
    <Card className="shadow-lg border-border/40 mt-6">
      <CardHeader className="p-4 sm:p-5 pb-3">
        <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-primary flex items-center">
                <MessageCircle className="w-5 h-5 mr-2"/> Comments ({comments.filter(c => !c.isDeleted).length})
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={fetchComments} disabled={isLoading} className="text-xs">
                {isLoading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin"/> : <RefreshCcw className="mr-1.5 h-3.5 w-3.5"/>}
                Refresh
            </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-5 pt-0">
        <CommentInput animeId={animeId} episodeId={episodeId} onCommentPosted={handleCommentPosted} />
        <Separator className="my-4 bg-border/40" />
        
        {isLoading && <div className="flex justify-center py-6"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}
        
        {error && !isLoading && (
            <div className="text-center py-6 text-destructive bg-destructive/5 p-4 rounded-md">
                <AlertCircle className="mx-auto h-8 w-8 mb-2" />
                <p className="text-sm font-medium">{error}</p>
            </div>
        )}

        {!isLoading && !error && comments.length === 0 && (
          <p className="text-center py-6 text-muted-foreground text-sm">
            No comments yet. Be the first to share your thoughts!
          </p>
        )}

        {!isLoading && !error && comments.length > 0 && (
          <div className="space-y-4">
            {comments.map(comment => ( 
              <div key={comment.id}>
                <CommentItem 
                    comment={comment} 
                    animeId={animeId} 
                    onReplyPosted={handleCommentPosted} // Note: using handleCommentPosted for replies too
                    onCommentUpdated={handleCommentUpdated}
                    onCommentDeleted={handleCommentDeleted}
                />
                {(comment.replyCount || 0) > 0 && (
                  <Button 
                    variant="link" 
                    size="xs" 
                    onClick={() => toggleRepliesVisibility(comment.id)}
                    className="ml-12 mt-1 text-xs text-primary hover:text-primary/80 px-1"
                  >
                    {visibleReplies[comment.id] ? 'Hide' : `View ${comment.replyCount} ${comment.replyCount === 1 ? 'reply' : 'replies'}`}
                  </Button>
                )}
                {visibleReplies[comment.id] && (
                  <div className="ml-8 mt-2 space-y-2 border-l-2 border-border/30 pl-3">
                    {(!repliesMap[comment.id] || repliesMap[comment.id].length === 0 && (comment.replyCount || 0) > 0) && 
                        <p className="text-xs text-muted-foreground italic py-1 flex items-center"><Loader2 className="h-3 w-3 animate-spin mr-1"/>Loading replies...</p>}
                    {(repliesMap[comment.id] || []).map(reply => ( 
                      <CommentItem 
                        key={reply.id} 
                        comment={reply} 
                        animeId={animeId}
                        onReplyPosted={handleCommentPosted}
                        onCommentUpdated={handleCommentUpdated}
                        onCommentDeleted={handleCommentDeleted}
                        isReply={true}
                      />
                    ))}
                  </div>
                )}
                 <Separator className="my-3 bg-border/20 last:hidden" />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
