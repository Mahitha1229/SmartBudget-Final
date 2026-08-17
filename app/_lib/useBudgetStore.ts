// app/_lib/useBudgetStore.ts
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
    error: string | null;
    lastFetched: number | null;

    fetchBudgets: (userId: string) => Promise<void>;
    addBudget: (newBudgetData: NewBudgetInput) => Promise<void>;
    updateBudget: (budget: Budget, updates: UpdateBudgetInput) => Promise<void>;
    deleteBudget: (budget: Budget) => Promise<void>;

    calculateSpent: (budgets: Budget[], transactions: Transaction[]) => Budget[];
    recalculateAllBudgets: () => void;
    initialize: (userId: string) => void;
}

let isInitialized = false;

export const useBudgetStore = create<BudgetStore>((set, get) => ({
    budgets: [],
    isLoading: false,
    error: null,
    lastFetched: null,

    /**
     * Calculates 'spent' per budget by summing matching transactions.
     *
     * FIX: previously matched on `tx.amount < 0`, but transactions store
     * amount as a positive number with `type: 'debit' | 'credit'` carrying
     * the sign (same convention used in useTransactionData's totals). That
     * mismatch meant `spent` silently stayed at 0 for every budget. Now
     * matches on `type === 'debit'`, consistent with the rest of the app.
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
        const finalBudgets = calculateSpent(budgets, currentTransactions);
        set({ budgets: finalBudgets });
    },

    /**
     * Subscribes to transaction store changes so budgets recalculate
     * automatically whenever a transaction is added/edited/deleted —
     * including changes that arrive live from another device via the
     * transaction store's onSnapshot listener.
     */
    initialize: (userId: string) => {
        if (isInitialized) return;
        isInitialized = true;

        let previousTransactions = useTransactionStore.getState().transactions;

        useTransactionStore.subscribe((state) => {
            const currentTransactions = state.transactions;
            if (currentTransactions !== previousTransactions) {
                get().recalculateAllBudgets();
                previousTransactions = currentTransactions;
            }
        });

        get().fetchBudgets(userId);
    },

    fetchBudgets: async (userId: string) => {
        if (!userId) {
            set({ isLoading: false, budgets: [] });
            return;
        }

        const { lastFetched, isLoading } = get();
        const CACHE_LIFETIME = 60000;

        if (isLoading || (lastFetched && Date.now() - lastFetched < CACHE_LIFETIME && get().budgets.length > 0)) {
            return;
        }

        set({ isLoading: true, error: null });

        try {
            const rawBudgets = await firestoreService.fetchDocuments<Omit<Budget, 'spent'>>(
                `users/${userId}/budgets`
            );
            const budgetsWithZeroSpent: Budget[] = rawBudgets.map(doc => ({ ...doc, spent: 0 }));
            const currentTransactions = useTransactionStore.getState().transactions;
            const finalBudgets = get().calculateSpent(budgetsWithZeroSpent, currentTransactions);

            set({ budgets: finalBudgets, isLoading: false, lastFetched: Date.now() });
        } catch (err: any) {
            console.error("Failed to fetch budgets:", err.message);
            set({ error: err.message || "Failed to fetch budgets.", isLoading: false });
        }
    },

    addBudget: async (newBudgetData) => {
        const { userId } = newBudgetData;
        if (!userId) throw new Error("User ID is required to add a budget.");

        set({ error: null });
        try {
            await firestoreService.addDocument(`users/${userId}/budgets`, newBudgetData);
            set({ lastFetched: null });
            await get().fetchBudgets(userId);
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
            set({ lastFetched: null });
            await get().fetchBudgets(userId);
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
            set({ lastFetched: null });
            await get().fetchBudgets(userId);
        } catch (err: any) {
            console.error("Failed to delete budget:", err.message);
            set({ error: err.message || "Failed to delete budget." });
            throw err;
        }
    }
}));