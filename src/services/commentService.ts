
// src/services/commentService.ts
'use server';

import { db } from '@/lib/firebase';
import type { Comment } from '@/types/comment';
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  increment,
  arrayUnion,
  arrayRemove,
  writeBatch,
  runTransaction,
} from 'firebase/firestore';
import { revalidatePath } from 'next/cache';

const commentsCollection = collection(db, 'comments');

// Helper to convert Firestore Timestamps to ISO strings for client components
export const convertCommentTimestampsForClient = (commentData: any): Comment => {
  const data = { ...commentData };
  if (data.createdAt instanceof Timestamp) {
    data.createdAt = data.createdAt.toDate().toISOString();
  }
  if (data.updatedAt instanceof Timestamp) {
    data.updatedAt = data.updatedAt.toDate().toISOString();
  }
  return data as Comment;
};

export async function addComment(
  commentData: Omit<Comment, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'dislikes' | 'likedBy' | 'dislikedBy' | 'replyCount' | 'isEdited' | 'isDeleted'>
): Promise<Comment> {
  try {
    const docRef = await addDoc(commentsCollection, {
      ...commentData,
      likes: 0,
      dislikes: 0,
      likedBy: [],
      dislikedBy: [],
      replyCount: 0,
      isEdited: false,
      isDeleted: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    const newCommentSnap = await getDoc(docRef);
    if (!newCommentSnap.exists()) {
      throw new Error("Failed to create and retrieve comment.");
    }
    
    const newComment = convertCommentTimestampsForClient({ id: newCommentSnap.id, ...newCommentSnap.data() } as Comment);
    
    // Revalidate the player page path
    revalidatePath(`/play/${commentData.animeId}`);
    if (commentData.parentId) {
        // If it's a reply, update the parent's replyCount
        const parentRef = doc(db, 'comments', commentData.parentId);
        await updateDoc(parentRef, {
            replyCount: increment(1),
            updatedAt: serverTimestamp()
        });
    }

    return newComment;
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error; // Re-throw to be handled by the caller
  }
}

export async function getCommentsForEpisode(animeId: string, episodeId: string): Promise<Comment[]> {
  try {
    const q = query(
      commentsCollection,
      where('animeId', '==', animeId),
      where('episodeId', '==', episodeId),
      where('parentId', '==', null), // Only fetch top-level comments
      orderBy('createdAt', 'desc') // Or 'asc' depending on desired order
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(docSnap =>
      convertCommentTimestampsForClient({ id: docSnap.id, ...docSnap.data() } as Comment)
    ).filter(comment => !comment.isDeleted);
  } catch (error) {
    console.error('Error fetching comments for episode:', error);
    throw error;
  }
}

export async function getRepliesForComment(commentId: string): Promise<Comment[]> {
  try {
    const q = query(
      commentsCollection,
      where('parentId', '==', commentId),
      orderBy('createdAt', 'asc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(docSnap =>
      convertCommentTimestampsForClient({ id: docSnap.id, ...docSnap.data() } as Comment)
    ).filter(comment => !comment.isDeleted);
  } catch (error) {
    console.error('Error fetching replies for comment:', error);
    throw error;
  }
}


export async function toggleLikeComment(commentId: string, userId: string): Promise<{ likes: number; likedByCurrentUser: boolean }> {
  const commentRef = doc(db, 'comments', commentId);
  try {
    let newLikedByCurrentUser = false;
    const finalLikesCount = await runTransaction(db, async (transaction) => {
      const commentSnap = await transaction.get(commentRef);
      if (!commentSnap.exists()) {
        throw new Error("Comment not found");
      }
      const commentData = commentSnap.data() as Comment;
      const likedBy = commentData.likedBy || [];
      const dislikedBy = commentData.dislikedBy || [];
      let likes = commentData.likes || 0;

      if (likedBy.includes(userId)) {
        // User already liked, so unlike
        transaction.update(commentRef, {
          likes: increment(-1),
          likedBy: arrayRemove(userId),
          updatedAt: serverTimestamp()
        });
        likes--;
        newLikedByCurrentUser = false;
      } else {
        // User has not liked, so like
        transaction.update(commentRef, {
          likes: increment(1),
          likedBy: arrayUnion(userId),
          updatedAt: serverTimestamp()
        });
        likes++;
        newLikedByCurrentUser = true;
        // If user had previously disliked, remove dislike
        if (dislikedBy.includes(userId)) {
          transaction.update(commentRef, {
            dislikes: increment(-1),
            dislikedBy: arrayRemove(userId)
          });
        }
      }
      return likes;
    });
    revalidatePath(`/play/.*`, 'layout'); // Revalidate player pages
    return { likes: finalLikesCount, likedByCurrentUser: newLikedByCurrentUser };
  } catch (error) {
    console.error("Error toggling like:", error);
    throw error;
  }
}

export async function toggleDislikeComment(commentId: string, userId: string): Promise<{ dislikes: number; dislikedByCurrentUser: boolean }> {
  const commentRef = doc(db, 'comments', commentId);
  try {
    let newDislikedByCurrentUser = false;
    const finalDislikesCount = await runTransaction(db, async (transaction) => {
      const commentSnap = await transaction.get(commentRef);
      if (!commentSnap.exists()) {
        throw new Error("Comment not found");
      }
      const commentData = commentSnap.data() as Comment;
      const likedBy = commentData.likedBy || [];
      const dislikedBy = commentData.dislikedBy || [];
      let dislikes = commentData.dislikes || 0;

      if (dislikedBy.includes(userId)) {
        // User already disliked, so un-dislike
        transaction.update(commentRef, {
          dislikes: increment(-1),
          dislikedBy: arrayRemove(userId),
          updatedAt: serverTimestamp()
        });
        dislikes--;
        newDislikedByCurrentUser = false;
      } else {
        // User has not disliked, so dislike
        transaction.update(commentRef, {
          dislikes: increment(1),
          dislikedBy: arrayUnion(userId),
          updatedAt: serverTimestamp()
        });
        dislikes++;
        newDislikedByCurrentUser = true;
        // If user had previously liked, remove like
        if (likedBy.includes(userId)) {
          transaction.update(commentRef, {
            likes: increment(-1),
            likedBy: arrayRemove(userId)
          });
        }
      }
      return dislikes;
    });
    revalidatePath(`/play/.*`, 'layout');
    return { dislikes: finalDislikesCount, dislikedByCurrentUser: newDislikedByCurrentUser };
  } catch (error) {
    console.error("Error toggling dislike:", error);
    throw error;
  }
}

export async function editComment(commentId: string, userId: string, newText: string): Promise<void> {
    const commentRef = doc(db, 'comments', commentId);
    try {
        const commentSnap = await getDoc(commentRef);
        if (!commentSnap.exists() || commentSnap.data().userId !== userId) {
            throw new Error("Comment not found or user not authorized to edit.");
        }
        await updateDoc(commentRef, {
            text: newText,
            isEdited: true,
            updatedAt: serverTimestamp()
        });
        revalidatePath(`/play/.*`, 'layout');
    } catch (error) {
        console.error('Error editing comment:', error);
        throw error;
    }
}

export async function deleteComment(commentId: string, userId: string): Promise<void> {
    const commentRef = doc(db, 'comments', commentId);
    try {
        const commentSnap = await getDoc(commentRef);
        if (!commentSnap.exists()) {
            throw new Error("Comment not found.");
        }
        const commentData = commentSnap.data() as Comment;
        // Add role check here if admins/owners can delete any comment
        if (commentData.userId !== userId) {
            throw new Error("User not authorized to delete this comment.");
        }

        // If it's a parent comment with replies, consider soft-deleting
        // or a more complex deletion strategy (e.g., anonymize, mark as deleted).
        // For now, simple soft delete.
        if (commentData.replyCount && commentData.replyCount > 0) {
             await updateDoc(commentRef, {
                text: "[This comment has been deleted]",
                isDeleted: true,
                updatedAt: serverTimestamp(),
                // Optionally clear user info or keep it for context if needed
                // userDisplayName: "Deleted User", 
                // userPhotoURL: null,
             });
        } else {
             // If no replies, or if we decide to hard delete replies too eventually
            await deleteDoc(commentRef);
            // If it was a reply, decrement parent's replyCount
            if (commentData.parentId) {
                const parentRef = doc(db, 'comments', commentData.parentId);
                await updateDoc(parentRef, {
                    replyCount: increment(-1),
                    updatedAt: serverTimestamp()
                }).catch(err => console.error("Error updating parent reply count on delete:", err));
            }
        }
       revalidatePath(`/play/.*`, 'layout');
    } catch (error) {
        console.error('Error deleting comment:', error);
        throw error;
    }
}
