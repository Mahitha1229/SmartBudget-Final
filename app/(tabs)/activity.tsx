// SmartBudget/app/(tabs)/activity-premium.tsx
import React, { useEffect, useState, useMemo } from "react";
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl, TouchableOpacity, TextInput, Platform, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Haptics from 'expo-haptics';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';

import { useTransactionStore, useTransactionData, Transaction } from '../_lib/useTransactionStore'; 
import { useAuthStore } from '../_lib/useAuthStore'; 
import { useThemeStore } from '../_lib/useThemeStore';
import { Colors } from '../../constants/theme';
import { CATEGORIES } from '../../constants/category';

const GRADIENTS = {
  primary: ['#6366F1', '#8B5CF6', '#A855F7'] as const,
  primaryDark: ['#4F46E5', '#7C3AED', '#C084FC'] as const,
  success: ['#10B981', '#059669'] as const,
  danger: ['#EF4444', '#DC2626'] as const,
};

const CATEGORY_MAP: { [key: string]: { icon: keyof typeof Ionicons.glyphMap, gradient: readonly [string, string] } } = {
  'Food': { icon: 'restaurant', gradient: ['#F59E0B', '#EF4444'] as const },
  'Travel': { icon: 'airplane', gradient: ['#0EA5E9', '#8B5CF6'] as const },
  'Bills': { icon: 'receipt', gradient: ['#8B5CF6', '#6366F1'] as const },
  'Shopping': { icon: 'cart', gradient: ['#EC4899', '#F97316'] as const },
  'Entertainment': { icon: 'game-controller', gradient: ['#EF4444', '#EC4899'] as const },
  'Other': { icon: 'ellipse', gradient: ['#64748B', '#475569'] as const },
};

// 💳 PREMIUM TRANSACTION CARD
const PremiumTransactionCard = ({ 
  transaction, 
  theme, 
  isDarkMode, 
  isLast,
  isSelectionMode,
  isSelected,
  onSelect,
  onLongPress
}: any) => {
  const isIncome = transaction.type === 'credit';
  const catBase = CATEGORY_MAP[transaction.category] || CATEGORY_MAP['Other'];
  
  const formattedDate = new Date(transaction.date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });
  
  const handlePress = () => {
    if (isSelectionMode) {
      onSelect(transaction.id);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      Haptics.selectionAsync();
      router.push({ 
        pathname: '/edit_transaction' as any, 
        params: { ...transaction, date: new Date(transaction.date).toISOString() }
      });
    }
  };
  
  return (
    <TouchableOpacity 
      onPress={handlePress}
      onLongPress={() => {
        onLongPress();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }}
      activeOpacity={0.7} 
      style={[
        styles.transactionCard,
        { 
          backgroundColor: theme.card,
          borderColor: theme.border,
        },
        isSelected && { 
          backgroundColor: theme.tint + '15',
          borderColor: theme.tint + '50',
        }
      ]}
    >
      {isSelectionMode && (
        <View style={[styles.checkbox, { borderColor: isSelected ? theme.tint : theme.border }]}>
          {isSelected && (
            <LinearGradient
              colors={isDarkMode ? GRADIENTS.primaryDark : GRADIENTS.primary}
              style={styles.checkboxFilled}
            >
              <Ionicons name="checkmark" size={16} color="white" />
            </LinearGradient>
          )}
        </View>
      )}

      <LinearGradient
        colors={catBase.gradient}
        style={styles.transactionIcon}
      >
        <Ionicons name={catBase.icon} size={22} color="white" />
      </LinearGradient>

      <View style={styles.transactionDetails}>
        <Text style={[styles.transactionDesc, { color: theme.text }]} numberOfLines={1}>
          {transaction.description}
        </Text>
        <View style={styles.transactionMeta}>
          <View style={[styles.categoryBadge, { backgroundColor: theme.border + '40' }]}>
            <Text style={[styles.categoryBadgeText, { color: theme.subtext }]}>
              {transaction.category}
            </Text>
          </View>
          <Text style={[styles.transactionDate, { color: theme.subtext }]}>
            • {formattedDate}
          </Text>
        </View>
      </View>

      <View style={styles.amountContainer}>
        <Text style={[
          styles.transactionAmount, 
          { color: isIncome ? '#10B981' : '#EF4444' }
        ]}>
          {isIncome ? '+' : '-'}₹{Math.abs(transaction.amount).toLocaleString('en-IN')}
        </Text>
        {!isSelectionMode && (
          <Ionicons name="chevron-forward" size={14} color={theme.subtext} style={{ marginTop: 2 }} />
        )}
      </View>
    </TouchableOpacity>
  );
};

// 📊 STATS SUMMARY CARD
const StatsSummaryCard = ({ stats, theme, isDarkMode }: any) => (
  <MotiView
    from={{ opacity: 0, translateY: -10 }}
    animate={{ opacity: 1, translateY: 0 }}
    transition={{ type: 'spring', damping: 15 }}
  >
    <LinearGradient
      colors={isDarkMode ? ['#1e293b', '#334155'] as const : ['#f8fafc', '#f1f5f9'] as const}
      style={styles.statsCard}
    >
      <View style={styles.statItem}>
        <LinearGradient
          colors={GRADIENTS.success}
          style={styles.statIconCircle}
        >
          <Ionicons name="arrow-down" size={18} color="white" />
        </LinearGradient>
        <View>
          <Text style={[styles.statLabel, { color: theme.subtext }]}>Income</Text>
          <Text style={[styles.statValue, { color: '#10B981' }]}>
            ₹{stats.income.toLocaleString('en-IN')}
          </Text>
        </View>
      </View>

      <View style={[styles.statDivider, { backgroundColor: theme.border }]} />

      <View style={styles.statItem}>
        <LinearGradient
          colors={GRADIENTS.danger}
          style={styles.statIconCircle}
        >
          <Ionicons name="arrow-up" size={18} color="white" />
        </LinearGradient>
        <View>
          <Text style={[styles.statLabel, { color: theme.subtext }]}>Expense</Text>
          <Text style={[styles.statValue, { color: '#EF4444' }]}>
            ₹{stats.expense.toLocaleString('en-IN')}
          </Text>
        </View>
      </View>
    </LinearGradient>
  </MotiView>
);

export default function PremiumActivityScreen() {
  const user = useAuthStore(state => state.user);
  const authLoading = useAuthStore(state => state.isLoading);
  const { isDarkMode } = useThemeStore();
  const theme = isDarkMode ? Colors.dark : Colors.light;

  const { transactions, isLoading } = useTransactionData();
  const fetchTransactions = useTransactionStore(state => state.fetchTransactions);
  const deleteTransaction = useTransactionStore(state => state.deleteTransaction);
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  
  // Selection mode
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    let filtered = transactions;

    if (searchQuery.trim()) {
      filtered = filtered.filter(t => 
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(t => t.category === selectedCategory);
    }

    if (dateRange.start) {
      filtered = filtered.filter(t => new Date(t.date) >= dateRange.start!);
    }
    if (dateRange.end) {
      const endOfDay = new Date(dateRange.end);
      endOfDay.setHours(23, 59, 59, 999);
      filtered = filtered.filter(t => new Date(t.date) <= endOfDay);
    }

    return filtered;
  }, [transactions, searchQuery, selectedCategory, dateRange]);

  // Group by date
  const groupedTransactions = useMemo(() => {
    return filteredTransactions.reduce((groups: { [key: string]: Transaction[] }, transaction) => {
      const dateKey = new Date(transaction.date).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric'
      });
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(transaction);
      return groups;
    }, {});
  }, [filteredTransactions]);

  // Stats
  const stats = useMemo(() => {
    const expense = filteredTransactions.filter(t => t.type === 'debit').reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const income = filteredTransactions.filter(t => t.type === 'credit').reduce((sum, t) => sum + Math.abs(t.amount), 0);
    return { expense, income, count: filteredTransactions.length };
  }, [filteredTransactions]);

  useEffect(() => {
    if (!authLoading && user?.uid) {
      fetchTransactions(user.uid);
    }
  }, [authLoading, user?.uid]);

  const onRefresh = async () => {
    if (!user?.uid) return;
    setIsRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await fetchTransactions(user.uid);
    setIsRefreshing(false);
  };

  const clearFilters = () => {
    setSelectedCategory(null);
    setDateRange({ start: null, end: null });
    setSearchQuery("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const activeFilters = [selectedCategory, dateRange.start, dateRange.end].filter(Boolean).length;

  const enterSelectionMode = () => {
    setIsSelectionMode(true);
    setSelectedIds(new Set());
  };

  const exitSelectionMode = () => {
    setIsSelectionMode(false);
    setSelectedIds(new Set());
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    const allIds = new Set(filteredTransactions.map(t => t.id));
    setSelectedIds(allIds);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleDelete = async () => {
    if (selectedIds.size === 0) return;

    Alert.alert(
      "Delete Transactions",
      `Delete ${selectedIds.size} transaction${selectedIds.size > 1 ? 's' : ''}? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setIsDeleting(true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            
            try {
              const deletePromises = Array.from(selectedIds).map(id => deleteTransaction(id));
              await Promise.all(deletePromises);
              
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              exitSelectionMode();
            } catch (error) {
              Alert.alert("Error", "Failed to delete some transactions.");
            } finally {
              setIsDeleting(false);
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={['top']}>
      {/* HEADER */}
      <View style={styles.header}>
        {isSelectionMode ? (
          <>
            <View>
              <Text style={[styles.headerTitle, { color: theme.text, fontSize: 24 }]}>
                {selectedIds.size} Selected
              </Text>
              <Text style={[styles.headerSubtitle, { color: theme.subtext }]}>
                Tap transactions to select
              </Text>
            </View>
            <TouchableOpacity 
              style={[styles.headerButton, { backgroundColor: theme.card }]}
              onPress={exitSelectionMode}
            >
              <Ionicons name="close" size={20} color={theme.text} />
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View>
              <Text style={[styles.headerTitle, { color: theme.text }]}>Activity</Text>
              <Text style={[styles.headerSubtitle, { color: theme.subtext }]}>
                {stats.count} transactions
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity 
                style={[styles.headerButton, { backgroundColor: theme.card }]}
                onPress={() => {
                  enterSelectionMode();
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }}
              >
                <Ionicons name="checkmark-circle-outline" size={20} color={theme.text} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.headerButton, 
                  { 
                    backgroundColor: theme.card,
                    borderWidth: activeFilters > 0 ? 2 : 0,
                    borderColor: theme.tint
                  }
                ]}
                onPress={() => {
                  setShowFilters(!showFilters);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Ionicons name="options-outline" size={20} color={activeFilters > 0 ? theme.tint : theme.text} />
                {activeFilters > 0 && (
                  <View style={[styles.filterBadge, { backgroundColor: theme.tint }]}>
                    <Text style={styles.filterBadgeText}>{activeFilters}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      {/* SELECTION BAR */}
      {isSelectionMode && (
        <MotiView
          from={{ opacity: 0, translateY: -10 }}
          animate={{ opacity: 1, translateY: 0 }}
          style={styles.selectionBar}
        >
          <View style={[styles.selectionBarContainer, { backgroundColor: theme.card }]}>
            <TouchableOpacity 
              style={styles.selectionBarButton}
              onPress={selectedIds.size === filteredTransactions.length ? deselectAll : selectAll}
            >
              <Ionicons 
                name={selectedIds.size === filteredTransactions.length ? "checkbox" : "square-outline"} 
                size={20} 
                color={theme.text} 
              />
              <Text style={[styles.selectionBarText, { color: theme.text }]}>
                {selectedIds.size === filteredTransactions.length ? 'Deselect All' : 'Select All'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.deleteButton, { opacity: selectedIds.size === 0 ? 0.5 : 1 }]}
              onPress={handleDelete}
              disabled={selectedIds.size === 0 || isDeleting}
            >
              {isDeleting ? (
                <ActivityIndicator color="#EF4444" size="small" />
              ) : (
                <>
                  <Ionicons name="trash" size={20} color="#EF4444" />
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </MotiView>
      )}

      {/* STATS BAR */}
      {!isSelectionMode && (
        <View style={styles.statsBarContainer}>
          <StatsSummaryCard stats={stats} theme={theme} isDarkMode={isDarkMode} />
        </View>
      )}

      {/* SEARCH BAR */}
      {!isSelectionMode && (
        <View style={styles.searchContainer}>
          <View style={[styles.searchBar, { backgroundColor: theme.card }]}>
            <Ionicons name="search" size={18} color={theme.subtext} />
            <TextInput
              placeholder="Search transactions..."
              placeholderTextColor={theme.subtext}
              style={[styles.searchInput, { color: theme.text }]}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={18} color={theme.subtext} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* FILTER PANEL */}
      {showFilters && !isSelectionMode && (
        <MotiView
          from={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          style={[styles.filterPanel, { backgroundColor: theme.card }]}
        >
          <View style={styles.filterHeader}>
            <Text style={[styles.filterTitle, { color: theme.text }]}>Filters</Text>
            {activeFilters > 0 && (
              <TouchableOpacity onPress={clearFilters}>
                <Text style={[styles.clearButton, { color: theme.tint }]}>Clear All</Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={[styles.filterLabel, { color: theme.subtext }]}>CATEGORY</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
            <TouchableOpacity
              style={[
                styles.categoryChip,
                { borderColor: theme.border },
                !selectedCategory && { backgroundColor: theme.tint, borderColor: theme.tint }
              ]}
              onPress={() => setSelectedCategory(null)}
            >
              <Text style={[styles.categoryChipText, { color: !selectedCategory ? '#FFFFFF' : theme.text }]}>
                All
              </Text>
            </TouchableOpacity>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.name}
                style={[
                  styles.categoryChip,
                  { borderColor: theme.border },
                  selectedCategory === cat.name && { 
                    backgroundColor: cat.color, 
                    borderColor: cat.color 
                  }
                ]}
                onPress={() => {
                  setSelectedCategory(selectedCategory === cat.name ? null : cat.name);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Ionicons 
                  name={cat.icon as any} 
                  size={16} 
                  color={selectedCategory === cat.name ? '#FFFFFF' : cat.color} 
                />
                <Text style={[
                  styles.categoryChipText, 
                  { color: selectedCategory === cat.name ? '#FFFFFF' : theme.text }
                ]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </MotiView>
      )}

      {/* TRANSACTION LIST */}
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={theme.tint} />
        }
      >
        {isLoading && transactions.length === 0 ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={theme.tint} />
          </View>
        ) : filteredTransactions.length === 0 ? (
          <MotiView 
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            style={[styles.emptyContainer, { backgroundColor: theme.card }]}
          >
            <LinearGradient
              colors={isDarkMode ? GRADIENTS.primaryDark : GRADIENTS.primary}
              style={styles.emptyIcon}
            >
              <Ionicons name={searchQuery || activeFilters > 0 ? "search-outline" : "receipt-outline"} size={32} color="white" />
            </LinearGradient>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              {searchQuery || activeFilters > 0 ? "No matches found" : "No transactions yet"}
            </Text>
            <Text style={[styles.emptySub, { color: theme.subtext }]}>
              {searchQuery || activeFilters > 0 ? "Try adjusting your filters" : "Start tracking your finances"}
            </Text>
            {(searchQuery || activeFilters > 0) && (
              <TouchableOpacity 
                style={[styles.clearFiltersButton, { backgroundColor: theme.tint }]}
                onPress={clearFilters}
              >
                <Text style={styles.clearFiltersButtonText}>Clear Filters</Text>
              </TouchableOpacity>
            )}
          </MotiView>
        ) : (
          Object.keys(groupedTransactions).map((date, dateIndex) => (
            <MotiView
              key={date}
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', delay: dateIndex * 50 }}
              style={styles.dateSection}
            >
              <Text style={[styles.dateHeader, { color: theme.subtext }]}>{date}</Text>
              <View style={styles.transactionsGroup}>
                {groupedTransactions[date].map((tx, index) => (
                  <PremiumTransactionCard 
                    key={tx.id} 
                    transaction={tx} 
                    theme={theme} 
                    isDarkMode={isDarkMode}
                    isLast={index === groupedTransactions[date].length - 1}
                    isSelectionMode={isSelectionMode}
                    isSelected={selectedIds.has(tx.id)}
                    onSelect={toggleSelection}
                    onLongPress={enterSelectionMode}
                  />
                ))}
              </View>
            </MotiView>
          ))
        )}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* DATE PICKERS */}
      {showStartPicker && (
        <DateTimePicker
          value={dateRange.start || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(e, d) => {
            setShowStartPicker(false);
            if (d) setDateRange({ ...dateRange, start: d });
          }}
        />
      )}
      {showEndPicker && (
        <DateTimePicker
          value={dateRange.end || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(e, d) => {
            setShowEndPicker(false);
            if (d) setDateRange({ ...dateRange, end: d });
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingTop: 10,
    marginBottom: 15
  },
  headerTitle: { fontSize: 34, fontWeight: "900", letterSpacing: -1.5, marginBottom: 4 },
  headerSubtitle: { fontSize: 13, fontWeight: "700" },
  headerButton: { 
    width: 44, 
    height: 44, 
    borderRadius: 15, 
    justifyContent: 'center', 
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    position: 'relative'
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF'
  },
  filterBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900'
  },

  selectionBar: { paddingHorizontal: 20, marginBottom: 15 },
  selectionBarContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  selectionBarButton: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  selectionBarText: { fontSize: 15, fontWeight: '800', letterSpacing: -0.3 },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#FEE2E2'
  },
  deleteButtonText: { color: '#EF4444', fontSize: 15, fontWeight: '900', letterSpacing: -0.3 },

  statsBarContainer: { paddingHorizontal: 20, marginBottom: 15 },
  statsCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  statIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statLabel: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', marginBottom: 4, letterSpacing: 0.5 },
  statValue: { fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
  statDivider: { width: 1, marginHorizontal: 16 },

  searchContainer: { paddingHorizontal: 20, marginBottom: 15 },
  searchBar: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    height: 50, 
    borderRadius: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  searchInput: { flex: 1, fontSize: 16, fontWeight: '600' },

  filterPanel: {
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  filterHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  filterTitle: { fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
  clearButton: { fontSize: 14, fontWeight: '800' },
  filterLabel: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', marginBottom: 12, letterSpacing: 0.5 },
  categoryScroll: { marginBottom: 20 },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    marginRight: 8
  },
  categoryChipText: { fontSize: 13, fontWeight: '800', letterSpacing: -0.3 },

  scrollContent: { paddingHorizontal: 20, paddingTop: 5, paddingBottom: 40 },
  dateSection: { marginBottom: 25 },
  dateHeader: { 
    fontSize: 12, 
    fontWeight: "900", 
    textTransform: 'uppercase', 
    letterSpacing: 1.5, 
    marginBottom: 12, 
    marginLeft: 4 
  },
  transactionsGroup: { gap: 12 },
  transactionCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxFilled: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center'
  },
  transactionIcon: { 
    width: 48, 
    height: 48, 
    borderRadius: 16, 
    justifyContent: 'center', 
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  transactionDetails: { flex: 1 },
  transactionDesc: { fontSize: 16, fontWeight: '800', marginBottom: 6, letterSpacing: -0.3 },
  transactionMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryBadgeText: { fontSize: 11, fontWeight: '700' },
  transactionDate: { fontSize: 11, fontWeight: '600' },
  amountContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  transactionAmount: { fontSize: 17, fontWeight: '900', letterSpacing: -0.5 },

  centerContainer: { marginTop: 100, alignItems: 'center' },
  emptyContainer: { 
    alignItems: 'center', 
    padding: 40, 
    borderRadius: 28, 
    marginTop: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyTitle: { fontSize: 20, fontWeight: '900', marginBottom: 8, letterSpacing: -0.5 },
  emptySub: { fontSize: 14, textAlign: 'center', marginBottom: 20, lineHeight: 20 },
  clearFiltersButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  clearFiltersButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' }
});