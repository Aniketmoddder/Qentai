
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
  Timestamp, 
} from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import { convertCommentTimestampsForClient } from '@/lib/commentUtils';

const commentsCollection = collection(db, 'comments');

export async function addComment(
  commentData: Omit<Comment, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'dislikes' | 'likedBy' | 'dislikedBy' | 'replyCount' | 'isEdited' | 'isDeleted'>
): Promise<Comment> {
  try {
    const dataToSave = {
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
    };
    const docRef = await addDoc(commentsCollection, dataToSave);

    // Re-fetch the document to get server-generated timestamps and ID
    const newCommentSnap = await getDoc(docRef);
    if (!newCommentSnap.exists()) {
      throw new Error("Failed to create and retrieve comment.");
    }
    
    const newComment = convertCommentTimestampsForClient({ id: newCommentSnap.id, ...newCommentSnap.data() } as Comment);
    
    revalidatePath(`/play/${commentData.animeId}`, 'layout'); // Revalidate player pages more broadly
    
    if (commentData.parentId) {
        const parentRef = doc(db, 'comments', commentData.parentId);
        await updateDoc(parentRef, {
            replyCount: increment(1),
            updatedAt: serverTimestamp()
        });
    }

    return newComment;
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error; 
  }
}

export async function getCommentsForEpisode(animeId: string, episodeId: string): Promise<Comment[]> {
  try {
    const q = query(
      commentsCollection,
      where('animeId', '==', animeId),
      where('episodeId', '==', episodeId),
      where('parentId', '==', null), 
      orderBy('createdAt', 'desc') 
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


export async function toggleLikeComment(commentId: string, userId: string): Promise<Pick<Comment, 'likes' | 'dislikes' | 'likedBy' | 'dislikedBy'>> {
  const commentRef = doc(db, 'comments', commentId);
  try {
    const updatedInteractionState = await runTransaction(db, async (transaction) => {
      const commentSnap = await transaction.get(commentRef);
      if (!commentSnap.exists()) {
        throw new Error("Comment not found");
      }
      const commentData = commentSnap.data() as Comment;
      
      let likedBy = [...(commentData.likedBy || [])];
      let dislikedBy = [...(commentData.dislikedBy || [])];
      let likes = commentData.likes || 0;
      let dislikes = commentData.dislikes || 0;

      const updatePayload: any = { updatedAt: serverTimestamp() };

      if (likedBy.includes(userId)) { // User wants to unlike
        updatePayload.likes = increment(-1);
        updatePayload.likedBy = arrayRemove(userId);
        likes--;
        likedBy = likedBy.filter(id => id !== userId);
      } else { // User wants to like
        updatePayload.likes = increment(1);
        updatePayload.likedBy = arrayUnion(userId);
        likes++;
        likedBy.push(userId);
        if (dislikedBy.includes(userId)) { // If previously disliked, remove dislike
          updatePayload.dislikes = increment(-1);
          updatePayload.dislikedBy = arrayRemove(userId);
          dislikes--;
          dislikedBy = dislikedBy.filter(id => id !== userId);
        }
      }
      transaction.update(commentRef, updatePayload);
      return { likes, dislikes, likedBy, dislikedBy };
    });
    revalidatePath(`/play/.*`, 'layout'); 
    return updatedInteractionState;
  } catch (error) {
    console.error("Error toggling like:", error);
    throw error;
  }
}

export async function toggleDislikeComment(commentId: string, userId: string): Promise<Pick<Comment, 'likes' | 'dislikes' | 'likedBy' | 'dislikedBy'>> {
  const commentRef = doc(db, 'comments', commentId);
  try {
    const updatedInteractionState = await runTransaction(db, async (transaction) => {
      const commentSnap = await transaction.get(commentRef);
      if (!commentSnap.exists()) {
        throw new Error("Comment not found");
      }
      const commentData = commentSnap.data() as Comment;

      let likedBy = [...(commentData.likedBy || [])];
      let dislikedBy = [...(commentData.dislikedBy || [])];
      let likes = commentData.likes || 0;
      let dislikes = commentData.dislikes || 0;
      
      const updatePayload: any = { updatedAt: serverTimestamp() };

      if (dislikedBy.includes(userId)) { // User wants to un-dislike
        updatePayload.dislikes = increment(-1);
        updatePayload.dislikedBy = arrayRemove(userId);
        dislikes--;
        dislikedBy = dislikedBy.filter(id => id !== userId);
      } else { // User wants to dislike
        updatePayload.dislikes = increment(1);
        updatePayload.dislikedBy = arrayUnion(userId);
        dislikes++;
        dislikedBy.push(userId);
        if (likedBy.includes(userId)) { // If previously liked, remove like
          updatePayload.likes = increment(-1);
          updatePayload.likedBy = arrayRemove(userId);
          likes--;
          likedBy = likedBy.filter(id => id !== userId);
        }
      }
      transaction.update(commentRef, updatePayload);
      return { likes, dislikes, likedBy, dislikedBy };
    });
    revalidatePath(`/play/.*`, 'layout');
    return updatedInteractionState;
  } catch (error) {
    console.error("Error toggling dislike:", error);
    throw error;
  }
}

export async function editComment(commentId: string, userId: string, newText: string): Promise<Partial<Comment>> {
    const commentRef = doc(db, 'comments', commentId);
    try {
        const commentSnap = await getDoc(commentRef);
        if (!commentSnap.exists() || commentSnap.data().userId !== userId) {
            throw new Error("Comment not found or user not authorized to edit.");
        }
        const updateData = {
            text: newText,
            isEdited: true,
            updatedAt: serverTimestamp()
        };
        await updateDoc(commentRef, updateData);
        revalidatePath(`/play/.*`, 'layout');
        // Return the fields that changed along with an ISO timestamp for updatedAt
        return { text: newText, isEdited: true, updatedAt: new Date().toISOString() };
    } catch (error) {
        console.error('Error editing comment:', error);
        throw error;
    }
}

export async function deleteComment(commentId: string, userId: string, isAdminOrOwner: boolean = false): Promise<{ parentIdToUpdate?: string | null }> {
    const commentRef = doc(db, 'comments', commentId);
    try {
        const commentSnap = await getDoc(commentRef);
        if (!commentSnap.exists()) {
            throw new Error("Comment not found.");
        }
        const commentData = commentSnap.data() as Comment;
        
        if (commentData.userId !== userId && !isAdminOrOwner) {
            throw new Error("User not authorized to delete this comment.");
        }

        let parentIdToUpdate: string | null | undefined = commentData.parentId;

        if (commentData.replyCount && commentData.replyCount > 0) {
             await updateDoc(commentRef, {
                text: "[This comment has been deleted by user]",
                isDeleted: true,
                isEdited: true, // Mark as edited since content changed
                updatedAt: serverTimestamp(),
                // Keep userId, userDisplayName, userPhotoURL so context isn't entirely lost for replies
             });
        } else {
            await deleteDoc(commentRef);
            if (commentData.parentId) {
                const parentRef = doc(db, 'comments', commentData.parentId);
                await updateDoc(parentRef, {
                    replyCount: increment(-1),
                    updatedAt: serverTimestamp()
                }).catch(err => console.error("Error updating parent reply count on delete:", err));
            }
        }
       revalidatePath(`/play/.*`, 'layout');
       return { parentIdToUpdate };
    } catch (error) {
        console.error('Error deleting comment:', error);
        throw error;
    }
}

export async function getCommentById(commentId: string): Promise<Comment | null> {
  const commentRef = doc(db, 'comments', commentId);
  try {
    const commentSnap = await getDoc(commentRef);
    if (!commentSnap.exists()) {
      return null;
    }
    return convertCommentTimestampsForClient({ id: commentSnap.id, ...commentSnap.data() } as Comment);
  } catch (error) {
    console.error('Error fetching comment by ID:', error);
    throw error;
  }
}

// For Firestore specific utilities used ONLY within this service:
// Keep `doc`, `getDoc`, `db` imports if needed for internal logic like above.
// Do not re-export them.
