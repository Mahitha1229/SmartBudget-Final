// app/_lib/insightsEngine.ts
// 🧠 SMART INSIGHTS ENGINE
// Pure, rule-based analysis over existing transaction/budget data.
// No network calls — runs instantly on whatever data is already loaded,
// so insights stay in sync with the app's real-time listeners for free.

import { Budget } from './useBudgetStore';
import { Transaction } from './useTransactionStore';

export type InsightSeverity = 'positive' | 'warning' | 'critical' | 'neutral';

export interface Insight {
    id: string;
    icon: string;
    title: string;
    message: string;
    severity: InsightSeverity;
}

const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);

const sumExpense = (txns: Transaction[]) =>
    txns.filter(t => t.type === 'debit').reduce((s, t) => s + Math.abs(t.amount), 0);

/**
 * Compares this month's spending per category against last month's and
 * flags categories that jumped by more than `threshold` (default 30%).
 */
function detectCategorySpikes(transactions: Transaction[], threshold = 30): Insight[] {
    const now = new Date();
    const thisMonthStart = startOfMonth(now);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const thisMonthTx = transactions.filter(t => t.type === 'debit' && new Date(t.date) >= thisMonthStart);
    const lastMonthTx = transactions.filter(
        t => t.type === 'debit' && new Date(t.date) >= lastMonthStart && new Date(t.date) <= lastMonthEnd
    );

    const totalsThis: Record<string, number> = {};
    thisMonthTx.forEach(t => { totalsThis[t.category] = (totalsThis[t.category] || 0) + Math.abs(t.amount); });

    const totalsLast: Record<string, number> = {};
    lastMonthTx.forEach(t => { totalsLast[t.category] = (totalsLast[t.category] || 0) + Math.abs(t.amount); });

    const insights: Insight[] = [];

    Object.keys(totalsThis).forEach(category => {
        const thisAmt = totalsThis[category];
        const lastAmt = totalsLast[category] ?? 0;
        if (lastAmt < 100) return; // ignore categories with negligible prior spend — too noisy

        const pctChange = ((thisAmt - lastAmt) / lastAmt) * 100;
        if (pctChange >= threshold) {
            insights.push({
                id: `spike-${category}`,
                icon: 'trending-up',
                title: `${category} spending is up`,
                message: `You've spent ${Math.round(pctChange)}% more on ${category} than last month (₹${Math.round(thisAmt).toLocaleString('en-IN')} vs ₹${Math.round(lastAmt).toLocaleString('en-IN')}).`,
                severity: 'warning',
            });
        } else if (pctChange <= -threshold) {
            insights.push({
                id: `drop-${category}`,
                icon: 'trending-down',
                title: `${category} spending is down`,
                message: `Nice — ${category} spending dropped ${Math.abs(Math.round(pctChange))}% from last month.`,
                severity: 'positive',
            });
        }
    });

    return insights;
}

/**
 * Flags budgets that are over limit or approaching it (>80%).
 */
function detectBudgetWarnings(budgets: Budget[]): Insight[] {
    const insights: Insight[] = [];

    budgets.forEach(budget => {
        if (budget.limit <= 0) return;
        const pct = (budget.spent / budget.limit) * 100;

        if (pct >= 100) {
            insights.push({
                id: `over-${budget.id}`,
                icon: 'alert-circle',
                title: `${budget.category} budget exceeded`,
                message: `You've gone ₹${Math.round(budget.spent - budget.limit).toLocaleString('en-IN')} over your ${budget.category} budget this month.`,
                severity: 'critical',
            });
        } else if (pct >= 80) {
            insights.push({
                id: `warn-${budget.id}`,
                icon: 'warning',
                title: `${budget.category} budget almost used up`,
                message: `You've used ${Math.round(pct)}% of your ${budget.category} budget with ₹${Math.round(budget.limit - budget.spent).toLocaleString('en-IN')} left.`,
                severity: 'warning',
            });
        }
    });

    return insights;
}

/**
 * Flags individual transactions that are unusually large relative to the
 * user's typical transaction size in that category (>2.5x the average).
 */
function detectUnusualTransactions(transactions: Transaction[]): Insight[] {
    const now = new Date();
    const thisMonthStart = startOfMonth(now);
    const recentDebits = transactions.filter(t => t.type === 'debit' && new Date(t.date) >= thisMonthStart);

    const byCategory: Record<string, number[]> = {};
    recentDebits.forEach(t => {
        if (!byCategory[t.category]) byCategory[t.category] = [];
        byCategory[t.category].push(Math.abs(t.amount));
    });

    const insights: Insight[] = [];
    let flaggedCount = 0;

    Object.entries(byCategory).forEach(([category, amounts]) => {
        if (amounts.length < 3) return; // need enough history to judge "unusual"
        const avg = amounts.reduce((s, a) => s + a, 0) / amounts.length;
        const largest = Math.max(...amounts);

        if (largest > avg * 2.5 && flaggedCount < 1) {
            insights.push({
                id: `unusual-${category}`,
                icon: 'flash',
                title: 'Unusual transaction detected',
                message: `A ₹${Math.round(largest).toLocaleString('en-IN')} ${category} transaction is much higher than your usual ₹${Math.round(avg).toLocaleString('en-IN')} average.`,
                severity: 'neutral',
            });
            flaggedCount++;
        }
    });

    return insights;
}

/**
 * Compares this month's savings rate (income - expense) / income to last
 * month's, as an overall financial-health signal.
 */
function detectSavingsRateChange(transactions: Transaction[]): Insight[] {
    const now = new Date();
    const thisMonthStart = startOfMonth(now);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const thisMonthTx = transactions.filter(t => new Date(t.date) >= thisMonthStart);
    const lastMonthTx = transactions.filter(t => new Date(t.date) >= lastMonthStart && new Date(t.date) <= lastMonthEnd);

    const calcRate = (txns: Transaction[]) => {
        const income = txns.filter(t => t.type === 'credit').reduce((s, t) => s + Math.abs(t.amount), 0);
        const expense = sumExpense(txns);
        return income > 0 ? ((income - expense) / income) * 100 : null;
    };

    const thisRate = calcRate(thisMonthTx);
    const lastRate = calcRate(lastMonthTx);

    if (thisRate === null || lastRate === null) return [];

    const diff = thisRate - lastRate;
    if (Math.abs(diff) < 5) return []; // ignore small, noisy fluctuations

    return [{
        id: 'savings-rate',
        icon: diff > 0 ? 'wallet' : 'trending-down',
        title: diff > 0 ? 'Savings rate improving' : 'Savings rate declining',
        message: `You're saving ${Math.round(thisRate)}% of income this month, ${diff > 0 ? 'up' : 'down'} from ${Math.round(lastRate)}% last month.`,
        severity: diff > 0 ? 'positive' : 'warning',
    }];
}

/**
 * Runs all detectors and returns a combined, deduplicated, capped list —
 * ordered by severity so the most important insight shows first.
 */
export function generateInsights(transactions: Transaction[], budgets: Budget[]): Insight[] {
    const all = [
        ...detectBudgetWarnings(budgets),
        ...detectCategorySpikes(transactions),
        ...detectSavingsRateChange(transactions),
        ...detectUnusualTransactions(transactions),
    ];

    const severityOrder: Record<InsightSeverity, number> = { critical: 0, warning: 1, neutral: 2, positive: 3 };
    all.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    return all.slice(0, 6); // cap so the UI doesn't get overwhelming
}