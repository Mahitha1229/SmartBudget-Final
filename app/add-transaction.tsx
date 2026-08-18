import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { MotiView } from 'moti';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// --- STORES & LIBS ---
import { CATEGORIES, getDescriptionSuggestions } from '../constants/category';
import { Colors } from '../constants/theme';
import { categorizeTransaction, getCategoryColor, getCategoryIcon, isValidCategory } from './_lib/autoCategorize';
import { useAuthStore } from './_lib/useAuthStore';
import { useBudgetStore } from './_lib/useBudgetStore';
import { useThemeStore } from './_lib/useThemeStore';
import { useTransactionStore } from './_lib/useTransactionStore';

const GRADIENTS = {
  primary: ['#6366F1', '#8B5CF6', '#A855F7'] as const,
  primaryDark: ['#4F46E5', '#7C3AED', '#C084FC'] as const,
  success: ['#10B981', '#059669'] as const,
  danger: ['#EF4444', '#DC2626'] as const,
};

const QUICK_AMOUNTS = [50, 100, 200, 500, 1000];

export default function PremiumAddTransactionScreen() {
  const user = useAuthStore(state => state.user);
  const { isDarkMode } = useThemeStore();
  const theme = isDarkMode ? Colors.dark : Colors.light;
  const budgets = useBudgetStore(state => state.budgets);

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [type, setType] = useState<'debit' | 'credit'>('debit');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // --- DYNAMIC CATEGORY MERGING ---
  // This merges your default categories with the new ones you added in the Budget screen
  const availableCategories = useMemo(() => {
    const budgetBasedCategories = budgets.map(b => ({
      name: b.category,
      icon: getCategoryIcon(b.category),
      color: getCategoryColor(b.category)
    }));

    const combined = [...CATEGORIES, ...budgetBasedCategories];

    // Remove duplicates if a budget name matches a static category name
    const uniqueCategories = Array.from(
      new Map(combined.map(item => [item.name, item])).values()
    );

    return uniqueCategories;
  }, [budgets]);

  useEffect(() => {
    if (!category && availableCategories.length > 0) {
      setCategory(availableCategories[0].name);
    }
  }, [availableCategories]);

  const saveToStore = useTransactionStore(state => state.addTransaction);

  const handleQuickAmount = (value: number) => {
    setAmount(value.toString());
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleSuggestionSelect = (suggestion: string) => {
    setDescription(suggestion);
    setShowSuggestions(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSave = async () => {
    if (!user?.uid || !amount || parseFloat(amount) <= 0) {
      Alert.alert('Missing Info', 'Please enter a valid amount.');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      return;
    }
    
    if (!category && type === 'debit') {
      Alert.alert('Missing Info', 'Please select a category.');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      return;
    }
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setLoading(true);
    
    try {
      const transactionCategory = type === 'credit' ? 'Income' : category;
      const finalAmount = type === 'debit' ? -Math.abs(parseFloat(amount)) : Math.abs(parseFloat(amount));
      
      await saveToStore({ 
        amount: finalAmount,
        category: transactionCategory,
        description: description.trim() || transactionCategory,
        type: type,
        date: date,
      }, user.uid);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back(); 
    } catch (error) {
      Alert.alert('Error', 'Failed to save transaction.');
    } finally {
      setLoading(false);
    }
  };

  const currentSuggestions = getDescriptionSuggestions(category);
  const hasBudget = budgets.some(b => b.category === category);
  const currentBudget = budgets.find(b => b.category === category);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={['top']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        {/* HEADER */}
        <View style={styles.navBar}>
          <TouchableOpacity 
            onPress={() => { 
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back(); 
            }} 
            style={[styles.backCircle, { backgroundColor: theme.card }]}
          >
            <Ionicons name="close" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.navTitle, { color: theme.text }]}>New Transaction</Text>
          <View style={{ width: 44 }} /> 
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* AMOUNT CARD */}
          <MotiView from={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <LinearGradient
              colors={type === 'debit' ? ['#FEE2E2', '#FEF2F2'] : ['#D1FAE5', '#ECFDF5']}
              style={styles.amountCard}
            >
              <View style={styles.amountRow}>
                <Text style={[styles.currencyLabel, { color: type === 'debit' ? '#EF4444' : '#10B981' }]}>
                  {type === 'debit' ? '-' : '+'} ₹
                </Text>
                <TextInput
                  style={[styles.mainInput, { color: theme.text }]}
                  placeholder="0"
                  placeholderTextColor={theme.subtext}
                  keyboardType="decimal-pad"
                  autoFocus
                  value={amount}
                  onChangeText={setAmount}
                />
              </View>
            </LinearGradient>
          </MotiView>

          {/* QUICK AMOUNTS */}
          <View style={styles.quickAmountsRow}>
            {QUICK_AMOUNTS.map((amt) => (
              <TouchableOpacity
                key={amt}
                onPress={() => handleQuickAmount(amt)}
                style={[
                  styles.quickAmountBtn,
                  { backgroundColor: amount === amt.toString() ? theme.tint : theme.card, borderColor: theme.border, borderWidth: 1 }
                ]}
              >
                <Text style={[styles.quickAmountText, { color: amount === amt.toString() ? 'white' : theme.text }]}>₹{amt}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* TYPE TOGGLE */}
          <View style={[styles.toggleWrapper, { backgroundColor: theme.card }]}>
            <TouchableOpacity 
              onPress={() => { setType('debit'); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
              style={[styles.toggleOption, type === 'debit' && styles.debitActive]}
            >
              <Text style={[styles.toggleLabel, { color: type === 'debit' ? 'white' : theme.subtext }]}>Expense</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => { setType('credit'); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
              style={[styles.toggleOption, type === 'credit' && styles.creditActive]}
            >
              <Text style={[styles.toggleLabel, { color: type === 'credit' ? 'white' : theme.subtext }]}>Income</Text>
            </TouchableOpacity>
          </View>

          {/* CATEGORY SELECTION */}
          {type === 'debit' && (
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={[styles.sectionHeader, { color: theme.subtext }]}>Select Category</Text>
                {hasBudget && currentBudget && (
                  <View style={[styles.budgetBadge, { backgroundColor: theme.tint + '20' }]}>
                    <Text style={[styles.budgetBadgeText, { color: theme.tint }]}>
                      ₹{Math.round(currentBudget.limit - currentBudget.spent)} left
                    </Text>
                  </View>
                )}
              </View>
              
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
                {availableCategories.map((cat) => {
                  const isSelected = category === cat.name;
                  const catHasBudget = budgets.some(b => b.category === cat.name);
                  
                                    return (
                    <TouchableOpacity
                      key={cat.name}
                      activeOpacity={0.85}
                      onPress={() => { setCategory(cat.name); setDescription(''); setShowSuggestions(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                    >
                      <MotiView
                        animate={{
                          scale: isSelected ? 1.06 : 1,
                          backgroundColor: isSelected ? cat.color : theme.card,
                          borderColor: isSelected ? cat.color : theme.border,
                        }}
                        transition={{ type: 'spring', damping: 14, mass: 0.6 }}
                        style={[styles.categoryChip, { borderWidth: 2 }]}
                      >
                        {catHasBudget && <View style={[styles.budgetDot, { backgroundColor: '#10B981' }]} />}
                        <Ionicons name={cat.icon as any} size={20} color={isSelected ? 'white' : cat.color} />
                        <Text style={[styles.categoryChipText, { color: isSelected ? 'white' : theme.text }]}>{cat.name}</Text>
                      </MotiView>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* BUDGET WARNING (Calculates if this specific transaction breaks the budget) */}
              {currentBudget && amount && parseFloat(amount) > 0 && (
                <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} style={[
                  styles.budgetWarning,
                  { backgroundColor: currentBudget.spent + parseFloat(amount) > currentBudget.limit ? '#FEE2E2' : '#DCFCE7' }
                ]}>
                  <Ionicons 
                    name={currentBudget.spent + parseFloat(amount) > currentBudget.limit ? "warning" : "checkmark-circle"} 
                    size={16} 
                    color={currentBudget.spent + parseFloat(amount) > currentBudget.limit ? "#EF4444" : "#10B981"} 
                  />
                  <Text style={[styles.budgetWarningText, { color: currentBudget.spent + parseFloat(amount) > currentBudget.limit ? "#EF4444" : "#10B981" }]}>
                    {currentBudget.spent + parseFloat(amount) > currentBudget.limit 
                      ? `Exceeds budget by ₹${Math.round(currentBudget.spent + parseFloat(amount) - currentBudget.limit)}`
                      : `Within ${category} budget`}
                  </Text>
                </MotiView>
              )}
            </View>
          )}

          {/* DESCRIPTION & DATE */}
          <View style={styles.section}>
            <Text style={[styles.sectionHeader, { color: theme.subtext }]}>Details</Text>
            <View style={[styles.formCard, { backgroundColor: theme.card }]}>
              <View style={styles.inputRow}>
                <LinearGradient colors={isDarkMode ? GRADIENTS.primaryDark : GRADIENTS.primary} style={styles.inputIconCircle}>
                  <Ionicons name="pencil" size={18} color="white" />
                </LinearGradient>
                <TextInput
                  style={[styles.descInput, { color: theme.text }]}
                  placeholder={type === 'credit' ? 'Income source' : 'What did you buy?'}
                  placeholderTextColor={theme.subtext}
                  value={description}
                  onChangeText={(text) => {
  setDescription(text);
  if (type === 'debit' && text.trim().length >= 3) {
    const detected = categorizeTransaction(text);
    if (detected !== 'Other' && detected !== category && isValidCategory(detected)) {
      setCategory(detected);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }
}}
                  onFocus={() => setShowSuggestions(true)}
                />
              </View>
              
              {showSuggestions && currentSuggestions.length > 0 && type === 'debit' && (
                <View style={styles.suggestionsContainer}>
                  <View style={styles.suggestionsGrid}>
                    {currentSuggestions.map((s) => (
                      <TouchableOpacity key={s} onPress={() => handleSuggestionSelect(s)} style={[styles.suggestionChip, { backgroundColor: theme.background, borderColor: theme.border }]}>
                        <Text style={[styles.suggestionText, { color: theme.text }]}>{s}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
              
              <View style={[styles.separator, { backgroundColor: theme.border }]} />
              
              <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.inputRow}>
                <LinearGradient colors={isDarkMode ? GRADIENTS.primaryDark : GRADIENTS.primary} style={styles.inputIconCircle}>
                  <Ionicons name="calendar" size={18} color="white" />
                </LinearGradient>
                <Text style={[styles.descInput, { color: theme.text }]}>
                  {date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long' })}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* FOOTER */}
        <View style={[styles.footer, { backgroundColor: theme.background }]}>
          <TouchableOpacity onPress={handleSave} disabled={loading || !amount} style={{ borderRadius: 20, overflow: 'hidden' }}>
            <LinearGradient colors={isDarkMode ? GRADIENTS.primaryDark : GRADIENTS.primary} style={[styles.saveButton, { opacity: (!amount || loading) ? 0.5 : 1 }]}>
              {loading ? <ActivityIndicator color="white" /> : <Text style={styles.saveButtonText}>Add Transaction</Text>}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {showDatePicker && (
          <DateTimePicker 
            value={date} mode="date" 
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(e, d) => { setShowDatePicker(false); if(d) setDate(d); }} 
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  navBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  backCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  navTitle: { fontSize: 20, fontWeight: '900' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  amountCard: { borderRadius: 28, padding: 24, marginBottom: 16 },
  amountRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  currencyLabel: { fontSize: 36, fontWeight: '900', marginRight: 8 },
  mainInput: { fontSize: 56, fontWeight: '900', textAlign: 'center', minWidth: 100 },
  quickAmountsRow: { flexDirection: 'row', gap: 8, marginBottom: 20, flexWrap: 'wrap' },
  quickAmountBtn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 16 },
  quickAmountText: { fontSize: 14, fontWeight: '800' },
  toggleWrapper: { flexDirection: 'row', padding: 6, borderRadius: 20, marginBottom: 25 },
  toggleOption: { flex: 1, paddingVertical: 14, borderRadius: 16, alignItems: 'center' },
  toggleLabel: { fontWeight: '800', fontSize: 15 },
  debitActive: { backgroundColor: '#EF4444' },
  creditActive: { backgroundColor: '#10B981' },
  section: { marginBottom: 25 },
  sectionHeader: { fontSize: 13, fontWeight: '800', textTransform: 'uppercase', marginBottom: 12, marginLeft: 4 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  budgetBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  budgetBadgeText: { fontSize: 11, fontWeight: '800' },
  categoryScroll: { flexDirection: 'row', gap: 10 },
  categoryChip: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16, borderWidth: 2, position: 'relative' },
  categoryChipText: { fontSize: 13, fontWeight: '700' },
  budgetDot: { position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: 4 },
  budgetWarning: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12, marginTop: 12 },
  budgetWarningText: { fontSize: 12, fontWeight: '700' },
  formCard: { borderRadius: 24, paddingHorizontal: 20, paddingVertical: 8 },
  inputRow: { flexDirection: 'row', alignItems: 'center', minHeight: 60, gap: 14 },
  inputIconCircle: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  descInput: { fontSize: 16, fontWeight: '700', flex: 1 },
  separator: { height: 1, width: '100%' },
  suggestionsContainer: { paddingVertical: 12 },
  suggestionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  suggestionChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1 },
  suggestionText: { fontSize: 12, fontWeight: '600' },
  footer: { padding: 20 },
  saveButton: { height: 64, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  saveButtonText: { color: 'white', fontSize: 18, fontWeight: '900' }
});