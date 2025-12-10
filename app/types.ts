// app/types.ts

import { Timestamp } from 'firebase/firestore';

/**
 * Defines the structure for a financial transaction record.
 */
export interface Transaction {
  id: string; // Document ID from Firestore
  userId: string;
  amount: number;
  category: string;
  description: string;
  type: 'debit' | 'credit';
  source: 'manual' | 'sms' | 'csv';
  date: Date; // Use Date object for front-end rendering
  createdAt: Timestamp; // Firestore timestamp for backend
}

/**
 * Defines the structure for user budget limits.
 */
export interface Budget {
  id: string;
  userId: string;
  category: string;
  limit: number;
}