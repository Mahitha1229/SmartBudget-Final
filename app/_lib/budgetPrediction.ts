// SmartBudget/app/_lib/budgetPrediction.ts
// 📊 BUDGET PREDICTION SERVICE

import { Transaction } from './useTransactionStore';
import { Budget } from './useBudgetStore';

export interface MonthlySpending {
  month: string; // "2024-01", "2024-02", etc.
  year: number;
  monthNumber: number;
  amount: number;
  transactionCount: number;
}

export interface BudgetPrediction {
  category: string;
  currentLimit: number;
  currentSpent: number;
  suggestedBudget: number;
  historicalAverage: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
}

/**
 * Calculate historical monthly spending for a category
 */
export const getHistoricalSpending = (
  transactions: Transaction[],
  category: string,
  monthsBack: number = 3
): MonthlySpending[] => {
  const now = new Date();
  const months: MonthlySpending[] = [];
  
  // Generate last N months
  for (let i = 0; i < monthsBack; i++) {
    const targetDate = new Date(now.getFullYear(), now.getMonth() - i - 1, 1);
    const year = targetDate.getFullYear();
    const monthNumber = targetDate.getMonth();
    const monthKey = `${year}-${String(monthNumber + 1).padStart(2, '0')}`;
    
    // Filter transactions for this category and month
    const monthTransactions = transactions.filter(t => {
      if (t.category !== category) return false;
      if (t.type !== 'debit') return false;
      
      const txDate = new Date(t.date);
      return txDate.getFullYear() === year && txDate.getMonth() === monthNumber;
    });
    
    const totalAmount = monthTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    months.push({
      month: monthKey,
      year,
      monthNumber,
      amount: totalAmount,
      transactionCount: monthTransactions.length
    });
  }
  
  return months.reverse(); // Oldest first
};

/**
 * Calculate suggested budget using weighted average
 * Recent months get more weight
 */
export const calculateSuggestedBudget = (historicalSpending: MonthlySpending[]): number => {
  if (historicalSpending.length === 0) return 0;
  
  // Single month: Use with 10% buffer
  if (historicalSpending.length === 1) {
    return Math.round(historicalSpending[0].amount * 1.1);
  }
  
  // Multiple months: Weighted average
  // Weights: [0.5, 0.3, 0.2] for last 3 months
  const weights = [0.2, 0.3, 0.5]; // Oldest to newest
  
  const weightedSum = historicalSpending.reduce((sum, data, idx) => {
    const weight = weights[Math.min(idx, weights.length - 1)] || 0.33;
    return sum + (data.amount * weight);
  }, 0);
  
  // Add 10% safety buffer
  return Math.round(weightedSum * 1.1);
};

/**
 * Detect spending trend
 */
export const detectTrend = (historicalSpending: MonthlySpending[]): 'increasing' | 'decreasing' | 'stable' => {
  if (historicalSpending.length < 2) return 'stable';
  
  const amounts = historicalSpending.map(h => h.amount);
  const firstHalf = amounts.slice(0, Math.floor(amounts.length / 2));
  const secondHalf = amounts.slice(Math.floor(amounts.length / 2));
  
  const firstAvg = firstHalf.reduce((s, a) => s + a, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((s, a) => s + a, 0) / secondHalf.length;
  
  if (secondAvg > firstAvg * 1.15) return 'increasing';
  if (secondAvg < firstAvg * 0.85) return 'decreasing';
  return 'stable';
};

/**
 * Calculate confidence level based on data quality
 */
export const calculateConfidence = (historicalSpending: MonthlySpending[]): 'high' | 'medium' | 'low' => {
  if (historicalSpending.length >= 3) return 'high';
  if (historicalSpending.length === 2) return 'medium';
  return 'low';
};

/**
 * Generate all budget predictions
 */
export const generateBudgetPredictions = (
  budgets: Budget[],
  transactions: Transaction[]
): BudgetPrediction[] => {
  return budgets.map(budget => {
    const historical = getHistoricalSpending(transactions, budget.category, 3);
    const suggested = calculateSuggestedBudget(historical);
    const average = historical.length > 0
      ? historical.reduce((sum, h) => sum + h.amount, 0) / historical.length
      : 0;
    const trend = detectTrend(historical);
    const confidence = calculateConfidence(historical);
    
    let reasoning = '';
    if (confidence === 'high') {
      reasoning = `Based on ${historical.length} months average of ₹${Math.round(average).toLocaleString('en-IN')} + 10% buffer`;
    } else if (confidence === 'medium') {
      reasoning = `Based on ${historical.length} months data, with safety buffer`;
    } else {
      reasoning = `Insufficient data - suggestion based on current spending`;
    }
    
    return {
      category: budget.category,
      currentLimit: budget.limit,
      currentSpent: budget.spent,
      suggestedBudget: suggested,
      historicalAverage: average,
      trend,
      confidence,
      reasoning
    };
  });
};

/**
 * Get prediction for a specific category
 */
export const getPredictionForCategory = (
  category: string,
  budgets: Budget[],
  transactions: Transaction[]
): BudgetPrediction | null => {
  const budget = budgets.find(b => b.category === category);
  if (!budget) return null;
  
  const historical = getHistoricalSpending(transactions, category, 3);
  const suggested = calculateSuggestedBudget(historical);
  const average = historical.length > 0
    ? historical.reduce((sum, h) => sum + h.amount, 0) / historical.length
    : 0;
  
  return {
    category,
    currentLimit: budget.limit,
    currentSpent: budget.spent,
    suggestedBudget: suggested,
    historicalAverage: average,
    trend: detectTrend(historical),
    confidence: calculateConfidence(historical),
    reasoning: `Based on ${historical.length} months average spending`
  };
};

/**
 * Check if budget needs adjustment
 */
export const needsBudgetAdjustment = (prediction: BudgetPrediction): boolean => {
  const difference = Math.abs(prediction.suggestedBudget - prediction.currentLimit);
  const percentChange = (difference / prediction.currentLimit) * 100;
  
  // Suggest adjustment if difference is more than 20%
  return percentChange > 20;
};