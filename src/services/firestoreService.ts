// src/services/firestoreService.ts

import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    DocumentData,
    getDocs,
    onSnapshot,
    orderBy,
    query,
    QueryDocumentSnapshot,
    serverTimestamp,
    Timestamp,
    Unsubscribe,
    updateDoc,
    where,
} from 'firebase/firestore';
import { auth, db } from '../../app/_lib/firebase';

// ⭐️ SOURCE OF TRUTH FOR TRANSACTION TYPE
export interface Transaction {
    id: string;
    description: string;
    amount: number;
    category: string;
    type: "debit" | "credit";
    date: Date;
    userId: string;
    source?: string;
    createdAt?: any;
}

interface TransactionData {
    amount: number;
    category: string;
    description: string;
    type: 'debit' | 'credit';
    date: Date;
}

// --- Helper Functions for Data Conversion ---

/** Converts a Firestore Document snapshot into the local Transaction interface. */
const docToTransaction = (doc: QueryDocumentSnapshot<DocumentData>): Transaction => {
    const data = doc.data();
    const date = data.date instanceof Timestamp ? data.date.toDate() : new Date(data.date);

    return {
        id: doc.id,
        description: data.description,
        amount: data.amount,
        category: data.category,
        type: data.type,
        date: date,
        userId: data.userId,
        source: data.source,
        createdAt: data.createdAt,
    } as Transaction;
};

export const firestoreService = {
    // --- AUTH/PATH HELPERS ---
    getUserId: () => {
        const userId = auth.currentUser?.uid;
        if (!userId) {
            throw new Error("User not authenticated. Cannot perform database operation.");
        }
        return userId;
    },

    getTransactionPath: (transactionId?: string) => {
        const basePath = 'transactions';
        return transactionId ? `${basePath}/${transactionId}` : basePath;
    },

    // --- REAL-TIME SUBSCRIPTION (NEW) ---
    /**
     * Subscribes to live transaction updates for a user. Fires immediately
     * with current data, then again on every add/edit/delete — from THIS
     * device or any other device signed into the same account.
     *
     * Returns an unsubscribe function — call it when the listener is no
     * longer needed (logout, unmount) to avoid leaking listeners.
     */
    subscribeToTransactions: (
        userId: string,
        onData: (transactions: Transaction[]) => void,
        onError: (error: Error) => void
    ): Unsubscribe => {
        const collectionRef = collection(db, firestoreService.getTransactionPath());
        const q = query(
            collectionRef,
            where('userId', '==', userId),
            orderBy('date', 'desc')
        );

        return onSnapshot(
            q,
            (snapshot) => {
                onData(snapshot.docs.map(docToTransaction));
            },
            (error) => {
                console.error('[FS-SUBSCRIBE] Transaction listener error:', error.message);
                onError(new Error("Failed to sync transactions in real time."));
            }
        );
    },

    // --- ONE-TIME FETCH (kept for places that don't need a live listener) ---
    fetchTransactions: async (userId: string): Promise<Transaction[]> => {
        try {
            const collectionRef = collection(db, firestoreService.getTransactionPath());
            const q = query(
                collectionRef,
                where('userId', '==', userId),
                orderBy('date', 'desc')
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(docToTransaction);
        } catch (error: any) {
            console.error('[FS-TXN] Failed to fetch transactions:', error.message);
            throw new Error("Failed to fetch data from the database.");
        }
    },

    addTransaction: async (data: TransactionData): Promise<Transaction> => {
        const userId = firestoreService.getUserId();

        const dataToSave: DocumentData = {
            ...data,
            userId,
            date: Timestamp.fromDate(data.date),
            createdAt: serverTimestamp(),
            source: 'manual',
        };

        try {
            const docRef = await addDoc(collection(db, firestoreService.getTransactionPath()), dataToSave);
            return { id: docRef.id, ...data, userId } as Transaction;
        } catch (error: any) {
            console.error('[FS-ADD] Failed to add transaction:', error.message);
            throw new Error("Failed to save data to the database.");
        }
    },

    updateTransaction: async (data: Transaction): Promise<Transaction> => {
        firestoreService.getUserId();
        const { id, ...updateData } = data;

        try {
            const docRef = doc(db, firestoreService.getTransactionPath(id));
            const dataToSave: DocumentData = {
                ...updateData,
                date: Timestamp.fromDate(data.date),
            };
            await updateDoc(docRef, dataToSave);
            return data;
        } catch (error: any) {
            console.error('[FS-UPDATE] Failed to update transaction:', error.message);
            throw new Error("Failed to update document in the database.");
        }
    },

    deleteTransaction: async (id: string): Promise<void> => {
        firestoreService.getUserId();
        try {
            const docRef = doc(db, firestoreService.getTransactionPath(id));
            await deleteDoc(docRef);
        } catch (error: any) {
            console.error('[FS-DELETE] Failed to delete transaction:', error.message);
            throw new Error("Failed to delete document from the database.");
        }
    },

    // --- Generic Helpers ---
    fetchDocuments: async <T extends DocumentData>(path: string): Promise<(T & { id: string })[]> => {
        try {
            const collectionRef = collection(db, path);
            const snapshot = await getDocs(query(collectionRef));
            return snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as T) }));
        } catch (error: any) {
            console.error(`[FS-DOC] Failed to fetch documents from ${path}:`, error.message);
            throw new Error("Failed to fetch data from the database.");
        }
    },

    addDocument: async (path: string, data: DocumentData) => {
        try {
            const collectionRef = collection(db, path);
            return await addDoc(collectionRef, { ...data, createdAt: serverTimestamp() });
        } catch (error: any) {
            console.error('[FS-ADD-DOC] Failed to add document:', error.message);
            throw new Error("Failed to save document to the database.");
        }
    },

    updateDocument: async (fullPath: string, data: DocumentData) => {
        try {
            const docRef = doc(db, fullPath);
            await updateDoc(docRef, data);
        } catch (error: any) {
            console.error(`[FS-UPDATE-DOC] Failed to update document at ${fullPath}:`, error.message);
            throw new Error("Failed to update document in the database.");
        }
    },

    deleteDocument: async (fullPath: string) => {
        try {
            const docRef = doc(db, fullPath);
            await deleteDoc(docRef);
        } catch (error: any) {
            console.error(`[FS-DELETE-DOC] Failed to delete document at ${fullPath}:`, error.message);
            throw new Error("Failed to delete document from the database.");
        }
    }
};