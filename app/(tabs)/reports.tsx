// SmartBudget/app/(tabs)/reports.tsx
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { CATEGORIES } from '../../constants/category';
import { Colors } from '../../constants/theme';
import { useAuthStore } from '../_lib/useAuthStore';
import { useBudgetStore } from '../_lib/useBudgetStore';
import { useThemeStore } from '../_lib/useThemeStore';
import { Transaction, useTransactionData } from '../_lib/useTransactionStore';

const GRADIENTS = {
  primary: ['#6366F1', '#8B5CF6', '#A855F7'] as const,
  primaryDark: ['#4F46E5', '#7C3AED', '#C084FC'] as const,
  success: ['#10B981', '#059669'] as const,
  danger: ['#EF4444', '#DC2626'] as const,
  warning: ['#F59E0B', '#D97706'] as const,
  info: ['#0EA5E9', '#3B82F6'] as const,
};

type ReportPeriod = 'week' | 'month' | 'quarter' | 'year' | 'all';

// 📊 GENERATE REPORT DATA
const generateReportData = (transactions: Transaction[], budgets: any[], period: ReportPeriod) => {
  const now = new Date();
  let startDate: Date;

  switch (period) {
    case 'week':
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
      break;
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'quarter':
      const quarter = Math.floor(now.getMonth() / 3);
      startDate = new Date(now.getFullYear(), quarter * 3, 1);
      break;
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      startDate = new Date(0);
  }

  const filteredTransactions = transactions.filter(t => new Date(t.date) >= startDate);
  
  const totalIncome = filteredTransactions
    .filter(t => t.type === 'credit')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  
  const totalExpense = filteredTransactions
    .filter(t => t.type === 'debit')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const categoryBreakdown = new Map<string, number>();
  filteredTransactions
    .filter(t => t.type === 'debit')
    .forEach(t => {
      const current = categoryBreakdown.get(t.category) || 0;
      categoryBreakdown.set(t.category, current + Math.abs(t.amount));
    });

  const categories = Array.from(categoryBreakdown.entries())
    .map(([name, amount]) => {
      const catInfo = CATEGORIES.find(c => c.name === name);
      return {
        name,
        amount,
        percentage: totalExpense > 0 ? (amount / totalExpense) * 100 : 0,
        icon: catInfo?.icon || 'pie-chart',
        color: catInfo?.color || '#6366F1'
      };
    })
    .sort((a, b) => b.amount - a.amount);

  return {
    period,
    startDate,
    endDate: now,
    totalTransactions: filteredTransactions.length,
    totalIncome,
    totalExpense,
    netSavings: totalIncome - totalExpense,
    categories,
    budgets: budgets.map(b => ({
      category: b.category,
      limit: b.limit,
      spent: b.spent,
      percentage: (b.spent / b.limit) * 100
    })),
    transactions: filteredTransactions
  };
};

// 📄 EXPORT TO CSV
const exportToCSV = async (reportData: any, userName: string) => {
  try {
    const periodLabel = reportData.period.charAt(0).toUpperCase() + reportData.period.slice(1);
    const dateStr = new Date().toISOString().split('T')[0];
    
    let csv = `SmartBudget Report - ${periodLabel}\n`;
    csv += `Generated: ${new Date().toLocaleString()}\n`;
    csv += `User: ${userName}\n`;
    csv += `Period: ${reportData.startDate.toLocaleDateString()} to ${reportData.endDate.toLocaleDateString()}\n\n`;
    
    csv += `SUMMARY\n`;
    csv += `Total Income,₹${reportData.totalIncome.toFixed(2)}\n`;
    csv += `Total Expense,₹${reportData.totalExpense.toFixed(2)}\n`;
    csv += `Net Savings,₹${reportData.netSavings.toFixed(2)}\n`;
    csv += `Total Transactions,${reportData.totalTransactions}\n\n`;
    
    csv += `CATEGORY BREAKDOWN\n`;
    csv += `Category,Amount,Percentage\n`;
    reportData.categories.forEach((cat: any) => {
      csv += `${cat.name},₹${cat.amount.toFixed(2)},${cat.percentage.toFixed(1)}%\n`;
    });
    csv += `\n`;
    
    if (reportData.budgets.length > 0) {
      csv += `BUDGET STATUS\n`;
      csv += `Category,Budget,Spent,Status\n`;
      reportData.budgets.forEach((b: any) => {
        const status = b.percentage > 100 ? 'Over Budget' : b.percentage > 80 ? 'Warning' : 'On Track';
        csv += `${b.category},₹${b.limit.toFixed(2)},₹${b.spent.toFixed(2)},${status}\n`;
      });
      csv += `\n`;
    }
    
    csv += `TRANSACTIONS\n`;
    csv += `Date,Type,Category,Description,Amount\n`;
    reportData.transactions.forEach((t: Transaction) => {
      const amount = t.type === 'debit' ? `-₹${Math.abs(t.amount).toFixed(2)}` : `₹${Math.abs(t.amount).toFixed(2)}`;
      csv += `${new Date(t.date).toLocaleDateString()},${t.type},${t.category},"${t.description || 'N/A'}",${amount}\n`;
    });

    // Share as text
    await Share.share({
      message: csv,
      title: `SmartBudget_${periodLabel}_${dateStr}.csv`
    });

    return true;
  } catch (error) {
    console.error('Export error:', error);
    Alert.alert('Export Failed', 'Unable to export report. Please try again.');
    return false;
  }
};

// 📊 EXPORT TO TEXT SUMMARY
const exportToText = async (reportData: any, userName: string) => {
  try {
    const periodLabel = reportData.period.charAt(0).toUpperCase() + reportData.period.slice(1);
    
    let text = `📊 SMARTBUDGET REPORT\n`;
    text += `${'='.repeat(40)}\n\n`;
    text += `Period: ${periodLabel}\n`;
    text += `Date Range: ${reportData.startDate.toLocaleDateString()} - ${reportData.endDate.toLocaleDateString()}\n`;
    text += `Generated: ${new Date().toLocaleString()}\n`;
    text += `User: ${userName}\n\n`;
    
    text += `💰 FINANCIAL SUMMARY\n`;
    text += `${'-'.repeat(40)}\n`;
    text += `Total Income:     ₹${reportData.totalIncome.toLocaleString('en-IN', { minimumFractionDigits: 2 })}\n`;
    text += `Total Expense:    ₹${reportData.totalExpense.toLocaleString('en-IN', { minimumFractionDigits: 2 })}\n`;
    text += `Net Savings:      ₹${reportData.netSavings.toLocaleString('en-IN', { minimumFractionDigits: 2 })}\n`;
    text += `Transactions:     ${reportData.totalTransactions}\n\n`;
    
    text += `📈 TOP SPENDING CATEGORIES\n`;
    text += `${'-'.repeat(40)}\n`;
    reportData.categories.slice(0, 5).forEach((cat: any, i: number) => {
      text += `${i + 1}. ${cat.name.padEnd(15)} ₹${cat.amount.toLocaleString('en-IN')} (${cat.percentage.toFixed(1)}%)\n`;
    });
    
    if (reportData.budgets.length > 0) {
      text += `\n🎯 BUDGET STATUS\n`;
      text += `${'-'.repeat(40)}\n`;
      reportData.budgets.forEach((b: any) => {
        const emoji = b.percentage > 100 ? '❌' : b.percentage > 80 ? '⚠️' : '✅';
        text += `${emoji} ${b.category}: ${b.percentage.toFixed(0)}% used (₹${b.spent.toLocaleString('en-IN')} / ₹${b.limit.toLocaleString('en-IN')})\n`;
      });
    }

    await Share.share({
      message: text,
      title: `SmartBudget ${periodLabel} Report`
    });

    return true;
  } catch (error) {
    console.error('Share error:', error);
    return false;
  }
};

// 📊 6-MONTH TREND BAR CHART (animated)
const MonthlyBarChart = ({ data, theme }: any) => {
  const maxValue = Math.max(...data.map((d: any) => d.expense), 1);
  const barAreaHeight = 120;

  return (
    <View style={[styles.categoryItem, { flexDirection: 'column', alignItems: 'stretch', backgroundColor: theme.card }]}>
      <Text style={[styles.sectionTitle, { color: theme.text, fontSize: 16, marginBottom: 16 }]}>
        6-Month Trend
      </Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        {data.map((month: any, idx: number) => {
          const barHeight = (month.expense / maxValue) * barAreaHeight;
          const isCurrentMonth = idx === data.length - 1;
          return (
            <View key={month.label + idx} style={{ alignItems: 'center', flex: 1 }}>
              <Text style={{ fontSize: 9, fontWeight: '700', color: theme.subtext, marginBottom: 4, height: 12 }}>
                {month.expense > 0 ? `${Math.round(month.expense / 1000)}k` : ''}
              </Text>
              <View style={{ height: barAreaHeight, justifyContent: 'flex-end' }}>
                <MotiView
                  from={{ height: 0 }}
                  animate={{ height: Math.max(barHeight, 4) }}
                  transition={{ type: 'timing', duration: 700, delay: idx * 80 }}
                  style={{
                    width: 18,
                    borderRadius: 6,
                    backgroundColor: isCurrentMonth ? theme.tint : theme.tint + '55',
                  }}
                />
              </View>
              <Text style={{ fontSize: 11, fontWeight: '700', color: isCurrentMonth ? theme.text : theme.subtext, marginTop: 6 }}>
                {month.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

// 🍩 CATEGORY DONUT (visual complement to the detailed list below it)
const CategoryDonut = ({ categories, theme }: any) => {
  const size = 160;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const total = categories.reduce((s: number, c: any) => s + c.amount, 0);
  let cumulative = 0;

  return (
    <View style={[styles.categoryItem, { flexDirection: 'column', alignItems: 'center', backgroundColor: theme.card }]}>
      <Text style={[styles.sectionTitle, { color: theme.text, fontSize: 16, marginBottom: 16, alignSelf: 'flex-start' }]}>
        Spending Split
      </Text>
      <MotiView
        from={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', damping: 14 }}
        style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}
      >
        <Svg width={size} height={size}>
          <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
            {categories.map((cat: any) => {
              const segLength = total > 0 ? (cat.amount / total) * circumference : 0;
              const dashOffset = -cumulative;
              cumulative += segLength;
              return (
                <Circle
                  key={cat.name}
                  cx={size / 2} cy={size / 2} r={radius}
                  stroke={cat.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${segLength} ${circumference - segLength}`}
                  strokeDashoffset={dashOffset}
                  fill="none"
                  strokeLinecap={categories.length === 1 ? 'butt' : 'round'}
                />
              );
            })}
          </G>
        </Svg>
        <View style={{ position: 'absolute', alignItems: 'center' }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: theme.subtext }}>Total</Text>
          <Text style={{ fontSize: 16, fontWeight: '900', color: theme.text }}>
            ₹{total >= 1000 ? `${(total / 1000).toFixed(1)}k` : Math.round(total)}
          </Text>
        </View>
      </MotiView>
    </View>
  );
};

// 📋 REPORT SUMMARY CARD
const ReportSummaryCard = ({ label, value, icon, gradient, theme }: any) => (
  <View style={[styles.summaryCard, { backgroundColor: theme.card }]}>
    <LinearGradient colors={gradient} style={styles.summaryIcon}>
      <Ionicons name={icon} size={24} color="white" />
    </LinearGradient>
    <Text style={[styles.summaryLabel, { color: theme.subtext }]}>{label}</Text>
    <Text style={[styles.summaryValue, { color: theme.text }]}>{value}</Text>
  </View>
);

// 🏠 MAIN SCREEN
export default function ReportsScreen() {
  const { isDarkMode } = useThemeStore();
  const theme = isDarkMode ? Colors.dark : Colors.light;
  
  const { user } = useAuthStore();
  const { transactions, isLoading, currentBalance, totalIncome, totalExpense } = useTransactionData();
  const budgets = useBudgetStore(state => state.budgets);
  
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>('month');
  const [isExporting, setIsExporting] = useState(false);

    const reportData = useMemo(() => 
    generateReportData(transactions, budgets, selectedPeriod),
    [transactions, budgets, selectedPeriod]
  );

  // Fixed 6-month trend, independent of the period selector above —
  // used only for the bar chart, so switching periods doesn't distort it.
  const monthlyTrend = useMemo(() => {
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ year: d.getFullYear(), month: d.getMonth(), label: d.toLocaleDateString('en-IN', { month: 'short' }) });
    }
    return months.map((m) => {
      const monthExpense = transactions
        .filter(t => {
          const td = new Date(t.date);
          return t.type === 'debit' && td.getFullYear() === m.year && td.getMonth() === m.month;
        })
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      return { label: m.label, expense: monthExpense };
    });
  }, [transactions]);

  const handleExportCSV = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsExporting(true);
    await exportToCSV(reportData, user?.displayName || user?.email || 'User');
    setIsExporting(false);
  };

  const handleExportText = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsExporting(true);
    await exportToText(reportData, user?.displayName || user?.email || 'User');
    setIsExporting(false);
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.tint} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Reports</Text>
            <Text style={[styles.headerSubtitle, { color: theme.subtext }]}>
              {reportData.startDate.toLocaleDateString()} - {reportData.endDate.toLocaleDateString()}
            </Text>
          </View>
        </View>

        {/* PERIOD SELECTOR */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.periodScroll}
        >
          {(['week', 'month', 'quarter', 'year', 'all'] as ReportPeriod[]).map(period => (
            <TouchableOpacity
              key={period}
              onPress={() => {
                setSelectedPeriod(period);
                Haptics.selectionAsync();
              }}
              style={[
                styles.periodButton,
                { backgroundColor: theme.card },
                selectedPeriod === period && { backgroundColor: theme.tint }
              ]}
            >
              <Text style={[
                styles.periodText,
                { color: selectedPeriod === period ? 'white' : theme.subtext }
              ]}>
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* SUMMARY CARDS */}
          <View style={styles.summaryGrid}>
            <ReportSummaryCard
              label="Income"
              value={`₹${reportData.totalIncome.toLocaleString('en-IN')}`}
              icon="arrow-down-circle"
              gradient={GRADIENTS.success}
              theme={theme}
            />
            <ReportSummaryCard
              label="Expense"
              value={`₹${reportData.totalExpense.toLocaleString('en-IN')}`}
              icon="arrow-up-circle"
              gradient={GRADIENTS.danger}
              theme={theme}
            />
            <ReportSummaryCard
              label="Net Savings"
              value={`₹${reportData.netSavings.toLocaleString('en-IN')}`}
              icon="wallet"
              gradient={reportData.netSavings >= 0 ? GRADIENTS.info : GRADIENTS.warning}
              theme={theme}
            />
            <ReportSummaryCard
              label="Transactions"
              value={reportData.totalTransactions.toString()}
              icon="receipt"
              gradient={isDarkMode ? GRADIENTS.primaryDark : GRADIENTS.primary}
              theme={theme}
            />
                    </View>

          {monthlyTrend.some(m => m.expense > 0) && (
            <View style={{ marginBottom: 16 }}>
              <MonthlyBarChart data={monthlyTrend} theme={theme} />
            </View>
          )}

          {reportData.categories.length > 0 && (
            <View style={{ marginBottom: 25 }}>
              <CategoryDonut categories={reportData.categories} theme={theme} />
            </View>
          )}

          {/* EXPORT BUTTONS */}
          <View style={styles.exportSection}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Export Report</Text>
            
            <TouchableOpacity
              onPress={handleExportCSV}
              disabled={isExporting}
              style={styles.exportButton}
            >
              <LinearGradient
                colors={isDarkMode ? GRADIENTS.primaryDark : GRADIENTS.primary}
                style={styles.exportButtonGradient}
              >
                <Ionicons name="document-text" size={24} color="white" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.exportButtonTitle}>Export as CSV</Text>
                  <Text style={styles.exportButtonSubtitle}>Full detailed report</Text>
                </View>
                <Ionicons name="download" size={20} color="white" />
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleExportText}
              disabled={isExporting}
              style={styles.exportButton}
            >
              <LinearGradient
                colors={GRADIENTS.info}
                style={styles.exportButtonGradient}
              >
                <Ionicons name="share-social" size={24} color="white" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.exportButtonTitle}>Share Summary</Text>
                  <Text style={styles.exportButtonSubtitle}>Quick text overview</Text>
                </View>
                <Ionicons name="arrow-forward" size={20} color="white" />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* CATEGORY BREAKDOWN */}
          {reportData.categories.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Category Breakdown</Text>
              
              {reportData.categories.map((cat: any, index: number) => (
                <MotiView
                  key={cat.name}
                  from={{ opacity: 0, translateX: -20 }}
                  animate={{ opacity: 1, translateX: 0 }}
                  transition={{ type: 'timing', delay: index * 50 }}
                >
                  <View style={[styles.categoryItem, { backgroundColor: theme.card }]}>
                    <View style={[styles.categoryIconBox, { backgroundColor: cat.color + '20' }]}>
                      <Ionicons name={cat.icon} size={24} color={cat.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={styles.categoryItemHeader}>
                        <Text style={[styles.categoryName, { color: theme.text }]}>{cat.name}</Text>
                        <Text style={[styles.categoryAmount, { color: theme.text }]}>
                          ₹{cat.amount.toLocaleString('en-IN')}
                        </Text>
                      </View>
                      <View style={[styles.categoryBar, { backgroundColor: theme.border + '30' }]}>
                        <View style={[styles.categoryBarFill, { width: `${cat.percentage}%`, backgroundColor: cat.color }]} />
                      </View>
                      <Text style={[styles.categoryPercentage, { color: theme.subtext }]}>
                        {cat.percentage.toFixed(1)}% of total
                      </Text>
                    </View>
                  </View>
                </MotiView>
              ))}
            </View>
          )}

          {/* BUDGET STATUS */}
          {reportData.budgets.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Budget Status</Text>
              
              {reportData.budgets.map((budget: any, index: number) => {
                const status = budget.percentage > 100 ? 'Over' : budget.percentage > 80 ? 'Warning' : 'Good';
                const statusColor = budget.percentage > 100 ? '#EF4444' : budget.percentage > 80 ? '#F59E0B' : '#10B981';
                
                return (
                  <MotiView
                    key={budget.category}
                    from={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'timing', delay: index * 50 }}
                  >
                    <View style={[styles.budgetItem, { backgroundColor: theme.card }]}>
                      <View style={styles.budgetHeader}>
                        <Text style={[styles.budgetCategory, { color: theme.text }]}>{budget.category}</Text>
                        <View style={[styles.budgetStatusBadge, { backgroundColor: statusColor + '20' }]}>
                          <Text style={[styles.budgetStatusText, { color: statusColor }]}>{status}</Text>
                        </View>
                      </View>
                      <Text style={[styles.budgetAmount, { color: theme.subtext }]}>
                        ₹{budget.spent.toLocaleString('en-IN')} / ₹{budget.limit.toLocaleString('en-IN')}
                      </Text>
                      <View style={[styles.budgetBar, { backgroundColor: theme.border + '30' }]}>
                        <View style={[
                          styles.budgetBarFill, 
                          { width: `${Math.min(budget.percentage, 100)}%`, backgroundColor: statusColor }
                        ]} />
                      </View>
                      <Text style={[styles.budgetPercentage, { color: statusColor }]}>
                        {budget.percentage.toFixed(0)}% used
                      </Text>
                    </View>
                  </MotiView>
                );
              })}
            </View>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    marginTop: 10,
  },
  headerTitle: { fontSize: 34, fontWeight: '900', letterSpacing: -1.5, marginBottom: 4 },
  headerSubtitle: { fontSize: 14, fontWeight: '600' },

  periodScroll: { paddingHorizontal: 20, paddingBottom: 20, gap: 10 },
  periodButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  periodText: { fontSize: 14, fontWeight: '800' },

  scrollContent: { paddingHorizontal: 20 },

  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 25,
  },
  summaryCard: {
    width: '48%',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: { fontSize: 12, fontWeight: '700', marginBottom: 4 },
  summaryValue: { fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },

  exportSection: { marginBottom: 25 },
  sectionTitle: { fontSize: 20, fontWeight: '900', marginBottom: 16, letterSpacing: -0.5 },
  
  exportButton: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  exportButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    gap: 14,
  },
  exportButtonTitle: { color: 'white', fontSize: 16, fontWeight: '800', marginBottom: 2 },
  exportButtonSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '600' },

  section: { marginBottom: 25 },

  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  categoryIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  categoryName: { fontSize: 15, fontWeight: '800' },
  categoryAmount: { fontSize: 15, fontWeight: '900' },
  categoryBar: { height: 6, borderRadius: 3, marginBottom: 6, overflow: 'hidden' },
  categoryBarFill: { height: '100%', borderRadius: 3 },
  categoryPercentage: { fontSize: 11, fontWeight: '700' },

  budgetItem: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  budgetCategory: { fontSize: 16, fontWeight: '800' },
  budgetStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  budgetStatusText: { fontSize: 11, fontWeight: '800' },
  budgetAmount: { fontSize: 13, fontWeight: '600', marginBottom: 10 },
  budgetBar: { height: 8, borderRadius: 4, marginBottom: 8, overflow: 'hidden' },
  budgetBarFill: { height: '100%', borderRadius: 4 },
  budgetPercentage: { fontSize: 12, fontWeight: '800' },
});