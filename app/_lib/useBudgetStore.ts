// app/lib/useBudgetStore.ts - WITH DEBUGGING
import { create } from 'zustand';
import { firestoreService } from '../../src/services/firestoreService';
import { useTransactionStore, Transaction } from './useTransactionStore'; 

// --- 1. INTERFACE DEFINITIONS ---

export interface Budget {
    id: string;
    userId: string;
    category: string;
    limit: number;
    spent: number; 
    icon: string;
    color: string;
}

// Data shape for creating a new budget
export type NewBudgetInput = Omit<Budget, 'id' | 'spent'>;

// Data shape for updating an existing budget
export type UpdateBudgetInput = {
    limit: number;
};


interface BudgetStore {
    budgets: Budget[];
    isLoading: boolean;
    error: string | null;
    lastFetched: number | null; 
    
    // Core Actions
    fetchBudgets: (userId: string) => Promise<void>;
    addBudget: (newBudgetData: NewBudgetInput) => Promise<void>;
    updateBudget: (budget: Budget, updates: UpdateBudgetInput) => Promise<void>;
    deleteBudget: (budget: Budget) => Promise<void>;
    
    // Internal/Helper Actions
    calculateSpent: (budgets: Budget[], transactions: Transaction[]) => Budget[];
    recalculateAllBudgets: () => void;
    initialize: (userId: string) => void;
}

// A global flag to ensure the subscription only happens once
let isInitialized = false;

// --- 2. THE ZUSTAND STORE ---

export const useBudgetStore = create<BudgetStore>((set, get) => ({
    budgets: [],
    isLoading: false,
    error: null,
    lastFetched: null, 

    /**
     * Helper function to calculate the actual spent amount for each budget 
     * by comparing it against the current transactions.
     * @param currentBudgets The list of budgets (with limits, but spent=0 initially)
     * @param allTransactions The full list of transactions to aggregate from
     * @returns A new array of budgets with the 'spent' property calculated
     */
    calculateSpent: (currentBudgets, allTransactions) => {
        console.log('🔍🔍🔍 ========== CALCULATE SPENT STARTED ==========');
        console.log(`📊 Processing ${currentBudgets.length} budgets against ${allTransactions.length} transactions`);
        console.log('📋 Current budgets:', currentBudgets.map(b => ({ category: b.category, limit: b.limit })));
        
        const calculatedBudgets = currentBudgets.map(budget => {
            console.log(`\n💰 Calculating spent for budget: "${budget.category}" (limit: ${budget.limit})`);
            let spent = 0;
            let matchCount = 0;
            
            allTransactions.forEach((tx, index) => {
                console.log(`  📝 Transaction ${index + 1}:`, {
                    category: tx.category,
                    amount: tx.amount,
                    type: tx.type,
                    date: tx.date
                });
                
                // Log the comparison
                const categoryMatches = tx.category === budget.category;
                const isNegative = tx.amount < 0;
                const isDebit = tx.type === 'debit';
                
                console.log(`    🔎 Category match: ${categoryMatches} ("${tx.category}" === "${budget.category}")`);
                console.log(`    🔎 Amount < 0: ${isNegative} (${tx.amount})`);
                console.log(`    🔎 Type is debit: ${isDebit} (${tx.type})`);
                
                // IMPORTANT: Check BOTH conditions to see which one works
                const matchesOldCondition = tx.category === budget.category && tx.amount < 0;
                const matchesNewCondition = tx.category === budget.category && tx.type === 'debit';
                
                console.log(`    ❓ Old condition (amount < 0): ${matchesOldCondition}`);
                console.log(`    ❓ New condition (type === 'debit'): ${matchesNewCondition}`);
                
                // Using the OLD condition for now - we'll see which one should work
                if (tx.category === budget.category && tx.amount < 0) {
                    matchCount++;
                    const amountToAdd = Math.abs(tx.amount);
                    console.log(`    ✅ MATCHED! Adding ${amountToAdd} to spent`);
                    spent += amountToAdd;
                }
            });
            
            console.log(`  📊 Total matches: ${matchCount}`);
            console.log(`  💵 Total spent calculated: ${spent} / ${budget.limit}`);
            
            return {
                ...budget,
                spent: spent,
            };
        });
        
        console.log('\n✅ ========== CALCULATE SPENT COMPLETE ==========');
        console.log('📊 Final budgets:', calculatedBudgets.map(b => ({ 
            category: b.category, 
            spent: b.spent, 
            limit: b.limit,
            percentage: `${Math.round((b.spent / b.limit) * 100)}%`
        })));
        console.log('🔍🔍🔍 ============================================\n');
        
        return calculatedBudgets;
    },

    /**
     * Recalculates the spent amount for all current budgets using transactions.
     */
    recalculateAllBudgets: () => {
        console.log('🔄🔄🔄 ========== RECALCULATE ALL BUDGETS TRIGGERED ==========');
        const { budgets, calculateSpent } = get();
        const currentTransactions = useTransactionStore.getState().transactions;
        
        console.log(`📊 Current budgets count: ${budgets.length}`);
        console.log(`📊 Current transactions count: ${currentTransactions.length}`);
        
        if (budgets.length === 0) {
            console.log('⚠️ No budgets to update (budgets.length = 0)');
            console.log('🔄🔄🔄 ========================================================\n');
            return;
        }
        
        const finalBudgets = calculateSpent(budgets, currentTransactions);
        console.log('✅ Updating budget state with recalculated values');
        set({ budgets: finalBudgets });
        console.log('🔄🔄🔄 ========================================================\n');
    },

    /**
     * Initializes the store by setting up the transaction subscription.
     * This ensures budgets are always updated when transactions change.
     */
    initialize: (userId: string) => {
        if (isInitialized) {
            console.log('⚠️ BudgetStore already initialized, skipping');
            return;
        }
        isInitialized = true;
        console.log('🚀 ========== BUDGET STORE INITIALIZING ==========');
        console.log(`👤 User ID: ${userId}`);

        // Track previous transactions to detect changes
        let previousTransactions = useTransactionStore.getState().transactions;
        console.log(`📊 Initial transaction count: ${previousTransactions.length}`);

        // Subscribe to transaction store changes
        console.log('🔔 Setting up transaction subscription...');
        useTransactionStore.subscribe((state) => {
            const currentTransactions = state.transactions;
            
            console.log('\n🔔 ========== TRANSACTION STORE CHANGED ==========');
            console.log(`📊 Previous transactions: ${previousTransactions.length}`);
            console.log(`📊 Current transactions: ${currentTransactions.length}`);
            
            // Check if transactions have actually changed
            if (currentTransactions !== previousTransactions) {
                console.log('✅ Transaction array reference changed - triggering recalculation');
                console.log('📝 Transaction details:', currentTransactions.map(t => ({
                    category: t.category,
                    amount: t.amount,
                    type: t.type
                })));
                
                get().recalculateAllBudgets();
                previousTransactions = currentTransactions;
            } else {
                console.log('⚠️ Transaction array reference unchanged - no recalculation needed');
            }
            console.log('🔔 ===============================================\n');
        });

        console.log('✅ Subscription setup complete');
        console.log('🚀 ================================================\n');

        // Fetch initial data right after subscription setup
        get().fetchBudgets(userId);
    },

    /**
     * Fetches all budget documents for the given user from Firestore.
     */
    fetchBudgets: async (userId: string) => {
        console.log('\n📥 ========== FETCH BUDGETS STARTED ==========');
        console.log(`👤 User ID: ${userId}`);
        
        if (!userId) {
            console.log('⚠️ No userId provided, clearing budgets');
            set({ isLoading: false, budgets: [] });
            return;
        }

        const { lastFetched, isLoading } = get();
        const CACHE_LIFETIME = 60000; // 60 seconds

        // Cache Guard: Prevents fetching if data is fresh or already loading
        if (isLoading || (lastFetched && Date.now() - lastFetched < CACHE_LIFETIME && get().budgets.length > 0)) {
            console.log('⚠️ Budget fetch skipped: Cache fresh or already loading');
            console.log(`   - isLoading: ${isLoading}`);
            console.log(`   - lastFetched: ${lastFetched ? new Date(lastFetched).toISOString() : 'never'}`);
            console.log(`   - cache age: ${lastFetched ? Date.now() - lastFetched : 'N/A'}ms`);
            return;
        }
        
        console.log('🔄 Initiating budget fetch from Firestore...');
        set({ isLoading: true, error: null });

        try {
            // 1. Get raw budget data from Firestore
            const rawBudgets = await firestoreService.fetchDocuments<Omit<Budget, 'spent'>>(
                `users/${userId}/budgets`
            );
            console.log(`✅ Fetched ${rawBudgets.length} budgets from Firestore`);
            console.log('📋 Raw budgets:', rawBudgets.map(b => ({ 
                id: b.id, 
                category: b.category, 
                limit: b.limit 
            })));
            
            // 2. Prepare budgets for calculation (set spent=0 temporarily)
            const budgetsWithZeroSpent: Budget[] = rawBudgets.map(doc => ({
                ...doc,
                spent: 0, 
            }));
            console.log('📋 Budgets prepared with spent=0');

            // 3. Get current transactions from the transaction store
            const currentTransactions = useTransactionStore.getState().transactions;
            console.log(`📊 Current transactions in store: ${currentTransactions.length}`);
            
            if (currentTransactions.length > 0) {
                console.log('📝 Sample transactions:', currentTransactions.slice(0, 3).map(t => ({
                    category: t.category,
                    amount: t.amount,
                    type: t.type
                })));
            }

            // 4. Calculate spent amounts
            console.log('🔄 Calling calculateSpent...');
            const finalBudgets = get().calculateSpent(budgetsWithZeroSpent, currentTransactions);

            set({ 
                budgets: finalBudgets, 
                isLoading: false,
                lastFetched: Date.now(),
            });
            console.log(`✅ Budgets fetched and calculated successfully`);
            console.log('📥 ===========================================\n');
        } catch (err: any) {
            console.error("🔴 Failed to fetch budgets:", err);
            set({ 
                error: err.message || "Failed to fetch budgets.", 
                isLoading: false,
            });
            console.log('📥 ===========================================\n');
        }
    },

    /**
     * Adds a new budget document to Firestore and triggers a data refresh.
     */
    addBudget: async (newBudgetData) => {
        console.log('🔵 ========== ADD BUDGET STARTED ==========');
        console.log('📋 Budget data:', newBudgetData);
        
        const { userId } = newBudgetData;
        if (!userId) {
            console.error('🔴 No userId provided');
            throw new Error("User ID is required to add a budget.");
        }
        
        set({ error: null });
        console.log('✅ Cleared error state');

        try {
            const path = `users/${userId}/budgets`;
            console.log('📍 Writing to path:', path);
            
            // 1. Write new document to Firestore
            const docRef = await firestoreService.addDocument(path, newBudgetData);
            console.log('✅ Document added with ID:', docRef.id);
            
            // 2. Force a full refresh to get the new document (with its new ID) and update local state
            console.log('🔄 Forcing refresh...');
            set({ lastFetched: null }); 
            await get().fetchBudgets(userId);
            console.log('✅ Refresh complete');
            console.log('🔵 =======================================\n');

        } catch (err: any) {
            console.error("🔴 Failed to add budget:", err);
            console.error("🔴 Error details:", {
                message: err.message,
                code: err.code,
                stack: err.stack
            });
            set({ error: err.message || "Failed to add budget." });
            console.log('🔵 =======================================\n');
            throw err;
        }
    },

    /**
     * Updates the budget limit in Firestore and triggers a data refresh.
     */
    updateBudget: async (budget, updates) => {
        console.log('🔵 ========== UPDATE BUDGET STARTED ==========');
        console.log('📋 Budget:', budget);
        console.log('📋 Updates:', updates);
        
        set({ error: null });
        const { userId, id: budgetId } = budget;
        if (!userId) throw new Error("User ID is required to update a budget.");

        try {
            // 1. Update document in Firestore
            await firestoreService.updateDocument(
                `users/${userId}/budgets/${budgetId}`,
                updates
            );
            console.log('✅ Budget updated in Firestore');

            // 2. Force a full refresh
            set({ lastFetched: null });
            await get().fetchBudgets(userId);
            console.log('✅ Refresh complete');
            console.log('🔵 =========================================\n');
            
        } catch (err: any) {
            console.error("🔴 Failed to update budget:", err);
            set({ error: err.message || "Failed to update budget." });
            console.log('🔵 =========================================\n');
            throw err;
        }
    },

    /**
     * Deletes the budget document from Firestore and triggers a data refresh.
     */
    deleteBudget: async (budget) => {
        console.log('🔵 ========== DELETE BUDGET STARTED ==========');
        console.log('📋 Budget to delete:', budget);
        
        set({ error: null });
        const { userId, id: budgetId } = budget;
        if (!userId) throw new Error("User ID is required to delete a budget.");

        try {
            // 1. Delete document from Firestore
            await firestoreService.deleteDocument(
                `users/${userId}/budgets/${budgetId}`
            );
            console.log('✅ Budget deleted from Firestore');

            // 2. Force a full refresh
            set({ lastFetched: null });
            await get().fetchBudgets(userId);
            console.log('✅ Refresh complete');
            console.log('🔵 =========================================\n');

        } catch (err: any) {
            console.error("🔴 Failed to delete budget:", err);
            set({ error: err.message || "Failed to delete budget." });
            console.log('🔵 =========================================\n');
            throw err;
        }
    }
}));