// SmartBudget/app/(tabs)/index.tsx
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from "expo-router";
import { MotiView } from 'moti';
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle } from 'react-native-svg';

import { Colors } from '../../constants/theme';
import { generateInsights, Insight } from '../_lib/insightsEngine';
import { useAuthStore } from '../_lib/useAuthStore';
import { useBudgetStore } from '../_lib/useBudgetStore';
import { useGoalsStore } from '../_lib/useGoalsStore';
import { useThemeStore } from '../_lib/useThemeStore';
import { useTransactionData, useTransactionStore } from '../_lib/useTransactionStore';

const { width } = Dimensions.get('window');
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// ────────────────────────────────────────────────────────────
// 🔢 COUNT-UP HOOK — animates any number from its previous value
// to a new target whenever the target changes (e.g. balance
// updating live from a Firestore snapshot).
// ────────────────────────────────────────────────────────────
function useCountUp(target: number, duration = 700) {
  const [display, setDisplay] = useState(target);
  const fromRef = useRef(target);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const from = fromRef.current;
    const to = target;
    if (from === to) return;

    const start = Date.now();
    const animate = () => {
      const elapsed = Date.now() - start;
      const t = Math.min(elapsed / duration, 1);
      // easeOutCubic — fast start, gentle settle
      const eased = 1 - Math.pow(1 - t, 3);
      const value = from + (to - from) * eased;
      setDisplay(value);

      if (t < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        fromRef.current = to;
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration]);

  return display;
}

// ────────────────────────────────────────────────────────────
// 💀 SKELETON LOADER — shimmering placeholder shown until the
// first real-time snapshot arrives, instead of a blank spinner.
// ────────────────────────────────────────────────────────────
const SkeletonBlock = ({ style, theme }: any) => (
  <MotiView
    style={[{ backgroundColor: theme.border, borderRadius: 12, overflow: 'hidden' }, style]}
    from={{ opacity: 0.4 }}
    animate={{ opacity: 1 }}
    transition={{ type: 'timing', duration: 800, loop: true }}
  />
);

const DashboardSkeleton = ({ theme }: any) => (
  <View style={{ paddingHorizontal: 20, paddingTop: 10 }}>
    <SkeletonBlock theme={theme} style={{ height: 220, borderRadius: 32, marginBottom: 25 }} />
    <SkeletonBlock theme={theme} style={{ height: 20, width: 140, marginBottom: 16 }} />
    <SkeletonBlock theme={theme} style={{ height: 90, borderRadius: 24, marginBottom: 25 }} />
    <SkeletonBlock theme={theme} style={{ height: 20, width: 140, marginBottom: 16 }} />
    <View style={{ flexDirection: 'row', gap: 12 }}>
      <SkeletonBlock theme={theme} style={{ height: 130, width: 120, borderRadius: 20 }} />
      <SkeletonBlock theme={theme} style={{ height: 130, width: 120, borderRadius: 20 }} />
      <SkeletonBlock theme={theme} style={{ height: 130, width: 120, borderRadius: 20 }} />
    </View>
  </View>
);

// ✨ BALANCE CARD WITH GLASSMORPHISM + COUNT-UP
const BalanceCard = ({ balance, income, expense, theme }: any) => {
  const [hideBalance, setHideBalance] = useState(false);
  const animatedBalance = useCountUp(balance);
  const animatedIncome = useCountUp(income);
  const animatedExpense = useCountUp(expense);

  const netChange = income - expense;
  const netLabel = netChange >= 0 ? 'Net saved this month' : 'Net overspend this month';

  return (
    <MotiView
      from={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', damping: 18 }}
    >
      <LinearGradient
        colors={theme.primaryGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.balanceCard, theme.shadow.large]}
      >
        <View style={styles.decorativeCircle1} />
        <View style={styles.decorativeCircle2} />

        <View style={styles.balanceHeader}>
          <View>
            <Text style={styles.balanceLabel}>Total Balance</Text>
            <TouchableOpacity style={styles.accountBadge}>
              <Ionicons name="diamond" size={12} color="#FFD700" />
              <Text style={styles.accountText}>Standard</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setHideBalance(prev => !prev);
            }}
          >
            <Ionicons name={hideBalance ? "eye-off" : "eye"} size={20} color="rgba(255,255,255,0.9)" />
          </TouchableOpacity>
        </View>

        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 200 }}
        >
          <Text style={styles.balanceAmount}>
            {hideBalance ? '₹ • • • • • •' : `₹${Math.round(animatedBalance).toLocaleString('en-IN')}`}
          </Text>
          <Text style={styles.balanceChange}>
            <Ionicons
              name={netChange >= 0 ? "trending-up" : "trending-down"}
              size={12}
              color={netChange >= 0 ? "#10B981" : "#FCA5A5"}
            />
            {' '}{netLabel}: {hideBalance ? '••••' : `₹${Math.abs(netChange).toLocaleString('en-IN')}`}
          </Text>
        </MotiView>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <View style={styles.statIconWrapper}>
              <Ionicons name="arrow-down-circle" size={16} color="#10B981" />
            </View>
            <View>
              <Text style={styles.statLabel}>Income</Text>
              <Text style={styles.statValue}>
                {hideBalance ? '••••' : `₹${Math.round(animatedIncome).toLocaleString('en-IN')}`}
              </Text>
            </View>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <View style={styles.statIconWrapper}>
              <Ionicons name="arrow-up-circle" size={16} color="#EF4444" />
            </View>
            <View>
              <Text style={styles.statLabel}>Expense</Text>
              <Text style={styles.statValue}>
                {hideBalance ? '••••' : `₹${Math.round(animatedExpense).toLocaleString('en-IN')}`}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickActionBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/add-transaction');
            }}
          >
            <Ionicons name="add-circle" size={20} color="white" />
            <Text style={styles.quickActionText}>Add</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/import-screen');
            }}
          >
            <Ionicons name="download" size={20} color="white" />
            <Text style={styles.quickActionText}>Import</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/(tabs)/reports');
            }}
          >
            <Ionicons name="bar-chart" size={20} color="white" />
            <Text style={styles.quickActionText}>Reports</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </MotiView>
  );
};

// 💡 WALLET GOALS WIDGET — ring now animates its fill on mount/update
const GoalWidget = ({ goal, theme, onAddContribution }: any) => {
  const progress = goal ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100) : 0;
  const size = 80;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    animatedProgress.value = withTiming(progress, {
      duration: 900,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress]);

  const animatedCircleProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference - (circumference * animatedProgress.value) / 100,
  }));

  if (!goal) return null;

  return (
    <TouchableOpacity
      style={[styles.goalCard, { backgroundColor: theme.card }, theme.shadow.small]}
      onPress={() => onAddContribution(goal)}
      activeOpacity={0.7}
    >
      <View style={styles.goalContent}>
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <View style={[styles.goalIconCircle, { backgroundColor: `${goal.color}20` }]}>
              <Ionicons name={goal.icon} size={16} color={goal.color} />
            </View>
            <Text style={[styles.goalTitle, { color: theme.text }]}>{goal.name}</Text>
          </View>
          <Text style={[styles.goalSubtitle, { color: theme.subtext }]}>
            ₹{goal.currentAmount.toLocaleString('en-IN')} of ₹{goal.targetAmount.toLocaleString('en-IN')}
          </Text>
          <View style={styles.goalProgress}>
            <View style={[styles.goalBar, { backgroundColor: theme.border }]}>
              <MotiView
                from={{ width: '0%' }}
                animate={{ width: `${progress}%` }}
                transition={{ type: 'timing', duration: 900, easing: (t) => 1 - Math.pow(1 - t, 3) }}
                style={[styles.goalBarFill, { backgroundColor: goal.color }]}
              />
            </View>
          </View>
        </View>

        <View style={styles.goalCircle}>
          <Svg width={size} height={size}>
            <Circle
              stroke={theme.border}
              fill="none"
              cx={size / 2}
              cy={size / 2}
              r={radius}
              strokeWidth={strokeWidth}
            />
            <AnimatedCircle
              stroke={goal.color}
              fill="none"
              cx={size / 2}
              cy={size / 2}
              r={radius}
              strokeWidth={strokeWidth}
              strokeDasharray={`${circumference} ${circumference}`}
              animatedProps={animatedCircleProps}
              strokeLinecap="round"
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          </Svg>
          <View style={styles.goalPercentage}>
            <Text style={[styles.goalPercentText, { color: theme.text }]}>{Math.round(progress)}%</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// 🎯 BUDGET STATUS MINI CARDS — bar fills on mount now
const BudgetMiniCard = ({ budget, theme }: any) => {
  const progress = Math.min((budget.spent / budget.limit) * 100, 100);
  const isOver = budget.spent > budget.limit;

  return (
    <View style={[styles.miniCard, { backgroundColor: theme.card }, theme.shadow.small]}>
      <View style={[styles.miniIconCircle, { backgroundColor: `${budget.color}20` }]}>
        <Ionicons name={budget.icon} size={20} color={budget.color} />
      </View>
      <Text style={[styles.miniLabel, { color: theme.text }]}>{budget.category}</Text>
      <Text style={[styles.miniAmount, { color: isOver ? '#EF4444' : theme.subtext }]}>
        ₹{Math.round(budget.spent).toLocaleString()}
      </Text>
      <View style={[styles.miniProgress, { backgroundColor: theme.border }]}>
        <MotiView
          from={{ width: '0%' }}
          animate={{ width: `${progress}%` }}
          transition={{ type: 'timing', duration: 800, easing: (t) => 1 - Math.pow(1 - t, 3) }}
          style={[styles.miniProgressFill, { backgroundColor: isOver ? '#EF4444' : budget.color }]}
        />
      </View>
    </View>
  );
};

// 🧠 INSIGHT CARD
const INSIGHT_COLORS: Record<string, [string, string]> = {
  critical: ['#F87171', '#EF4444'],
  warning: ['#FBBF24', '#F59E0B'],
  positive: ['#34D399', '#10B981'],
  neutral: ['#818CF8', '#6366F1'],
};

const InsightCard = ({ insight, theme, index }: { insight: Insight; theme: any; index: number }) => {
  const colors = INSIGHT_COLORS[insight.severity] as [string, string];
  return (
    <MotiView
      from={{ opacity: 0, translateX: 20 }}
      animate={{ opacity: 1, translateX: 0 }}
      transition={{ type: 'timing', duration: 350, delay: index * 100 }}
      style={styles.insightCard}
    >
      <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.insightGradient}>
        <View style={styles.insightIconWrap}>
          <Ionicons name={insight.icon as any} size={20} color="white" />
        </View>
        <Text style={styles.insightTitle}>{insight.title}</Text>
        <Text style={styles.insightMessage} numberOfLines={3}>{insight.message}</Text>
      </LinearGradient>
    </MotiView>
  );
};

// 🔥 TRENDING TRANSACTION CARD
const TrendingCard = ({ transaction, theme, index }: any) => (
  <MotiView
    from={{ opacity: 0, translateX: -20 }}
    animate={{ opacity: 1, translateX: 0 }}
    transition={{ delay: index * 80, type: 'timing', duration: 350 }}
    style={[styles.trendCard, { backgroundColor: theme.card, borderColor: theme.border }]}
  >
    <LinearGradient
      colors={transaction.type === 'credit' ? ['#10B981', '#059669'] as const : ['#EF4444', '#DC2626'] as const}
      style={styles.trendIcon}
    >
      <Ionicons
        name={transaction.type === 'credit' ? 'trending-down' : 'trending-up'}
        size={18}
        color="white"
      />
    </LinearGradient>
    <View style={{ flex: 1 }}>
      <Text style={[styles.trendDesc, { color: theme.text }]} numberOfLines={1}>
        {transaction.description}
      </Text>
      <Text style={[styles.trendCat, { color: theme.subtext }]}>
        {transaction.category} • {new Date(transaction.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
      </Text>
    </View>
    <Text style={[
      styles.trendAmount,
      { color: transaction.type === 'credit' ? '#10B981' : '#EF4444' }
    ]}>
      {transaction.type === 'credit' ? '+' : '-'}₹{Math.abs(transaction.amount).toLocaleString('en-IN')}
    </Text>
  </MotiView>
);

// 🏠 MAIN HOME SCREEN
export default function PremiumDashboard() {
  const user = useAuthStore(state => state.user);
  const isAuthInitialized = useAuthStore(state => state.isInitialized);
  const { isDarkMode } = useThemeStore();
  const theme = isDarkMode ? Colors.dark : Colors.light;
  const fetchTransactions = useTransactionStore(state => state.fetchTransactions);

  const {
    transactions,
    isLoading,
    isInitialized: isDataInitialized,
    currentBalance,
    totalIncome,
    totalExpense,
  } = useTransactionData();

  const budgets = useBudgetStore(state => state.budgets);
  const goals = useGoalsStore(state => state.goals);
  const insights = React.useMemo(() => generateInsights(transactions, budgets), [transactions, budgets]);
  const addContribution = useGoalsStore(state => state.addContribution);
  const addGoal = useGoalsStore(state => state.addGoal);

  const [showContributionModal, setShowContributionModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<any>(null);
  const [contributionAmount, setContributionAmount] = useState('');

  const [showAddGoalModal, setShowAddGoalModal] = useState(false);
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState('');

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user?.uid && isAuthInitialized) {
      fetchTransactions(user.uid);
      useGoalsStore.getState().initialize(user.uid);
      useBudgetStore.getState().initialize(user.uid);
    }
  }, [user?.uid, isAuthInitialized]);

  // Transactions, budgets, and goals are all live via onSnapshot now, so
  // pull-to-refresh has nothing left to manually fetch — it's kept purely
  // as tactile confirmation that "everything is current."
  const handleRefresh = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 400);
  };

  const handleAddContribution = (goal: any) => {
    setSelectedGoal(goal);
    setShowContributionModal(true);
  };

  const handleSubmitContribution = async () => {
    if (!selectedGoal || !contributionAmount || !user?.uid) return;

    const amount = parseFloat(contributionAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await addContribution(selectedGoal.id, user.uid, amount);
      Alert.alert('Success', `Added ₹${amount.toLocaleString('en-IN')} to ${selectedGoal.name}!`);
      setShowContributionModal(false);
      setContributionAmount('');
      setSelectedGoal(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to add contribution');
    }
  };

  const handleCreateGoal = async () => {
    if (!newGoalName || !newGoalTarget || !user?.uid) return;

    const target = parseFloat(newGoalTarget);
    if (isNaN(target) || target <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid target amount');
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await addGoal({
        userId: user.uid,
        name: newGoalName,
        targetAmount: target,
        icon: 'flag',
        color: '#0EA5E9',
      });
      Alert.alert('Success', `Goal "${newGoalName}" created!`);
      setShowAddGoalModal(false);
      setNewGoalName('');
      setNewGoalTarget('');
    } catch (error) {
      Alert.alert('Error', 'Failed to create goal');
    }
  };

  const userName = user?.displayName?.split(' ')[0] || 'Friend';
  const greeting = new Date().getHours() < 12 ? 'Good Morning' : new Date().getHours() < 18 ? 'Good Afternoon' : 'Good Evening';

  const showSkeleton = !isAuthInitialized || (isLoading && !isDataInitialized);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greetingText, { color: theme.subtext }]}>{greeting}</Text>
            <Text style={[styles.nameText, { color: theme.text }]}>{userName} 👋</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity style={[styles.headerBtn, { backgroundColor: theme.card }]}>
              <Ionicons name="notifications" size={20} color={theme.text} />
              <MotiView
                style={styles.notificationDot}
                from={{ opacity: 0.5, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1.15 }}
                transition={{ type: 'timing', duration: 900, loop: true }}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.headerBtn, { backgroundColor: theme.card }]}
              onPress={() => router.push('/(tabs)/profile')}
            >
              <Ionicons name="person" size={20} color={theme.text} />
            </TouchableOpacity>
          </View>
        </View>

        {showSkeleton ? (
          <DashboardSkeleton theme={theme} />
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={theme.tint}
                colors={[theme.tint]}
              />
            }
          >
            {/* BALANCE CARD */}
            <BalanceCard
              balance={currentBalance}
              income={totalIncome}
              expense={totalExpense}
              theme={theme}
            />

            {/* SMART INSIGHTS */}
            {insights.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>Smart Insights</Text>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 12, paddingRight: 20 }}
                >
                  {insights.map((insight, idx) => (
                    <InsightCard key={insight.id} insight={insight} theme={theme} index={idx} />
                  ))}
                </ScrollView>
              </View>
            )}

            {/* WALLET GOALS */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Wallet Goals</Text>
                <TouchableOpacity onPress={() => setShowAddGoalModal(true)}>
                  <Text style={[styles.seeAll, { color: theme.tint }]}>+ Add Goal</Text>
                </TouchableOpacity>
              </View>
              {goals.length === 0 ? (
                <TouchableOpacity
                  style={[styles.emptyGoalState, { backgroundColor: theme.card }]}
                  onPress={() => setShowAddGoalModal(true)}
                >
                  <Ionicons name="flag-outline" size={40} color={theme.subtext} />
                  <Text style={[styles.emptyText, { color: theme.text }]}>No goals yet</Text>
                  <Text style={[styles.emptySubtext, { color: theme.subtext }]}>
                    Tap to create your first savings goal
                  </Text>
                </TouchableOpacity>
              ) : (
                <GoalWidget goal={goals[0]} theme={theme} onAddContribution={handleAddContribution} />
              )}
            </View>

            {/* BUDGET OVERVIEW */}
            {budgets.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>Budget Status</Text>
                  <TouchableOpacity onPress={() => router.push('/(tabs)/budget')}>
                    <Text style={[styles.seeAll, { color: theme.tint }]}>Manage</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.miniCardsScroll}
                >
                  {budgets.slice(0, 4).map((budget) => (
                    <BudgetMiniCard key={budget.id} budget={budget} theme={theme} />
                  ))}
                </ScrollView>
              </View>
            )}

            {/* AI ASSISTANT BANNER */}
            <TouchableOpacity
              onPress={() => router.push('/buddy-ai')}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#818CF8', '#C084FC'] as const}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.aiBanner, theme.shadow.medium]}
              >
                <View style={styles.aiIcon}>
                  <Ionicons name="sparkles" size={24} color="white" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.aiTitle}>Chat with Buddy AI</Text>
                  <Text style={styles.aiSubtitle}>Get personalized financial advice</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
              </LinearGradient>
            </TouchableOpacity>

            {/* TRENDING TRANSACTIONS */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Activity</Text>
                <TouchableOpacity onPress={() => router.push('/(tabs)/activity')}>
                  <Text style={[styles.seeAll, { color: theme.tint }]}>See All</Text>
                </TouchableOpacity>
              </View>
              {transactions.length === 0 ? (
                <View style={[styles.emptyState, { backgroundColor: theme.card }]}>
                  <Ionicons name="wallet-outline" size={48} color={theme.subtext} />
                  <Text style={[styles.emptyText, { color: theme.text }]}>No transactions yet</Text>
                  <Text style={[styles.emptySubtext, { color: theme.subtext }]}>
                    Start tracking your finances
                  </Text>
                </View>
              ) : (
                <View>
                  {transactions.slice(0, 5).map((tx, idx) => (
                    <TrendingCard key={tx.id} transaction={tx} theme={theme} index={idx} />
                  ))}
                </View>
              )}
            </View>

            <View style={{ height: 120 }} />
          </ScrollView>
        )}
      </SafeAreaView>

      {/* CONTRIBUTION MODAL */}
      <Modal
        visible={showContributionModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowContributionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Add Contribution</Text>
            <Text style={[styles.modalSubtitle, { color: theme.subtext }]}>
              {selectedGoal?.name}
            </Text>

            <TextInput
              style={[styles.modalInput, { backgroundColor: theme.background, color: theme.text }]}
              placeholder="Enter amount"
              placeholderTextColor={theme.subtext}
              keyboardType="numeric"
              value={contributionAmount}
              onChangeText={setContributionAmount}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: theme.border }]}
                onPress={() => {
                  setShowContributionModal(false);
                  setContributionAmount('');
                }}
              >
                <Text style={[styles.modalBtnText, { color: theme.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: theme.tint }]}
                onPress={handleSubmitContribution}
              >
                <Text style={[styles.modalBtnText, { color: 'white' }]}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ADD GOAL MODAL */}
      <Modal
        visible={showAddGoalModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddGoalModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Create New Goal</Text>

            <TextInput
              style={[styles.modalInput, { backgroundColor: theme.background, color: theme.text, marginBottom: 12 }]}
              placeholder="Goal name (e.g., Vacation Fund)"
              placeholderTextColor={theme.subtext}
              value={newGoalName}
              onChangeText={setNewGoalName}
            />

            <TextInput
              style={[styles.modalInput, { backgroundColor: theme.background, color: theme.text }]}
              placeholder="Target amount"
              placeholderTextColor={theme.subtext}
              keyboardType="numeric"
              value={newGoalTarget}
              onChangeText={setNewGoalTarget}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: theme.border }]}
                onPress={() => {
                  setShowAddGoalModal(false);
                  setNewGoalName('');
                  setNewGoalTarget('');
                }}
              >
                <Text style={[styles.modalBtnText, { color: theme.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: theme.tint }]}
                onPress={handleCreateGoal}
              >
                <Text style={[styles.modalBtnText, { color: 'white' }]}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  greetingText: { fontSize: 13, fontWeight: '700', letterSpacing: 0.5, marginBottom: 4 },
  nameText: { fontSize: 28, fontWeight: '900', letterSpacing: -1 },
  headerBtn: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center', position: 'relative',
  },
  notificationDot: {
    position: 'absolute', top: 12, right: 12, width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#EF4444', borderWidth: 2, borderColor: 'white',
  },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  balanceCard: { borderRadius: 32, padding: 24, marginBottom: 25, overflow: 'hidden', position: 'relative' },
  decorativeCircle1: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.1)', top: -50, right: -50,
  },
  decorativeCircle2: {
    position: 'absolute', width: 150, height: 150, borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.05)', bottom: -30, left: -30,
  },
  balanceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  balanceLabel: { color: 'rgba(255, 255, 255, 0.9)', fontSize: 13, fontWeight: '700', marginBottom: 8 },
  accountBadge: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, gap: 4,
  },
  accountText: { color: '#FFD700', fontSize: 11, fontWeight: '800' },
  eyeButton: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  balanceAmount: { color: '#FFFFFF', fontSize: 44, fontWeight: '900', letterSpacing: -2, marginBottom: 8 },
  balanceChange: { color: 'rgba(255, 255, 255, 0.8)', fontSize: 13, fontWeight: '600' },
  statsRow: {
    flexDirection: 'row', marginTop: 24, marginBottom: 20, paddingTop: 20,
    borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.15)',
  },
  statItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  statIconWrapper: {
    width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  statLabel: { color: 'rgba(255, 255, 255, 0.7)', fontSize: 11, fontWeight: '700', marginBottom: 4 },
  statValue: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  statDivider: { width: 1, height: 40, backgroundColor: 'rgba(255, 255, 255, 0.15)', marginHorizontal: 16 },
  quickActions: { flexDirection: 'row', gap: 12 },
  quickActionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.15)', paddingVertical: 12, borderRadius: 16,
  },
  quickActionText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  section: { marginBottom: 25 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
  seeAll: { fontSize: 14, fontWeight: '800' },

  // Insight Cards
  insightCard: {
    width: 220,
    borderRadius: 20,
    overflow: 'hidden',
  },
  insightGradient: {
    padding: 16,
    minHeight: 130,
  },
  insightIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  insightTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 6,
  },
  insightMessage: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },

  goalCard: { borderRadius: 24, padding: 20 },
  goalContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  goalIconCircle: { width: 28, height: 28, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  goalTitle: { fontSize: 16, fontWeight: '800', marginBottom: 4 },
  goalSubtitle: { fontSize: 13, fontWeight: '600', marginBottom: 12 },
  goalProgress: { width: width - 180 },
  goalBar: { height: 8, borderRadius: 4, overflow: 'hidden' },
  goalBarFill: { height: '100%', borderRadius: 4 },
  goalCircle: { position: 'relative', justifyContent: 'center', alignItems: 'center' },
  goalPercentage: { position: 'absolute' },
  goalPercentText: { fontSize: 16, fontWeight: '900' },
  miniCardsScroll: { gap: 12, paddingRight: 20 },
  miniCard: { width: 120, padding: 16, borderRadius: 20 },
  miniIconCircle: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  miniLabel: { fontSize: 13, fontWeight: '800', marginBottom: 4 },
  miniAmount: { fontSize: 15, fontWeight: '700', marginBottom: 10 },
  miniProgress: { height: 4, borderRadius: 2, overflow: 'hidden' },
  miniProgressFill: { height: '100%', borderRadius: 2 },
  aiBanner: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 24, marginBottom: 25, gap: 16 },
  aiIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(255, 255, 255, 0.2)', justifyContent: 'center', alignItems: 'center' },
  aiTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '900', marginBottom: 4 },
  aiSubtitle: { color: 'rgba(255, 255, 255, 0.8)', fontSize: 13, fontWeight: '600' },
  trendCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, marginBottom: 12, borderWidth: 1, gap: 12 },
  trendIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  trendDesc: { fontSize: 15, fontWeight: '800', marginBottom: 4 },
  trendCat: { fontSize: 12, fontWeight: '600' },
  trendAmount: { fontSize: 16, fontWeight: '900' },
  emptyState: { alignItems: 'center', padding: 40, borderRadius: 24 },
  emptyGoalState: { alignItems: 'center', padding: 30, borderRadius: 24 },
  emptyText: { fontSize: 18, fontWeight: '900', marginTop: 16 },
  emptySubtext: { fontSize: 14, marginTop: 8, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: width - 80, borderRadius: 24, padding: 24 },
  modalTitle: { fontSize: 22, fontWeight: '900', marginBottom: 8 },
  modalSubtitle: { fontSize: 14, fontWeight: '600', marginBottom: 20 },
  modalInput: { borderRadius: 16, padding: 16, fontSize: 16, fontWeight: '700', marginBottom: 20 },
  modalButtons: { flexDirection: 'row', gap: 12 },
  modalBtn: { flex: 1, padding: 16, borderRadius: 16, alignItems: 'center' },
  modalBtnText: { fontSize: 16, fontWeight: '800' },
});