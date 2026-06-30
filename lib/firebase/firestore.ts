// lib/firebase/firestore.ts
// import { adminDb } from './admin';
import { FieldValue } from 'firebase-admin/firestore';
import { Escort } from '@/server-actions/escort.action';
import { adminDb } from '../firebase-admin';
// import type { Escort } from '../models/escort';

export async function getEscortById(escortId: string): Promise<Escort | null> {
  try {
    const doc = await adminDb.collection('escorts').doc(escortId).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as Escort;
  } catch (error) {
    console.error('Get escort error:', error);
    return null;
  }
}

export async function updateEscortImages(
  escortId: string,
  imageUrls: string[],
  metadata?: {
    cleanedAt?: Date;
    processingTime?: number;
    cleaningMethod?: string;
  }
): Promise<void> {
  try {
    const escortRef = adminDb.collection('escorts').doc(escortId);
    const doc = await escortRef.get();

    if (!doc.exists) {
      throw new Error(`Escort with ID ${escortId} not found`);
    }

    const currentData = doc.data() as Escort;
    const currentImages = currentData.images || [];

    const updatedImages = [...currentImages, ...imageUrls];

    type CleaningHistoryEntry = {
      cleanedAt: Date;
      imagesAdded: number;
      method: string;
      processingTime: number;
    };

    const cleaningHistory = (currentData.cleaningHistory || []) as CleaningHistoryEntry[];
    cleaningHistory.push({
      cleanedAt: metadata?.cleanedAt || new Date(),
      imagesAdded: imageUrls.length,
      method: metadata?.cleaningMethod || 'replicate',
      processingTime: metadata?.processingTime || 0,
    });

    await escortRef.update({
      images: updatedImages,
      updatedAt: FieldValue.serverTimestamp(),
      cleaningHistory: cleaningHistory,
      lastCleanedAt: metadata?.cleanedAt || new Date(),
    });

    if (!currentData.previewPhoto && imageUrls.length > 0) {
      await escortRef.update({
        previewPhoto: imageUrls[0],
      });
    }
  } catch (error) {
    console.error('Firestore update error:', error);
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to update escort images: ${message}`);
  }
}

export async function logCleaningEvent(
  escortId: string,
  event: {
    type: 'success' | 'error' | 'partial';
    imageCount: number;
    method: string;
    error?: string;
    duration: number;
  }
): Promise<void> {
  try {
    await adminDb.collection('cleaningLogs').add({
      escortId,
      ...event,
      timestamp: FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error('Logging error:', error);
  }
}