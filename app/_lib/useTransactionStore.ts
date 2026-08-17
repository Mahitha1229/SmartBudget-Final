// SmartBudget/app/_lib/useTransactionStore.ts
import { collection, doc, getFirestore, Unsubscribe, writeBatch } from 'firebase/firestore';
import { useMemo } from 'react';
import { create } from 'zustand';
import { firestoreService, Transaction as ImportedTransaction } from '../../src/services/firestoreService';

export type Transaction = ImportedTransaction;

type TransactionInput = Omit<Transaction, 'id' | 'userId' | 'createdAt'> & { date: Date };

interface TransactionStore {
    transactions: Transaction[];
    isLoading: boolean;
    isInitialized: boolean;
    error: string | null;
    // Kept the same name/signature as before so existing call sites
    // (e.g. index.tsx's useEffect) don't need to change — but internally
    // this now sets up a LIVE onSnapshot listener instead of a one-time fetch.
    fetchTransactions: (userId: string | null) => void;
    stopListening: () => void;
    addTransaction: (newTransaction: TransactionInput, userId: string | null) => Promise<void>;
    addTransactionsBatch: (transactions: TransactionInput[], userId: string) => Promise<void>;
    updateTransaction: (updatedTransaction: Transaction) => Promise<void>;
    deleteTransaction: (id: string) => Promise<void>;
    clearTransactions: (userId: string | null) => Promise<void>;
}

// Module-level ref to the active Firestore listener so we can tear it down
// when the user changes or logs out, instead of stacking listeners forever.
let unsubscribeFn: Unsubscribe | null = null;

export const useTransactionStore = create<TransactionStore>((set, get) => ({
    transactions: [],
    isLoading: false,
    isInitialized: false,
    error: null,

    fetchTransactions: (userId: string | null) => {
        // Always tear down any previous listener first — prevents leaks and
        // stale data from a previous user bleeding into the new session.
        if (unsubscribeFn) {
            unsubscribeFn();
            unsubscribeFn = null;
        }

        if (!userId) {
            set({ transactions: [], isLoading: false, isInitialized: true });
            return;
        }

        set({ isLoading: true, error: null });

        unsubscribeFn = firestoreService.subscribeToTransactions(
            userId,
            (data) => {
                // Runs on initial load AND every subsequent change — from
                // this device or any other device signed into this account.
                const sorted = data.sort((a, b) => b.date.getTime() - a.date.getTime());
                set({ transactions: sorted, isLoading: false, isInitialized: true });
            },
            (error) => {
                set({ error: error.message, isLoading: false, isInitialized: true });
            }
        );
    },

    stopListening: () => {
        if (unsubscribeFn) {
            unsubscribeFn();
            unsubscribeFn = null;
        }
    },

    addTransaction: async (transactionData, userId) => {
        if (!userId) throw new Error("User not authenticated.");
        set({ isLoading: true });
        try {
            // No need to manually splice into local state anymore — the
            // onSnapshot listener above will fire automatically once this
            // write lands, keeping local state and Firestore in sync.
            await firestoreService.addTransaction({ ...transactionData, userId } as ImportedTransaction);
            set({ isLoading: false });
        } catch (err: any) {
            console.error('Failed to add transaction:', err.message);
            set({ error: err.message, isLoading: false });
            throw err;
        }
    },

    addTransactionsBatch: async (transactionsData, userId) => {
        if (!userId) throw new Error("User not authenticated.");
        set({ isLoading: true });
        const db = getFirestore();
        const batch = writeBatch(db);

        try {
            transactionsData.forEach((data) => {
                const docRef = doc(collection(db, "transactions"));
                batch.set(docRef, { ...data, id: docRef.id, userId, createdAt: new Date() });
            });
            await batch.commit();
            // Listener picks up the change automatically.
            set({ isLoading: false });
        } catch (err: any) {
            console.error('Failed to add batch transactions:', err.message);
            set({ error: err.message, isLoading: false });
            throw err;
        }
    },

    updateTransaction: async (updatedTransaction) => {
        set({ isLoading: true });
        try {
            await firestoreService.updateTransaction(updatedTransaction);
            set({ isLoading: false });
        } catch (err: any) {
            console.error('Failed to update transaction:', err.message);
            set({ error: err.message, isLoading: false });
        }
    },

    deleteTransaction: async (id) => {
        try {
            await firestoreService.deleteTransaction(id);
            // Listener will remove it from local state automatically.
        } catch (err: any) {
            console.error('Failed to delete transaction:', err.message);
            set({ error: err.message });
        }
    },

    clearTransactions: async (userId) => {
        if (!userId) return;
        const db = getFirestore();
        const batch = writeBatch(db);
        const currentTransactions = get().transactions;

        try {
            set({ isLoading: true });
            currentTransactions.forEach((txn) => {
                batch.delete(doc(db, "transactions", txn.id));
            });
            await batch.commit();
            set({ isLoading: false });
        } catch (err: any) {
            console.error('Failed to clear transactions:', err.message);
            set({ error: "Failed to clear history.", isLoading: false });
        }
    }
}));

export const useTransactionData = () => {
    const { transactions, isLoading, isInitialized, error } = useTransactionStore();

    return useMemo(() => {
        if (!isInitialized) {
            return {
                transactions: [],
                isLoading: true,
                isInitialized: false,
                error: null,
                totalIncome: 0,
                totalExpense: 0,
                currentBalance: 0,
                chartData: []
            };
        }

        const totalIncome = transactions
            .filter(t => t.type === 'credit')
            .reduce((sum, t) => sum + t.amount, 0);

        const totalExpense = transactions
            .filter(t => t.type === 'debit')
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);

        const categoryTotals = transactions
            .filter(t => t.type === 'debit')
            .reduce((acc: Record<string, number>, t) => {
                acc[t.category] = (acc[t.category] || 0) + Math.abs(t.amount);
                return acc;
            }, {});

        const chartData = Object.keys(categoryTotals).map((cat, index) => ({
            value: categoryTotals[cat],
            text: cat,
            color: ['#0EA5E9', '#F59E0B', '#10B981', '#EF4444', '#6366F1', '#EC4899'][index % 6]
        }));

        return {
            transactions,
            isLoading,
            isInitialized,
            error,
            totalIncome,
            totalExpense,
            currentBalance: totalIncome - totalExpense,
            chartData
        };
    }, [transactions, isLoading, isInitialized, error]);
};