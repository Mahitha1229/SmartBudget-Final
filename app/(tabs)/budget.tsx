// SmartBudget/app/(tabs)/budget.tsx
import React, { useState, useEffect, useMemo } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import Svg, { Circle, G } from 'react-native-svg';

import { useBudgetStore, Budget } from '../_lib/useBudgetStore';
import { useAuthStore } from '../_lib/useAuthStore';
import { useThemeStore } from '../_lib/useThemeStore';
import { Colors } from '../../constants/theme';

const { width } = Dimensions.get('window');

// Define gradients inline to ensure proper typing
const GRADIENTS = {
  primary: ['#6366F1', '#8B5CF6', '#A855F7'] as const,
  primaryDark: ['#4F46E5', '#7C3AED', '#C084FC'] as const,
};

// 💎 CIRCULAR PROGRESS COMPONENT
const CircularProgress = ({ 
  size = 120, 
  strokeWidth = 12, 
  progress, 
  color, 
  backgroundColor = '#E2E8F0'
}: {
  size?: number;
  strokeWidth?: number;
  progress: number;
  color: string;
  backgroundColor?: string;
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (circumference * Math.min(progress, 100)) / 100;

  return (
    <Svg width={size} height={size}>
      <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
        <Circle
          stroke={backgroundColor}
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        <Circle
          stroke={color}
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </G>
    </Svg>
  );
};

// 🎯 PREMIUM BUDGET CARD
const PremiumBudgetCard = ({ budget, onPress, theme, isDarkMode }: any) => {
  const progress = budget.limit > 0 ? Math.min((budget.spent / budget.limit) * 100, 100) : 0;
  const isOver = budget.spent > budget.limit;
  const isWarning = progress > 80 && !isOver;
  const remaining = budget.limit - budget.spent;

  const cardColor = isOver ? '#EF4444' : isWarning ? '#F59E0B' : budget.color;

  return (
    <TouchableOpacity 
      onPress={onPress}
      activeOpacity={0.8}
      style={styles.cardWrapper}
    >
      <MotiView
        from={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', damping: 15 }}
      >
        <LinearGradient
          colors={[cardColor + '15', cardColor + '05'] as const}
          style={[
            styles.budgetCard, 
            { 
              borderColor: cardColor + '30',
              backgroundColor: theme.card,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 2,
            }
          ]}
        >
          {/* Left: Progress Circle */}
          <View style={styles.progressSection}>
            <View style={{ position: 'relative' }}>
              <CircularProgress 
                size={100}
                strokeWidth={10}
                progress={progress}
                color={cardColor}
                backgroundColor={theme.border}
              />
              <View style={styles.progressCenter}>
                <Text style={[styles.progressPercent, { color: cardColor }]}>
                  {progress.toFixed(0)}%
                </Text>
              </View>
            </View>
          </View>

          {/* Right: Details */}
          <View style={styles.detailsSection}>
            <View style={styles.categoryHeader}>
              <View style={[styles.categoryIcon, { backgroundColor: cardColor + '20' }]}>
                <Ionicons name={budget.icon} size={24} color={cardColor} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.categoryName, { color: theme.text }]}>
                  {budget.category}
                </Text>
                {isOver && (
                  <View style={styles.statusBadge}>
                    <Ionicons name="warning" size={12} color="#EF4444" />
                    <Text style={styles.statusText}>Over Budget</Text>
                  </View>
                )}
                {isWarning && !isOver && (
                  <View style={[styles.statusBadge, { backgroundColor: '#FEF3C7' }]}>
                    <Ionicons name="alert-circle" size={12} color="#F59E0B" />
                    <Text style={[styles.statusText, { color: '#F59E0B' }]}>Warning</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.amountRow}>
              <View>
                <Text style={[styles.amountLabel, { color: theme.subtext }]}>Spent</Text>
                <Text style={[styles.amountValue, { color: isOver ? '#EF4444' : theme.text }]}>
                  ₹{Math.round(budget.spent).toLocaleString('en-IN')}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.amountLabel, { color: theme.subtext }]}>Limit</Text>
                <Text style={[styles.amountValue, { color: theme.text }]}>
                  ₹{budget.limit.toLocaleString('en-IN')}
                </Text>
              </View>
            </View>

            <View style={styles.remainingRow}>
              <Ionicons 
                name={isOver ? "alert-circle" : "checkmark-circle"} 
                size={16} 
                color={isOver ? "#EF4444" : "#10B981"} 
              />
              <Text style={[styles.remainingText, { color: isOver ? "#EF4444" : theme.subtext }]}>
                {isOver 
                  ? `Over by ₹${Math.abs(remaining).toLocaleString('en-IN')}`
                  : `₹${remaining.toLocaleString('en-IN')} remaining`
                }
              </Text>
            </View>
          </View>
        </LinearGradient>
      </MotiView>
    </TouchableOpacity>
  );
};

// 📊 SUMMARY HEADER
const SummaryHeader = ({ budgets, theme, isDarkMode }: any) => {
  const totalBudget = budgets.reduce((sum: number, b: Budget) => sum + b.limit, 0);
  const totalSpent = budgets.reduce((sum: number, b: Budget) => sum + b.spent, 0);
  const overallProgress = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;
  const exceeded = budgets.filter((b: Budget) => b.spent > b.limit).length;

  return (
    <LinearGradient
      colors={isDarkMode ? GRADIENTS.primaryDark : GRADIENTS.primary}
      style={[
        styles.summaryCard,
        {
          shadowColor: theme.tint,
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 0.3,
          shadowRadius: 24,
          elevation: 8,
        }
      ]}
    >
      <View style={styles.summaryContent}>
        <View style={styles.summaryLeft}>
          <Text style={styles.summaryLabel}>Total Budget</Text>
          <Text style={styles.summaryAmount}>₹{totalBudget.toLocaleString('en-IN')}</Text>
          <Text style={styles.summarySpent}>
            ₹{totalSpent.toLocaleString('en-IN')} spent
          </Text>
        </View>
        
        <View style={styles.summaryRight}>
          <CircularProgress 
            size={100}
            strokeWidth={10}
            progress={overallProgress}
            color="white"
            backgroundColor="rgba(255,255,255,0.2)"
          />
          <View style={styles.summaryProgressCenter}>
            <Text style={styles.summaryProgressText}>
              {overallProgress.toFixed(0)}%
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.summaryFooter}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons 
            name={exceeded > 0 ? "alert-circle" : "checkmark-circle"} 
            size={16} 
            color={exceeded > 0 ? "#FEE2E2" : "#D1FAE5"} 
          />
          <Text style={styles.summaryFooterText}>
            {exceeded > 0 
              ? `${exceeded} budget${exceeded > 1 ? 's' : ''} exceeded`
              : "All budgets on track"}
          </Text>
        </View>
        <View style={styles.budgetCountBadge}>
          <Text style={styles.budgetCountText}>{budgets.length} budgets</Text>
        </View>
      </View>
    </LinearGradient>
  );
};

// 🏠 MAIN SCREEN
export default function PremiumBudgetScreen() {
  const { isDarkMode } = useThemeStore();
  const theme = isDarkMode ? Colors.dark : Colors.light;
  const { user, isLoading: authLoading } = useAuthStore();
  const budgets = useBudgetStore(state => state.budgets);
  const isLoading = useBudgetStore(state => state.isLoading);
  const fetchBudgets = useBudgetStore(state => state.fetchBudgets);

  useEffect(() => {
    if (user?.uid) {
      useBudgetStore.getState().initialize(user.uid);
      fetchBudgets(user.uid);
    }
  }, [user?.uid]);

  if (authLoading || (isLoading && budgets.length === 0)) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.tint} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Budgets</Text>
            <Text style={[styles.headerSubtitle, { color: theme.subtext }]}>
              Track your spending limits
            </Text>
          </View>
          <TouchableOpacity 
            style={[
              styles.addButton,
              {
                shadowColor: theme.tint,
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.15,
                shadowRadius: 16,
                elevation: 5,
              }
            ]}
          >
            <LinearGradient
              colors={isDarkMode ? GRADIENTS.primaryDark : GRADIENTS.primary}
              style={styles.addButtonGradient}
            >
              <Ionicons name="add" size={24} color="white" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* SUMMARY */}
          {budgets.length > 0 && (
            <SummaryHeader budgets={budgets} theme={theme} isDarkMode={isDarkMode} />
          )}

          {/* BUDGETS LIST */}
          <View style={styles.section}>
            {budgets.length === 0 ? (
              <MotiView
                from={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                style={[
                  styles.emptyState, 
                  { 
                    backgroundColor: theme.card,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 8,
                    elevation: 2,
                  }
                ]}
              >
                <LinearGradient
                  colors={isDarkMode ? GRADIENTS.primaryDark : GRADIENTS.primary}
                  style={styles.emptyIcon}
                >
                  <Ionicons name="wallet-outline" size={40} color="white" />
                </LinearGradient>
                <Text style={[styles.emptyTitle, { color: theme.text }]}>
                  No budgets set yet
                </Text>
                <Text style={[styles.emptySubtext, { color: theme.subtext }]}>
                  Create budgets to track your spending limits
                </Text>
                <TouchableOpacity 
                  style={[
                    styles.createButton,
                    {
                      shadowColor: theme.tint,
                      shadowOffset: { width: 0, height: 8 },
                      shadowOpacity: 0.15,
                      shadowRadius: 16,
                      elevation: 5,
                    }
                  ]}
                >
                  <LinearGradient
                    colors={isDarkMode ? GRADIENTS.primaryDark : GRADIENTS.primary}
                    style={styles.createButtonGradient}
                  >
                    <Ionicons name="add-circle" size={20} color="white" />
                    <Text style={styles.createButtonText}>Create Budget</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </MotiView>
            ) : (
              <>
                {budgets.map((budget, index) => (
                  <PremiumBudgetCard 
                    key={budget.id}
                    budget={budget}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      // Handle edit
                    }}
                    theme={theme}
                    isDarkMode={isDarkMode}
                  />
                ))}
              </>
            )}
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: -1.5,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
  },
  addButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  // Summary Card
  summaryCard: {
    borderRadius: 28,
    padding: 24,
    marginBottom: 30,
  },
  summaryContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  summaryLeft: {
    flex: 1,
  },
  summaryLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  summaryAmount: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -1,
    marginBottom: 4,
  },
  summarySpent: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontWeight: '600',
  },
  summaryRight: {
    position: 'relative',
  },
  summaryProgressCenter: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryProgressText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  summaryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
  },
  summaryFooterText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    fontWeight: '700',
  },
  budgetCountBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  budgetCountText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },

  // Budget Cards
  section: {
    gap: 16,
  },
  cardWrapper: {
    marginBottom: 4,
  },
  budgetCard: {
    flexDirection: 'row',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  progressSection: {
    marginRight: 20,
    justifyContent: 'center',
  },
  progressCenter: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressPercent: {
    fontSize: 20,
    fontWeight: '900',
  },
  detailsSection: {
    flex: 1,
    justifyContent: 'space-between',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryName: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '800',
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  amountLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 16,
    fontWeight: '900',
  },
  remainingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  remainingText: {
    fontSize: 13,
    fontWeight: '700',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    padding: 40,
    borderRadius: 28,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 24,
  },
  createButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  createButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
});