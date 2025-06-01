
'use server';

import { db } from '@/lib/firebase';
import type { Report, ReportIssueType } from '@/types/report';
import {
  collection,
  addDoc,
  getDocs,
  doc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
  FirestoreError,
} from 'firebase/firestore';
import { revalidatePath } from 'next/cache';

const reportsCollection = collection(db, 'reports');

const handleFirestoreError = (error: unknown, context: string): FirestoreError => {
  console.error(`Firestore Error in ${context}:`, error);
  if (error instanceof FirestoreError) {
    return error;
  }
  const genericError = new FirestoreError('unknown', `An unknown error occurred in ${context}.`);
  if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string') {
    (genericError as any).message = error.message;
  }
  return genericError;
};

export interface ReportInputData {
  userId?: string | null;
  userEmail?: string | null;
  animeId: string;
  animeTitle?: string;
  episodeId?: string | null;
  episodeTitle?: string | null;
  sourceUrl?: string | null;
  sourceLabel?: string | null;
  issueType: ReportIssueType;
  description: string;
}

export async function addReportToFirestore(reportData: ReportInputData): Promise<string> {
  try {
    const docRef = await addDoc(reportsCollection, {
      ...reportData,
      status: 'open', // Default status
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    // Optionally revalidate an admin reports page if it exists
    revalidatePath('/admin/reports');
    return docRef.id;
  } catch (error) {
    throw handleFirestoreError(error, `addReportToFirestore (animeId: ${reportData.animeId})`);
  }
}

export async function getAllReports(): Promise<Report[]> {
  try {
    const q = query(reportsCollection, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(docSnap => {
      const data = docSnap.data();
      // Convert Timestamps to ISO strings for client-side compatibility if needed by components
      // For this admin tab, we might format directly in the component
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
      } as Report;
    });
  } catch (error) {
    throw handleFirestoreError(error, 'getAllReports');
  }
}

export async function deleteReport(reportId: string): Promise<void> {
  const reportRef = doc(db, 'reports', reportId);
  try {
    await deleteDoc(reportRef);
    revalidatePath('/admin/reports');
  } catch (error) {
    throw handleFirestoreError(error, `deleteReport (reportId: ${reportId})`);
  }
}
