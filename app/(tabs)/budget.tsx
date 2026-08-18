// app/(tabs)/budget.tsx
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform, Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import Animated, { Easing, useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, G } from 'react-native-svg';

import { Colors } from '../../constants/theme';
import { getCategoryColor, getCategoryIcon } from '../_lib/autoCategorize';
import { useAuthStore } from '../_lib/useAuthStore';
import { Budget, useBudgetStore } from '../_lib/useBudgetStore';
import { useThemeStore } from '../_lib/useThemeStore';

const { width } = Dimensions.get('window');
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const GRADIENTS = {
  primary: ['#6366F1', '#8B5CF6', '#A855F7'] as const,
  primaryDark: ['#4F46E5', '#7C3AED', '#C084FC'] as const,
};

// --- ANIMATED CIRCULAR PROGRESS ---
const CircularProgress = ({
  size = 120, strokeWidth = 12, progress, color, backgroundColor = '#E2E8F0'
}: any) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    animatedProgress.value = withTiming(Math.min(progress, 100), {
      duration: 900,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference - (circumference * animatedProgress.value) / 100,
  }));

  return (
    <Svg width={size} height={size}>
      <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
        <Circle stroke={backgroundColor} fill="none" cx={size / 2} cy={size / 2} r={radius} strokeWidth={strokeWidth} />
        <AnimatedCircle
          stroke={color} fill="none" cx={size / 2} cy={size / 2} r={radius}
          strokeWidth={strokeWidth} strokeDasharray={`${circumference} ${circumference}`}
          animatedProps={animatedProps} strokeLinecap="round"
        />
      </G>
    </Svg>
  );
};

// --- SKELETON ---
const SkeletonBlock = ({ style, theme }: any) => (
  <MotiView
    style={[{ backgroundColor: theme.border, borderRadius: 20, overflow: 'hidden' }, style]}
    from={{ opacity: 0.4 }}
    animate={{ opacity: 1 }}
    transition={{ type: 'timing', duration: 800, loop: true }}
  />
);

const BudgetSkeleton = ({ theme }: any) => (
  <View style={{ paddingHorizontal: 20 }}>
    <SkeletonBlock theme={theme} style={{ height: 110, borderRadius: 24, marginBottom: 20 }} />
    <SkeletonBlock theme={theme} style={{ height: 90, marginBottom: 12 }} />
    <SkeletonBlock theme={theme} style={{ height: 90, marginBottom: 12 }} />
    <SkeletonBlock theme={theme} style={{ height: 90 }} />
  </View>
);

// --- ADD BUDGET MODAL ---
const AddBudgetModal = ({ visible, onClose, onSave, theme, isDarkMode }: any) => {
  const [category, setCategory] = useState('');
  const [limit, setLimit] = useState('');

  const handleSave = () => {
    if (!category || !limit) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    onSave(category, parseFloat(limit));
    setCategory('');
    setLimit('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent={true}>
      <View style={styles.modalOverlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalKeyboardview}>
          <MotiView
            from={{ translateY: 300 }}
            animate={{ translateY: 0 }}
            transition={{ type: 'spring', damping: 22 }}
            style={[styles.modalContainer, { backgroundColor: theme.card }]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>New Budget</Text>
              <TouchableOpacity onPress={onClose}><Ionicons name="close-circle" size={28} color={theme.subtext} /></TouchableOpacity>
            </View>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.subtext }]}>BUDGET NAME</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                placeholder="e.g. Water, Rent" placeholderTextColor={theme.subtext + '80'}
                value={category} onChangeText={setCategory}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.subtext }]}>MONTHLY LIMIT (₹)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                placeholder="5000" placeholderTextColor={theme.subtext + '80'}
                keyboardType="numeric" value={limit} onChangeText={setLimit}
              />
            </View>
            <TouchableOpacity onPress={handleSave} style={styles.saveButtonWrapper}>
              <LinearGradient colors={isDarkMode ? GRADIENTS.primaryDark : GRADIENTS.primary} style={styles.saveButton}>
                <Text style={styles.saveButtonText}>Create Budget</Text>
              </LinearGradient>
            </TouchableOpacity>
          </MotiView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

// --- PREMIUM BUDGET CARD ---
const PremiumBudgetCard = ({
  budget, onPress, onLongPress, theme, index
}: any) => {
  const progress = budget.limit > 0 ? Math.min((budget.spent / budget.limit) * 100, 100) : 0;
  const isOver = budget.spent > budget.limit;
  const isWarning = progress > 80 && !isOver;
  const remaining = budget.limit - budget.spent;
  const cardColor = isOver ? '#EF4444' : isWarning ? '#F59E0B' : getCategoryColor(budget.category);
  const icon = getCategoryIcon(budget.category);

  return (
    <MotiView
      from={{ opacity: 0, translateY: 15 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 350, delay: index * 60 }}
    >
      <TouchableOpacity onPress={onPress} onLongPress={onLongPress} activeOpacity={0.8} style={styles.cardWrapper}>
        <LinearGradient
          colors={[cardColor + '15', cardColor + '05'] as const}
          style={[styles.budgetCard, { borderColor: cardColor + '30', backgroundColor: theme.card }]}
        >
          <View style={styles.progressSection}>
            <CircularProgress size={70} strokeWidth={7} progress={progress} color={cardColor} backgroundColor={theme.border} />
            <View style={styles.progressCenter}>
              <Text style={[styles.progressPercent, { color: cardColor, fontSize: 12 }]}>{progress.toFixed(0)}%</Text>
            </View>
          </View>
          <View style={styles.detailsSection}>
            <View style={styles.categoryHeader}>
              <View style={[styles.categoryIcon, { backgroundColor: cardColor + '20' }]}>
                <Ionicons name={icon} size={20} color={cardColor} />
              </View>
              <View>
                <Text style={[styles.categoryName, { color: theme.text }]}>{budget.category}</Text>
                <Text style={{ color: theme.subtext, fontSize: 12 }}>
                  {isOver ? `₹${Math.abs(remaining).toLocaleString()} over` : `₹${remaining.toLocaleString()} left`}
                </Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </MotiView>
  );
};

// --- SUMMARY HEADER ---
const SummaryHeader = ({ budgets, theme, isDarkMode }: any) => {
  const totalBudget = budgets.reduce((sum: number, b: Budget) => sum + b.limit, 0);
  const totalSpent = budgets.reduce((sum: number, b: Budget) => sum + b.spent, 0);
  const overallProgress = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;

  return (
    <MotiView from={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', damping: 18 }}>
      <LinearGradient colors={isDarkMode ? GRADIENTS.primaryDark : GRADIENTS.primary} style={styles.summaryCard}>
        <View style={styles.summaryContent}>
          <View style={styles.summaryLeft}>
            <Text style={styles.summaryLabel}>Total Budget</Text>
            <Text style={styles.summaryAmount}>₹{totalBudget.toLocaleString()}</Text>
            <Text style={styles.summarySpent}>₹{totalSpent.toLocaleString()} spent</Text>
          </View>
          <CircularProgress size={60} strokeWidth={6} progress={overallProgress} color="white" backgroundColor="rgba(255,255,255,0.2)" />
        </View>
      </LinearGradient>
    </MotiView>
  );
};

// --- EMPTY STATE ---
const EmptyBudgetState = ({ theme, isDarkMode, onCreate }: any) => (
  <MotiView
    from={{ opacity: 0, translateY: 20 }}
    animate={{ opacity: 1, translateY: 0 }}
    style={[styles.emptyState, { backgroundColor: theme.card }]}
  >
    <LinearGradient colors={isDarkMode ? GRADIENTS.primaryDark : GRADIENTS.primary} style={styles.emptyIcon}>
      <Ionicons name="pie-chart-outline" size={32} color="white" />
    </LinearGradient>
    <Text style={[styles.emptyTitle, { color: theme.text }]}>No budgets yet</Text>
    <Text style={[styles.emptySub, { color: theme.subtext }]}>
      Set spending limits per category to keep your finances on track
    </Text>
    <TouchableOpacity style={[styles.emptyCta, { backgroundColor: theme.tint }]} onPress={onCreate}>
      <Text style={styles.emptyCtaText}>Create Your First Budget</Text>
    </TouchableOpacity>
  </MotiView>
);

// --- MAIN SCREEN ---
export default function PremiumBudgetScreen() {
  const { isDarkMode } = useThemeStore();
  const theme = isDarkMode ? Colors.dark : Colors.light;
  const { user, isLoading: authLoading } = useAuthStore();
    const { budgets, isLoading, isInitialized, addBudget, deleteBudget } = useBudgetStore() as any;
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      useBudgetStore.getState().initialize(user.uid);
    }
  }, [user?.uid]);

  const handleAddBudget = async (category: string, limit: number) => {
    if (!user?.uid) return;
    await addBudget({ userId: user.uid, category, limit, icon: getCategoryIcon(category), color: getCategoryColor(category) });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const confirmDelete = (budget: Budget) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      "Delete Budget",
      `Are you sure you want to delete the "${budget.category}" budget?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteBudget(budget);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        }
      ]
    );
  };

    const handleRefresh = async () => {
    // Budgets are now live via onSnapshot, so there's nothing to manually
    // refetch — this just gives a brief tactile confirmation.
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 400);
  };

  const showSkeleton = authLoading || (isLoading && budgets.length === 0 && !isInitialized);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Budgets</Text>
            <Text style={[styles.headerSubtitle, { color: theme.subtext }]}>Track limits</Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={() => setIsModalVisible(true)}>
            <LinearGradient colors={isDarkMode ? GRADIENTS.primaryDark : GRADIENTS.primary} style={styles.addButtonGradient}>
              <Ionicons name="add" size={28} color="white" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {showSkeleton ? (
          <BudgetSkeleton theme={theme} />
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.tint} colors={[theme.tint]} />
            }
          >
            {budgets.length === 0 ? (
              <EmptyBudgetState theme={theme} isDarkMode={isDarkMode} onCreate={() => setIsModalVisible(true)} />
            ) : (
              <>
                <SummaryHeader budgets={budgets} theme={theme} isDarkMode={isDarkMode} />
                <View style={styles.section}>
                  {budgets.map((budget: Budget, idx: number) => (
                    <PremiumBudgetCard
                      key={budget.id}
                      budget={budget}
                      theme={theme}
                      index={idx}
                      onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                      onLongPress={() => confirmDelete(budget)}
                    />
                  ))}
                </View>
              </>
            )}
            <View style={{ height: 40 }} />
          </ScrollView>
        )}
      </SafeAreaView>

      <AddBudgetModal
        visible={isModalVisible} onClose={() => setIsModalVisible(false)}
        onSave={handleAddBudget} theme={theme} isDarkMode={isDarkMode}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, marginBottom: 20 },
  headerTitle: { fontSize: 32, fontWeight: "900", letterSpacing: -1 },
  headerSubtitle: { fontSize: 16, fontWeight: "600" },
  addButton: { width: 54, height: 54, borderRadius: 27, overflow: 'hidden' },
  addButtonGradient: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingHorizontal: 20 },
  summaryCard: { borderRadius: 24, padding: 20, marginBottom: 20 },
  summaryContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLeft: { flex: 1 },
  summaryLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '700' },
  summaryAmount: { color: 'white', fontSize: 24, fontWeight: '900' },
  summarySpent: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '600', marginTop: 2 },
  section: { gap: 12 },
  cardWrapper: { marginBottom: 8 },
  budgetCard: { flexDirection: 'row', borderRadius: 20, padding: 16, borderWidth: 1 },
  progressSection: { marginRight: 16, justifyContent: 'center', position: 'relative' },
  progressCenter: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' },
  progressPercent: { fontWeight: '900' },
  detailsSection: { flex: 1, justifyContent: 'center' },
  categoryHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  categoryIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  categoryName: { fontWeight: '800', fontSize: 16 },

  emptyState: { alignItems: 'center', padding: 40, borderRadius: 28, marginTop: 20 },
  emptyIcon: { width: 72, height: 72, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 20, fontWeight: '900', marginBottom: 8 },
  emptySub: { fontSize: 14, textAlign: 'center', marginBottom: 20, lineHeight: 20, paddingHorizontal: 10 },
  emptyCta: { paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16 },
  emptyCtaText: { color: 'white', fontSize: 15, fontWeight: '800' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalKeyboardview: { width: '100%' },
  modalContainer: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 24, fontWeight: '900' },
  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 12, fontWeight: '800', marginBottom: 8, letterSpacing: 1 },
  input: { borderRadius: 16, padding: 16, fontSize: 16, borderWidth: 1 },
  saveButtonWrapper: { marginTop: 10, borderRadius: 18, overflow: 'hidden' },
  saveButton: { padding: 18, alignItems: 'center' },
  saveButtonText: { color: 'white', fontSize: 16, fontWeight: '900' },
});