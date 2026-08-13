// SmartBudget/app/_lib/useTransactionStore.ts - WITH DEBUGGING
import { collection, doc, getFirestore, writeBatch } from 'firebase/firestore';
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
    fetchTransactions: (userId: string | null) => Promise<void>; 
    addTransaction: (newTransaction: TransactionInput, userId: string | null) => Promise<void>;
    addTransactionsBatch: (transactions: TransactionInput[], userId: string) => Promise<void>;
    updateTransaction: (updatedTransaction: Transaction) => Promise<void>;
    deleteTransaction: (id: string) => Promise<void>;
    clearTransactions: (userId: string | null) => Promise<void>;
}

export const useTransactionStore = create<TransactionStore>((set, get) => ({
    transactions: [],
    isLoading: false,
    isInitialized: false,
    error: null,

    fetchTransactions: async (userId: string | null) => {
        console.log('\n💳 ========== FETCH TRANSACTIONS STARTED ==========');
        console.log('👤 User ID:', userId);
        
        if (!userId) {
            console.log('⚠️ No userId provided, clearing transactions');
            set({ transactions: [], isLoading: false, isInitialized: true });
            console.log('💳 ================================================\n');
            return;
        }
        
        console.log('🔄 Fetching transactions from Firestore...');
        set({ isLoading: true, error: null });
        
        try {
            const data: Transaction[] = await firestoreService.fetchTransactions(userId);
            console.log(`✅ Fetched ${data.length} transactions from Firestore`);
            
            if (data.length > 0) {
                console.log('📝 Sample transactions (first 3):');
                data.slice(0, 3).forEach((tx, i) => {
                    console.log(`   ${i + 1}. ${tx.category}: ${tx.amount} (type: ${tx.type}, date: ${tx.date})`);
                });
                
                console.log('\n📊 All transaction categories:', 
                    [...new Set(data.map(t => t.category))].join(', '));
                
                console.log('📊 All transaction types:', 
                    [...new Set(data.map(t => t.type))].join(', '));
                
                console.log('📊 Amount range:', {
                    min: Math.min(...data.map(t => t.amount)),
                    max: Math.max(...data.map(t => t.amount)),
                    negative: data.filter(t => t.amount < 0).length,
                    positive: data.filter(t => t.amount > 0).length
                });
            }
            
            const sortedData = data.sort((a, b) => b.date.getTime() - a.date.getTime());
            
            console.log('✅ Transactions sorted by date');
            set({ 
                transactions: sortedData, 
                isLoading: false,
                isInitialized: true
            });
            console.log('✅ Transaction store state updated');
            console.log('💳 ================================================\n');
        } catch (err: any) {
            console.error('🔴 Error fetching transactions:', err);
            set({ 
                error: err.message, 
                isLoading: false,
                isInitialized: true
            });
            console.log('💳 ================================================\n');
        }
    },

    addTransaction: async (transactionData, userId) => {
        console.log('\n💳 ========== ADD TRANSACTION STARTED ==========');
        console.log('📋 Transaction data:', transactionData);
        console.log('👤 User ID:', userId);
        
        if (!userId) {
            console.error('🔴 No user authenticated');
            throw new Error("User not authenticated.");
        }
        
        set({ isLoading: true });
        
        try {
            console.log('🔄 Saving transaction to Firestore...');
            const savedTransaction = await firestoreService.addTransaction({
                ...transactionData,
                userId
            } as ImportedTransaction);
            
            console.log('✅ Transaction saved:', savedTransaction);
            console.log('📝 Saved transaction details:', {
                id: savedTransaction.id,
                category: savedTransaction.category,
                amount: savedTransaction.amount,
                type: savedTransaction.type,
                date: savedTransaction.date
            });

            const currentTransactions = get().transactions;
            console.log(`📊 Current transactions in store: ${currentTransactions.length}`);
            
            const newTransactions = [savedTransaction, ...currentTransactions];
            const sortedTransactions = newTransactions.sort((a, b) => b.date.getTime() - a.date.getTime());
            
            console.log(`📊 New transaction count: ${sortedTransactions.length}`);
            console.log('✅ Updating transaction store...');
            
            set({
                transactions: sortedTransactions,
                isLoading: false
            });
            
            console.log('✅ Transaction store updated - this should trigger budget recalculation!');
            console.log('💳 ==============================================\n');
        } catch (err: any) {
            console.error('🔴 Failed to add transaction:', err);
            set({ error: err.message, isLoading: false });
            console.log('💳 ==============================================\n');
            throw err;
        }
    },

    addTransactionsBatch: async (transactionsData, userId) => {
        console.log('\n💳 ========== ADD BATCH TRANSACTIONS STARTED ==========');
        console.log(`📋 Adding ${transactionsData.length} transactions`);
        console.log('👤 User ID:', userId);
        
        if (!userId) {
            console.error('🔴 No user authenticated');
            throw new Error("User not authenticated.");
        }
        
        set({ isLoading: true });
        const db = getFirestore();
        const batch = writeBatch(db);
        const newTransactions: Transaction[] = [];

        try {
            console.log('🔄 Creating batch write...');
            transactionsData.forEach((data, index) => {
                const docRef = doc(collection(db, "transactions"));
                const fullTransaction = {
                    ...data,
                    id: docRef.id,
                    userId,
                    createdAt: new Date(),
                };
                batch.set(docRef, fullTransaction);
                newTransactions.push(fullTransaction as Transaction);
                
                if (index < 3) {
                    console.log(`   ${index + 1}. ${data.category}: ${data.amount}`);
                }
            });

            console.log('🔄 Committing batch...');
            await batch.commit();
            console.log('✅ Batch committed successfully');

            const currentTransactions = get().transactions;
            const allTransactions = [...newTransactions, ...currentTransactions];
            const sortedTransactions = allTransactions.sort((a, b) => b.date.getTime() - a.date.getTime());
            
            console.log(`📊 New transaction count: ${sortedTransactions.length}`);
            
            set({
                transactions: sortedTransactions,
                isLoading: false
            });
            
            console.log('✅ Transaction store updated with batch');
            console.log('💳 =====================================================\n');
        } catch (err: any) {
            console.error('🔴 Failed to add batch transactions:', err);
            set({ error: err.message, isLoading: false });
            console.log('💳 =====================================================\n');
            throw err;
        }
    },

    updateTransaction: async (updatedTransaction) => {
        console.log('\n💳 ========== UPDATE TRANSACTION STARTED ==========');
        console.log('📋 Updated transaction:', updatedTransaction);
        
        set({ isLoading: true });
        
        try {
            console.log('🔄 Updating transaction in Firestore...');
            const saved = await firestoreService.updateTransaction(updatedTransaction);
            console.log('✅ Transaction updated in Firestore');
            
            const currentTransactions = get().transactions;
            const updatedTransactions = currentTransactions
                .map(t => t.id === saved.id ? saved : t)
                .sort((a, b) => b.date.getTime() - a.date.getTime());
            
            set({
                transactions: updatedTransactions,
                isLoading: false
            });
            
            console.log('✅ Transaction store updated');
            console.log('💳 =================================================\n');
        } catch (err: any) {
            console.error('🔴 Failed to update transaction:', err);
            set({ error: err.message, isLoading: false });
            console.log('💳 =================================================\n');
        }
    },

    deleteTransaction: async (id) => {
        console.log('\n💳 ========== DELETE TRANSACTION STARTED ==========');
        console.log('🗑️  Transaction ID:', id);
        
        try {
            console.log('🔄 Deleting from Firestore...');
            await firestoreService.deleteTransaction(id);
            console.log('✅ Transaction deleted from Firestore');
            
            const currentTransactions = get().transactions;
            const filteredTransactions = currentTransactions.filter(t => t.id !== id);
            
            console.log(`📊 Transactions before: ${currentTransactions.length}`);
            console.log(`📊 Transactions after: ${filteredTransactions.length}`);
            
            set({
                transactions: filteredTransactions
            });
            
            console.log('✅ Transaction store updated');
            console.log('💳 =================================================\n');
        } catch (err: any) {
            console.error('🔴 Failed to delete transaction:', err);
            set({ error: err.message });
            console.log('💳 =================================================\n');
        }
    },

    clearTransactions: async (userId) => {
        console.log('\n💳 ========== CLEAR TRANSACTIONS STARTED ==========');
        console.log('👤 User ID:', userId);
        
        if (!userId) {
            console.log('⚠️ No userId provided, skipping clear');
            console.log('💳 =================================================\n');
            return;
        }
        
        const db = getFirestore();
        const batch = writeBatch(db);
        const currentTransactions = get().transactions;
        
        console.log(`🗑️  Clearing ${currentTransactions.length} transactions`);

        try {
            set({ isLoading: true });
            
            currentTransactions.forEach((txn) => {
                const docRef = doc(db, "transactions", txn.id);
                batch.delete(docRef);
            });
            
            console.log('🔄 Committing batch delete...');
            await batch.commit();
            console.log('✅ All transactions deleted from Firestore');
            
            set({ transactions: [], isLoading: false });
            console.log('✅ Transaction store cleared');
            console.log('💳 =================================================\n');
        } catch (err: any) {
            console.error('🔴 Failed to clear transactions:', err);
            set({ error: "Failed to clear history.", isLoading: false });
            console.log('💳 =================================================\n');
        }
    }
}));

export const useTransactionData = () => {
    const { transactions, isLoading, isInitialized, error } = useTransactionStore();

    return useMemo(() => {
        console.log('\n📈 ========== TRANSACTION DATA CALCULATION ==========');
        console.log(`📊 isInitialized: ${isInitialized}`);
        console.log(`📊 isLoading: ${isLoading}`);
        console.log(`📊 Transaction count: ${transactions.length}`);
        
        // Don't calculate anything until initialized
        if (!isInitialized) {
            console.log('⚠️ Not initialized yet, returning empty data');
            console.log('📈 ==================================================\n');
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

        console.log('💰 Income:', totalIncome);
        console.log('💸 Expense:', totalExpense);
        console.log('💵 Balance:', totalIncome - totalExpense);

        const categoryTotals = transactions
            .filter(t => t.type === 'debit')
            .reduce((acc: Record<string, number>, t) => {
                acc[t.category] = (acc[t.category] || 0) + Math.abs(t.amount);
                return acc;
            }, {});

        console.log('📊 Category totals:', categoryTotals);

        const chartData = Object.keys(categoryTotals).map((cat, index) => ({
            value: categoryTotals[cat],
            text: cat,
            color: ['#0EA5E9', '#F59E0B', '#10B981', '#EF4444', '#6366F1', '#EC4899'][index % 6]
        }));

        console.log('✅ Transaction data calculated successfully');
        console.log('📈 ==================================================\n');

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