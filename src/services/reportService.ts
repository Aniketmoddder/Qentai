
'use server';

import { db } from '@/lib/firebase';
import type { Report, ReportIssueType } from '@/types/report';
import {
  collection,
  addDoc,
  serverTimestamp,
  FirestoreError,
} from 'firebase/firestore';
// import { revalidatePath } from 'next/cache'; // To potentially refresh admin report lists

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
      status: 'open',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    // Optionally revalidate an admin path if you create an admin reports page
    // For now, admin panel updates for reports can be a future step.
    // e.g., revalidatePath('/admin/reports-dashboard');
    return docRef.id;
  } catch (error) {
    throw handleFirestoreError(error, `addReportToFirestore (animeId: ${reportData.animeId})`);
  }
}
