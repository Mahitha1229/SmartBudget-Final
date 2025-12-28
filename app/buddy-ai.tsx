// smartbudget/app/buddy-ai.tsx
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity, ScrollView } from 'react-native';
import { useTransactionData } from './_lib/useTransactionStore';
import { useThemeStore } from './_lib/useThemeStore';
import { useBudgetStore } from './_lib/useBudgetStore';
import { Colors } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { generateBuddyResponse } from './_lib/aiService';
import { MotiView } from 'moti';

interface Message {
  id: string;
  text: string;
  type: 'user' | 'ai';
  timestamp: Date;
  quickActions?: { label: string; action: string }[];
  data?: any;
}

const QUICK_PROMPTS = [
  { icon: 'pie-chart', text: 'Show my spending', query: 'show my spending summary' },
  { icon: 'trending-down', text: 'Saving tips', query: 'give me saving tips' },
  { icon: 'wallet', text: 'Budget status', query: 'how are my budgets doing' },
  { icon: 'analytics', text: 'Category breakdown', query: 'show category breakdown' }
];

export default function EnhancedBuddyChat() {
  const { isDarkMode } = useThemeStore();
  const theme = isDarkMode ? Colors.dark : Colors.light;
  const { transactions, currentBalance, totalExpense } = useTransactionData();
  const budgets = useBudgetStore(state => state.budgets);
  
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: '1', 
      text: "Hey! 👋 I'm Buddy, your AI financial assistant. I've analyzed your spending and I'm ready to help!", 
      type: 'ai', 
      timestamp: new Date(),
      quickActions: [
        { label: '📊 Show Summary', action: 'show my spending summary' },
        { label: '💡 Get Tips', action: 'give me saving tips' }
      ]
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showQuickPrompts, setShowQuickPrompts] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages]);

  const handleSend = (text?: string) => {
    const msg = text || input.trim();
    if (!msg) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowQuickPrompts(false);
    
    const userMsg: Message = { 
      id: Date.now().toString(), 
      text: msg, 
      type: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const response = generateBuddyResponse(msg, transactions, currentBalance);
      
      // Add contextual quick actions based on response
      let quickActions: { label: string; action: string }[] = [];
      if (response.toLowerCase().includes('spending') || response.toLowerCase().includes('expense')) {
        quickActions = [
          { label: '📈 See Trends', action: 'show spending trends' },
          { label: '💰 Add Transaction', action: 'navigate:add' }
        ];
      } else if (response.toLowerCase().includes('budget')) {
        quickActions = [
          { label: '🎯 View Budgets', action: 'navigate:budget' },
          { label: '➕ Set Budget', action: 'navigate:budget' }
        ];
      } else if (response.toLowerCase().includes('save') || response.toLowerCase().includes('tip')) {
        quickActions = [
          { label: '📊 See Details', action: 'show category breakdown' },
          { label: '💡 More Tips', action: 'give me more saving tips' }
        ];
      }

      const aiMsg: Message = { 
        id: (Date.now() + 1).toString(), 
        text: response, 
        type: 'ai',
        timestamp: new Date(),
        quickActions: quickActions.length > 0 ? quickActions : undefined
      };
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 800);
  };

  const handleQuickAction = (action: string) => {
    if (action.startsWith('navigate:')) {
      const route = action.split(':')[1];
      if (route === 'add') {
        router.push('/add-transaction');
      } else if (route === 'budget') {
        router.push('/(tabs)/budget');
      } else if (route === 'home') {
        router.push('/(tabs)');
      }
    } else {
      handleSend(action);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.type === 'user';
    return (
      <MotiView
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 300 }}
        style={[styles.msgContainer, isUser ? styles.userMsg : styles.aiMsg]}
      >
        {!isUser && (
          <View style={[styles.avatar, { backgroundColor: `${theme.tint}20` }]}>
            <Ionicons name="sparkles" size={16} color={theme.tint} />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <View style={[
            styles.bubble,
            isUser 
              ? { backgroundColor: theme.tint, marginLeft: 40 } 
              : { backgroundColor: theme.card }
          ]}>
            <Text style={[styles.msgText, { color: isUser ? '#FFFFFF' : theme.text }]}>
              {item.text}
            </Text>
          </View>
          
          {/* Quick Action Buttons */}
          {!isUser && item.quickActions && (
            <View style={styles.quickActions}>
              {item.quickActions.map((qa, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => handleQuickAction(qa.action)}
                  style={[styles.quickBtn, { backgroundColor: theme.background, borderColor: theme.border }]}
                >
                  <Text style={[styles.quickBtnText, { color: theme.tint }]}>{qa.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </MotiView>
    );
  };

  const renderTyping = () => {
    if (!isTyping) return null;
    return (
      <View style={[styles.msgContainer, styles.aiMsg]}>
        <View style={[styles.avatar, { backgroundColor: `${theme.tint}20` }]}>
          <Ionicons name="sparkles" size={16} color={theme.tint} />
        </View>
        <View style={[styles.bubble, { backgroundColor: theme.card }]}>
          <View style={styles.dots}>
            <MotiView
              from={{ opacity: 0.3 }}
              animate={{ opacity: 1 }}
              transition={{ loop: true, duration: 600, delay: 0 }}
              style={[styles.dot, { backgroundColor: theme.subtext }]}
            />
            <MotiView
              from={{ opacity: 0.3 }}
              animate={{ opacity: 1 }}
              transition={{ loop: true, duration: 600, delay: 200 }}
              style={[styles.dot, { backgroundColor: theme.subtext }]}
            />
            <MotiView
              from={{ opacity: 0.3 }}
              animate={{ opacity: 1 }}
              transition={{ loop: true, duration: 600, delay: 400 }}
              style={[styles.dot, { backgroundColor: theme.subtext }]}
            />
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Header with Stats */}
        <View style={[styles.header, { backgroundColor: theme.card }]}>
          <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }} style={styles.back}>
            <Ionicons name="chevron-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Buddy AI</Text>
            <Text style={[styles.headerSub, { color: theme.subtext }]}>
              {transactions.length} transactions • ₹{totalExpense.toLocaleString()} spent
            </Text>
          </View>
          <View style={[styles.status, { backgroundColor: '#10B981' }]} />
        </View>

        {/* Quick Prompt Chips */}
        {showQuickPrompts && messages.length <= 2 && (
          <MotiView
            from={{ opacity: 0, translateY: -10 }}
            animate={{ opacity: 1, translateY: 0 }}
            style={[styles.promptsContainer, { backgroundColor: theme.background }]}
          >
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.prompts}>
              {QUICK_PROMPTS.map((prompt, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => handleSend(prompt.query)}
                  style={[styles.promptChip, { backgroundColor: theme.card, borderColor: theme.border }]}
                >
                  <Ionicons name={prompt.icon as any} size={16} color={theme.tint} />
                  <Text style={[styles.promptText, { color: theme.text }]}>{prompt.text}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </MotiView>
        )}

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messages}
          renderItem={renderMessage}
          ListFooterComponent={renderTyping}
          showsVerticalScrollIndicator={false}
        />

        {/* Input */}
        <View style={[styles.inputArea, { backgroundColor: theme.background, borderTopColor: theme.border }]}>
          <View style={[styles.inputWrapper, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <TextInput
              style={[styles.input, { color: theme.text }]}
              value={input}
              onChangeText={setInput}
              placeholder="Ask me anything about your finances..."
              placeholderTextColor={theme.subtext}
              multiline
              maxLength={500}
              onSubmitEditing={() => handleSend()}
            />
            <TouchableOpacity 
              onPress={() => handleSend()}
              disabled={!input.trim()}
              style={[styles.send, { backgroundColor: input.trim() ? theme.tint : theme.border }]}
            >
              <Ionicons name="send" size={18} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12, elevation: 2 },
  back: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  headerInfo: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  headerSub: { fontSize: 11, marginTop: 2, fontWeight: '600' },
  status: { width: 10, height: 10, borderRadius: 5 },
  promptsContainer: { paddingVertical: 12 },
  prompts: { paddingHorizontal: 16, gap: 10 },
  promptChip: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, borderWidth: 1 },
  promptText: { fontSize: 13, fontWeight: '700' },
  messages: { padding: 16, paddingBottom: 20 },
  msgContainer: { flexDirection: 'row', marginBottom: 16, maxWidth: '85%' },
  userMsg: { alignSelf: 'flex-end', justifyContent: 'flex-end' },
  aiMsg: { alignSelf: 'flex-start', gap: 8 },
  avatar: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 4 },
  bubble: { padding: 14, borderRadius: 20, elevation: 1 },
  msgText: { fontSize: 15, lineHeight: 22, fontWeight: '500' },
  quickActions: { flexDirection: 'row', gap: 8, marginTop: 8, flexWrap: 'wrap' },
  quickBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, borderWidth: 1 },
  quickBtnText: { fontSize: 12, fontWeight: '700' },
  dots: { flexDirection: 'row', gap: 6, paddingVertical: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  inputArea: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, borderTopWidth: 1 },
  inputWrapper: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1, gap: 8 },
  input: { flex: 1, minHeight: 36, maxHeight: 100, fontSize: 15, fontWeight: '500', paddingTop: 8 },
  send: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' }
});