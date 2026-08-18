// app/_lib/useGoalsStore.ts
import {
    collection,
    getFirestore,
    onSnapshot,
    orderBy,
    query,
    Timestamp,
    Unsubscribe
} from 'firebase/firestore';
import { create } from 'zustand';
import { firestoreService } from '../../src/services/firestoreService';

export interface Goal {
    id: string;
    userId: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
    icon: string;
    color: string;
    createdAt: Date;
    targetDate?: Date;
}

export type NewGoalInput = Omit<Goal, 'id' | 'currentAmount' | 'createdAt'>;
export type UpdateGoalInput = Partial<Omit<Goal, 'id' | 'userId' | 'createdAt'>>;

interface GoalsStore {
    goals: Goal[];
    isLoading: boolean;
    isInitialized: boolean;
    error: string | null;

    subscribeToGoals: (userId: string | null) => void;
    stopListening: () => void;
    addGoal: (newGoalData: NewGoalInput) => Promise<void>;
    updateGoal: (goal: Goal, updates: UpdateGoalInput) => Promise<void>;
    deleteGoal: (goal: Goal) => Promise<void>;
    addContribution: (goalId: string, userId: string, amount: number) => Promise<void>;
    // Kept for compatibility with existing call sites (index.tsx calls
    // useGoalsStore.getState().initialize(user.uid)) — now just delegates
    // to the live subscription instead of a one-time fetch.
    initialize: (userId: string) => void;
}

let unsubscribeFn: Unsubscribe | null = null;

const docToGoal = (docSnap: any): Goal => {
    const data = docSnap.data();
    return {
        id: docSnap.id,
        userId: data.userId,
        name: data.name,
        targetAmount: data.targetAmount,
        currentAmount: data.currentAmount ?? 0,
        icon: data.icon,
        color: data.color,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
        targetDate: data.targetDate
            ? (data.targetDate instanceof Timestamp ? data.targetDate.toDate() : new Date(data.targetDate))
            : undefined,
    };
};

export const useGoalsStore = create<GoalsStore>((set, get) => ({
    goals: [],
    isLoading: false,
    isInitialized: false,
    error: null,

    subscribeToGoals: (userId: string | null) => {
        if (unsubscribeFn) {
            unsubscribeFn();
            unsubscribeFn = null;
        }

        if (!userId) {
            set({ goals: [], isLoading: false, isInitialized: true });
            return;
        }

        set({ isLoading: true, error: null });
        const db = getFirestore();
        const q = query(collection(db, `users/${userId}/goals`), orderBy('createdAt', 'desc'));

        unsubscribeFn = onSnapshot(
            q,
            (snapshot) => {
                const goals = snapshot.docs.map(docToGoal);
                set({ goals, isLoading: false, isInitialized: true });
            },
            (error) => {
                console.error('[GoalsStore] listener error:', error.message);
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

    // Backward-compatible entry point — existing screens calling
    // `.initialize(userId)` now get a live subscription instead of a fetch.
    initialize: (userId: string) => {
        get().subscribeToGoals(userId);
    },

    addGoal: async (newGoalData) => {
        const { userId } = newGoalData;
        if (!userId) throw new Error("User ID is required to add a goal.");

        set({ error: null });
        try {
            const goalToAdd = {
                ...newGoalData,
                currentAmount: 0,
                createdAt: new Date(),
            };
            await firestoreService.addDocument(`users/${userId}/goals`, goalToAdd);
            // No manual refetch needed — the onSnapshot listener picks this up.
        } catch (err: any) {
            console.error("Failed to add goal:", err.message);
            set({ error: err.message || "Failed to add goal." });
            throw err;
        }
    },

    updateGoal: async (goal, updates) => {
        set({ error: null });
        const { userId, id: goalId } = goal;
        if (!userId) throw new Error("User ID is required to update a goal.");

        try {
            await firestoreService.updateDocument(`users/${userId}/goals/${goalId}`, updates);
        } catch (err: any) {
            console.error("Failed to update goal:", err.message);
            set({ error: err.message || "Failed to update goal." });
            throw err;
        }
    },

    deleteGoal: async (goal) => {
        set({ error: null });
        const { userId, id: goalId } = goal;
        if (!userId) throw new Error("User ID is required to delete a goal.");

        try {
            await firestoreService.deleteDocument(`users/${userId}/goals/${goalId}`);
        } catch (err: any) {
            console.error("Failed to delete goal:", err.message);
            set({ error: err.message || "Failed to delete goal." });
            throw err;
        }
    },

    addContribution: async (goalId: string, userId: string, amount: number) => {
        if (!userId) throw new Error("User ID is required to add contribution.");
        set({ error: null });

        try {
            const goal = get().goals.find(g => g.id === goalId);
            if (!goal) throw new Error("Goal not found");

            const newAmount = goal.currentAmount + amount;
            await firestoreService.updateDocument(
                `users/${userId}/goals/${goalId}`,
                { currentAmount: newAmount }
            );
            // Listener updates local state automatically — including if the
            // contribution happens from another device.
        } catch (err: any) {
            console.error("Failed to add contribution:", err.message);
            set({ error: err.message || "Failed to add contribution." });
            throw err;
        }
    },
}));