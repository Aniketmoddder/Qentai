
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
      setRepliesMap({}); // Reset replies when main comments are fetched
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
    if (newComment.parentId) { // It's a reply
      setRepliesMap(prev => ({
        ...prev,
        [newComment.parentId!]: [...(prev[newComment.parentId!] || []), newComment]
      }));
      // Also update reply count on parent comment
      setComments(prevComments => prevComments.map(c => 
        c.id === newComment.parentId ? { ...c, replyCount: (c.replyCount || 0) + 1 } : c
      ));
    } else { // It's a top-level comment
      setComments(prev => [newComment, ...prev]);
    }
  };

  const handleReplyPosted = (newReply: Comment, parentId: string) => {
     handleCommentPosted(newReply); // Uses the same logic
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
        setRepliesMap(prev => ({
            ...prev,
            [parentId]: (prev[parentId] || []).filter(r => r.id !== commentId)
        }));
        // Decrement reply count on parent
        setComments(prevComments => prevComments.map(c => 
            c.id === parentId ? { ...c, replyCount: Math.max(0, (c.replyCount || 0) - 1) } : c
        ));
     } else {
        setComments(prev => prev.filter(c => c.id !== commentId));
     }
  };


  const toggleRepliesVisibility = async (commentId: string) => {
    if (visibleReplies[commentId]) {
      setVisibleReplies(prev => ({ ...prev, [commentId]: false }));
    } else {
      setVisibleReplies(prev => ({ ...prev, [commentId]: true }));
      if (!repliesMap[commentId] || repliesMap[commentId].length === 0) {
        // Fetch replies if not already fetched or if they are empty (could be due to initial fetch)
        try {
          const fetchedReplies = await getRepliesForComment(commentId);
          setRepliesMap(prev => ({ ...prev, [commentId]: fetchedReplies }));
        } catch (err) {
          console.error(`Failed to fetch replies for comment ${commentId}:`, err);
          // Optionally show a toast or inline error for reply fetching
        }
      }
    }
  };

  return (
    <Card className="shadow-lg border-border/40 mt-6">
      <CardHeader className="p-4 sm:p-5 pb-3">
        <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-primary flex items-center">
                <MessageCircle className="w-5 h-5 mr-2"/> Comments ({comments.length})
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
                    onReplyPosted={handleReplyPosted}
                    onCommentUpdated={handleCommentUpdated}
                    onCommentDeleted={handleCommentDeleted}
                />
                {comment.replyCount && comment.replyCount > 0 && (
                  <Button 
                    variant="link" 
                    size="xs" 
                    onClick={() => toggleRepliesVisibility(comment.id)}
                    className="ml-12 mt-1 text-xs text-primary hover:text-primary/80 px-1"
                  >
                    {visibleReplies[comment.id] ? 'Hide' : `View ${comment.replyCount} ${comment.replyCount === 1 ? 'reply' : 'replies'}`}
                  </Button>
                )}
                {visibleReplies[comment.id] && repliesMap[comment.id] && (
                  <div className="ml-8 mt-2 space-y-2 border-l-2 border-border/30 pl-3">
                    {repliesMap[comment.id].length === 0 && <p className="text-xs text-muted-foreground italic py-1">Loading replies...</p>}
                    {repliesMap[comment.id].map(reply => (
                      <CommentItem 
                        key={reply.id} 
                        comment={reply} 
                        animeId={animeId}
                        onReplyPosted={handleReplyPosted} // Replies can't be replied to for now
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
