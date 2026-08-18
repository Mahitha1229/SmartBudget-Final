// app/_lib/useBudgetStore.ts
import {
    collection,
    getFirestore,
    onSnapshot,
    Unsubscribe,
} from 'firebase/firestore';
import { create } from 'zustand';
import { firestoreService } from '../../src/services/firestoreService';
import { Transaction, useTransactionStore } from './useTransactionStore';

export interface Budget {
    id: string;
    userId: string;
    category: string;
    limit: number;
    spent: number;
    icon: string;
    color: string;
}

export type NewBudgetInput = Omit<Budget, 'id' | 'spent'>;
export type UpdateBudgetInput = { limit: number };

interface BudgetStore {
    budgets: Budget[];
    isLoading: boolean;
    isInitialized: boolean;
    error: string | null;

    addBudget: (newBudgetData: NewBudgetInput) => Promise<void>;
    updateBudget: (budget: Budget, updates: UpdateBudgetInput) => Promise<void>;
    deleteBudget: (budget: Budget) => Promise<void>;

    calculateSpent: (budgets: Budget[], transactions: Transaction[]) => Budget[];
    recalculateAllBudgets: () => void;
    initialize: (userId: string) => void;
    stopListening: () => void;
}

let unsubscribeBudgets: Unsubscribe | null = null;
let unsubscribeFromTransactionStore: (() => void) | null = null;
let initializedForUserId: string | null = null;

export const useBudgetStore = create<BudgetStore>((set, get) => ({
    budgets: [],
    isLoading: false,
    isInitialized: false,
    error: null,

    /**
     * Calculates 'spent' per budget by summing matching transactions.
     * Matches on `type === 'debit'`, consistent with the rest of the app.
     */
    calculateSpent: (currentBudgets, allTransactions) => {
        return currentBudgets.map(budget => {
            const spent = allTransactions
                .filter(tx => tx.category === budget.category && tx.type === 'debit')
                .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
            return { ...budget, spent };
        });
    },

    recalculateAllBudgets: () => {
        const { budgets, calculateSpent } = get();
        if (budgets.length === 0) return;
        const currentTransactions = useTransactionStore.getState().transactions;
        set({ budgets: calculateSpent(budgets, currentTransactions) });
    },

    /**
     * Live Firestore listener for budgets, PLUS a subscription to the
     * transaction store so `spent` recalculates instantly whenever a
     * transaction changes — from this device or (via onSnapshot in
     * useTransactionStore) any other device on the same account.
     */
    initialize: (userId: string) => {
        // Avoid re-subscribing if already listening for this exact user.
        if (initializedForUserId === userId && unsubscribeBudgets) return;

        // Tear down any previous listeners (e.g. user switched accounts).
        if (unsubscribeBudgets) {
            unsubscribeBudgets();
            unsubscribeBudgets = null;
        }
        if (unsubscribeFromTransactionStore) {
            unsubscribeFromTransactionStore();
            unsubscribeFromTransactionStore = null;
        }

        initializedForUserId = userId;
        set({ isLoading: true, error: null });

        const db = getFirestore();
        const budgetsRef = collection(db, `users/${userId}/budgets`);

        unsubscribeBudgets = onSnapshot(
            budgetsRef,
            (snapshot) => {
                const rawBudgets = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...(doc.data() as Omit<Budget, 'id' | 'spent'>),
                    spent: 0,
                }));
                const currentTransactions = useTransactionStore.getState().transactions;
                const finalBudgets = get().calculateSpent(rawBudgets, currentTransactions);
                set({ budgets: finalBudgets, isLoading: false, isInitialized: true });
            },
            (error) => {
                console.error('[BudgetStore] listener error:', error.message);
                set({ error: error.message, isLoading: false, isInitialized: true });
            }
        );

        // Recalculate spent amounts whenever transactions change live.
        let previousTransactions = useTransactionStore.getState().transactions;
        unsubscribeFromTransactionStore = useTransactionStore.subscribe((state) => {
            if (state.transactions !== previousTransactions) {
                get().recalculateAllBudgets();
                previousTransactions = state.transactions;
            }
        });
    },

    stopListening: () => {
        if (unsubscribeBudgets) {
            unsubscribeBudgets();
            unsubscribeBudgets = null;
        }
        if (unsubscribeFromTransactionStore) {
            unsubscribeFromTransactionStore();
            unsubscribeFromTransactionStore = null;
        }
        initializedForUserId = null;
    },

    addBudget: async (newBudgetData) => {
        const { userId } = newBudgetData;
        if (!userId) throw new Error("User ID is required to add a budget.");
        set({ error: null });
        try {
            await firestoreService.addDocument(`users/${userId}/budgets`, newBudgetData);
            // No manual refetch — the onSnapshot listener picks it up.
        } catch (err: any) {
            console.error("Failed to add budget:", err.message);
            set({ error: err.message || "Failed to add budget." });
            throw err;
        }
    },

    updateBudget: async (budget, updates) => {
        set({ error: null });
        const { userId, id: budgetId } = budget;
        if (!userId) throw new Error("User ID is required to update a budget.");
        try {
            await firestoreService.updateDocument(`users/${userId}/budgets/${budgetId}`, updates);
        } catch (err: any) {
            console.error("Failed to update budget:", err.message);
            set({ error: err.message || "Failed to update budget." });
            throw err;
        }
    },

    deleteBudget: async (budget) => {
        set({ error: null });
        const { userId, id: budgetId } = budget;
        if (!userId) throw new Error("User ID is required to delete a budget.");
        try {
            await firestoreService.deleteDocument(`users/${userId}/budgets/${budgetId}`);
        } catch (err: any) {
            console.error("Failed to delete budget:", err.message);
            set({ error: err.message || "Failed to delete budget." });
            throw err;
        }
    }
}));