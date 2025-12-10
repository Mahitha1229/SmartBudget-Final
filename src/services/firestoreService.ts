// src/services/firestoreService.ts

import { db, auth } from '../../app/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// Define the interface for transaction data
interface TransactionData {
  amount: number;
  category: string;
  description: string;
  type: 'debit' | 'credit';
  date: Date;
}

/**
 * Saves a new manual transaction to Firestore.
 */
export const addTransaction = async (data: TransactionData) => {
  const userId = auth.currentUser?.uid;

  if (!userId) {
    throw new Error("User not authenticated. Cannot save transaction.");
  }

  try {
    await addDoc(collection(db, 'transactions'), {
      ...data,
      userId: userId,
      createdAt: serverTimestamp(),
      source: 'manual', // Explicitly marking the source
    });
    return { success: true };
  } catch (error) {
    console.error("Firestore Error: Failed to add transaction: ", error);
    throw new Error("Failed to save transaction to the database.");
  }
};