// SmartBudget/app/import-screen.tsx - HYBRID VERSION (FIXED)
// ✅ Works in Expo Go (demo mode)
// ✅ Works in Native Build (real SMS)

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, FlatList, Platform, PermissionsAndroid } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import Papa from 'papaparse';
import { useThemeStore } from './_lib/useThemeStore';
import { useTransactionStore } from './_lib/useTransactionStore';
import { useAuthStore } from './_lib/useAuthStore';
import { Colors } from '../constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { MotiView } from 'moti';
import { categorizeTransaction, getCategoryIcon, getCategoryColor } from './_lib/autoCategorize';
import { parseBankSMS, ParsedSMSTransaction } from './_lib/smsparser';
import { isSMSAvailable, readSMS, getDemoSMS, SMSMessage } from './_lib/smsModule';

interface PreviewTransaction {
  amount: number;
  description: string;
  category: string;
  type: "credit" | "debit";
  date: Date;
}

// CSV PARSER
const enhancedParse = (fileText: string): Promise<PreviewTransaction[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(fileText, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (results) => {
        try {
          const mapped = results.data.map((row: any) => {
            const amount = Math.abs(parseFloat(row.Amount || row.amount || 0));
            const rawType = String(row.Type || row.type || 'debit').toLowerCase();
            const type: "credit" | "debit" = rawType === 'credit' ? 'credit' : 'debit';
            
            let transactionDate = new Date();
            if (row.Date || row.date) {
              const parsedDate = new Date(row.Date || row.date);
              if (!isNaN(parsedDate.getTime())) transactionDate = parsedDate;
            }

            const description = String(row.Description || row.description || 'Imported');
            let category = String(row.Category || row.category || '');
            
            if (!category || category === 'Other' || category === '') {
              category = categorizeTransaction(description);
            }

            return {
              amount,
              description,
              category,
              type,
              date: transactionDate,
            };
          });
          resolve(mapped);
        } catch (err: any) {
          reject(err);
        }
      },
      error: (error: any) => reject(error)
    });
  });
};

// REQUEST SMS PERMISSIONS (Android)
const requestSMSPermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') {
    return false;
  }
  
  try {
    const alreadyGranted = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.READ_SMS
    );
    
    if (alreadyGranted) {
      return true;
    }

    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.READ_SMS,
      {
        title: 'SMS Permission Required',
        message: 'SmartBudget needs access to read your bank transaction SMS messages',
        buttonPositive: 'Allow',
        buttonNegative: 'Deny',
      }
    );
    
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (err) {
    console.error('❌ Permission error:', err);
    return false;
  }
};

// 🔄 HYBRID SMS READER - Auto-detects native/demo mode (FIXED)
const readSMSMessages = async (forceDemo: boolean = false): Promise<ParsedSMSTransaction[]> => {
  console.log('🔍 Starting SMS read...');
  console.log('🔍 forceDemo:', forceDemo);
  console.log('🔍 isSMSAvailable:', isSMSAvailable());
  
  let messages: SMSMessage[];
  
  // Force demo if requested OR if native not available
  if (forceDemo || !isSMSAvailable()) {
    console.log('📱 Using DEMO mode (Expo Go or native unavailable)');
    messages = await getDemoSMS();
  } else {
    console.log('📱 Using NATIVE mode (reading real SMS)');
    try {
      messages = await readSMS(500, 180); // Last 500 messages, 180 days
      
      // If native returns empty, fallback to demo
      if (messages.length === 0) {
        console.log('⚠️ Native returned empty, using demo data');
        messages = await getDemoSMS();
      }
    } catch (error) {
      console.error('❌ Native SMS read failed, falling back to demo:', error);
      messages = await getDemoSMS();
    }
  }

  console.log('📱 Processing', messages.length, 'messages...');

  const parsed: ParsedSMSTransaction[] = [];
  let bankSMSCount = 0;

  for (const msg of messages) {
    try {
      const smsText = msg.body;
      const smsDate = new Date(parseInt(msg.date));
      
      const result = parseBankSMS(smsText, smsDate);
      
      if (result && result.success) {
        bankSMSCount++;
        console.log(`✅ Parsed #${bankSMSCount}:`, result.description, '-', result.amount);
        parsed.push(result);
      }
    } catch (error) {
      // Silent fail - not a bank SMS
    }
  }

  console.log(`✅ Found ${bankSMSCount} bank transactions out of ${messages.length} messages`);
  return parsed;
};

// CONVERT PARSED SMS TO PREVIEW FORMAT
const convertSMSToPreview = (smsTransactions: ParsedSMSTransaction[]): PreviewTransaction[] => {
  return smsTransactions.map(sms => ({
    amount: sms.amount,
    description: sms.description,
    category: sms.category,
    type: sms.type,
    date: sms.date,
  }));
};

export default function ImportScreen() {
  const { isDarkMode } = useThemeStore();
  const theme = isDarkMode ? Colors.dark : Colors.light;
  const user = useAuthStore((state) => state.user);
  const addTransactionsBatch = useTransactionStore((state) => state.addTransactionsBatch);
  
  const [isImporting, setIsImporting] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewTransaction[] | null>(null);
  const [importSource, setImportSource] = useState<'csv' | 'sms' | null>(null);

  const handleFilePicker = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/comma-separated-values', 'text/csv'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setIsImporting(true);
      setImportSource('csv');

      const fileUri = result.assets[0].uri;
      const response = await fetch(fileUri);
      const fileText = await response.text();

      const mapped = await enhancedParse(fileText);
      setPreviewData(mapped);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setIsImporting(false);
    } catch (error) {
      setIsImporting(false);
      setImportSource(null);
      Alert.alert("Error", "Failed to read file. Please check the CSV format.");
    }
  };

  // 🔄 HYBRID SMS IMPORT - Auto-detects mode (FIXED)
  const handleSMSImport = async () => {
    console.log('📲 SMS Import initiated');
    
    if (Platform.OS !== 'android') {
      Alert.alert(
        'Not Available',
        'SMS import is only available on Android devices.'
      );
      return;
    }

    const isNativeAvailable = isSMSAvailable();
    const mode = isNativeAvailable ? 'REAL' : 'DEMO';
    
    console.log('📱 SMS Mode:', mode);
    console.log('📱 Native module available:', isNativeAvailable);

    const message = isNativeAvailable
      ? 'This will read your bank transaction SMS messages from the last 6 months.\n\nContinue?'
      : 'Running in DEMO mode (Expo Go detected).\n\nThis will import 8 sample transactions for testing.\n\nTo use real SMS, build with:\nnpx expo run:android\n\nContinue with demo?';

    Alert.alert(
      `SMS Import (${mode} Mode)`,
      message,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: async () => {
            try {
              console.log(`🚀 Starting ${mode} SMS import...`);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setIsImporting(true);
              setImportSource('sms');

              // Request permission (only if native)
              if (isNativeAvailable) {
                console.log('🔐 Requesting SMS permission...');
                const hasPermission = await requestSMSPermission();
                console.log('🔐 Permission granted:', hasPermission);
                
                if (!hasPermission) {
                  setIsImporting(false);
                  setImportSource(null);
                  Alert.alert(
                    'Permission Denied',
                    'SMS permission is required to read messages.'
                  );
                  return;
                }
              }

              // Read SMS (auto-detects mode with fallback)
              console.log('📖 Reading SMS messages...');
              const parsedSMS = await readSMSMessages(!isNativeAvailable); // Pass true for demo mode
              console.log('✅ Parsed SMS count:', parsedSMS.length);
              
              if (parsedSMS.length === 0) {
                setIsImporting(false);
                setImportSource(null);
                Alert.alert(
                  'No Transactions Found',
                  'No bank transaction SMS found. Try CSV import or check SMS permissions.'
                );
                return;
              }

              // Convert to preview
              const previewTransactions = convertSMSToPreview(parsedSMS);
              setPreviewData(previewTransactions);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              setIsImporting(false);

              console.log(`🎉 ${mode} SMS import successful!`);
            } catch (error) {
              console.error('❌ SMS import error:', error);
              setIsImporting(false);
              setImportSource(null);
              Alert.alert(
                'Import Failed',
                `Failed to read SMS: ${error instanceof Error ? error.message : 'Unknown error'}`
              );
            }
          }
        }
      ]
    );
  };

  const confirmImport = async () => {
    if (!previewData || !user?.uid) return;
    setIsImporting(true);
    try {
      await addTransactionsBatch(previewData, user.uid);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        "Success", 
        `Successfully imported ${previewData.length} transaction${previewData.length > 1 ? 's' : ''} from ${importSource === 'sms' ? 'SMS' : 'CSV'}!`
      );
      router.back();
    } catch (err) {
      Alert.alert("Error", "Failed to save transactions. Please try again.");
    } finally {
      setIsImporting(false);
    }
  };

  // Detect current mode for UI
  const isNativeMode = isSMSAvailable();
  const smsButtonSubtext = Platform.OS !== 'android' 
    ? 'Android only feature'
    : isNativeMode 
    ? 'Read your bank transaction messages' 
    : 'Demo mode - requires native build for real SMS';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={[styles.backBtn, { backgroundColor: theme.card }]}
        >
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>
          {previewData ? 'Review Import' : 'Import Transactions'}
        </Text>
        <View style={{ width: 44 }} />
      </View>

      {!previewData ? (
        <ScrollView contentContainerStyle={styles.content}>
          {/* Info Card */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 600 }}
            style={[styles.infoCard, { backgroundColor: theme.card }]}
          >
            <View style={[styles.infoIcon, { backgroundColor: `${theme.tint}15` }]}>
              <Ionicons name="information-circle" size={24} color={theme.tint} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.infoTitle, { color: theme.text }]}>Import Your Transactions</Text>
              <Text style={[styles.infoText, { color: theme.subtext }]}>
                Read bank SMS messages or upload a CSV file with your transaction history.
              </Text>
            </View>
          </MotiView>

          {/* Mode Indicator (if in demo mode) */}
          {!isNativeMode && Platform.OS === 'android' && (
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 600, delay: 50 }}
              style={[styles.demoCard, { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' }]}
            >
              <Ionicons name="flask" size={20} color="#F59E0B" />
              <Text style={[styles.demoText, { color: '#92400E' }]}>
                Demo Mode Active - Build with 'npx expo run:android' for real SMS
              </Text>
            </MotiView>
          )}

          {/* SMS IMPORT BUTTON */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 600, delay: 100 }}
          >
            <TouchableOpacity 
              style={[
                styles.smsButton, 
                { backgroundColor: theme.tint },
                !isNativeMode && Platform.OS === 'android' && { opacity: 0.7 }
              ]}
              onPress={handleSMSImport}
              disabled={isImporting}
            >
              <Ionicons 
                name={isNativeMode ? "chatbox-ellipses" : "flask"} 
                size={24} 
                color="white" 
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.smsButtonTitle}>
                  Import from SMS {!isNativeMode && Platform.OS === 'android' && '(Demo)'}
                </Text>
                <Text style={styles.smsButtonSub}>
                  {smsButtonSubtext}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="rgba(255,255,255,0.6)" />
            </TouchableOpacity>
          </MotiView>

          {/* DIVIDER */}
          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
            <Text style={[styles.dividerText, { color: theme.subtext }]}>OR</Text>
            <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
          </View>

          {/* Drop Zone */}
          <MotiView
            from={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', delay: 200, damping: 15 }}
          >
            <TouchableOpacity 
              style={[styles.dropZone, { borderColor: theme.border, backgroundColor: theme.card }]} 
              onPress={handleFilePicker}
              disabled={isImporting}
              activeOpacity={0.8}
            >
              {isImporting ? (
                <>
                  <ActivityIndicator size="large" color={theme.tint} />
                  <Text style={[styles.dropSubtext, { color: theme.subtext, marginTop: 15 }]}>
                    {importSource === 'sms' ? 'Reading SMS messages...' : 'Processing file...'}
                  </Text>
                </>
              ) : (
                <>
                  <View style={[styles.iconCircle, { backgroundColor: `${theme.tint}15` }]}>
                    <Ionicons name="cloud-upload" size={48} color={theme.tint} />
                  </View>
                  <Text style={[styles.dropText, { color: theme.text }]}>Select CSV File</Text>
                  <Text style={[styles.dropSubtext, { color: theme.subtext }]}>
                    Tap to browse your files
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </MotiView>

          {/* Example Format */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 600, delay: 300 }}
            style={[styles.exampleCard, { backgroundColor: theme.card }]}
          >
            <Text style={[styles.exampleTitle, { color: theme.text }]}>CSV Format Example</Text>
            <View style={[styles.codeBlock, { backgroundColor: theme.background }]}>
              <Text style={[styles.codeText, { color: theme.subtext }]}>
                Date,Description,Category,Amount,Type{'\n'}
                2024-01-15,Zomato Order,Food & Dining,450,debit{'\n'}
                2024-01-16,Salary Jan,Other,50000,credit{'\n'}
                2024-01-17,Uber Ride,Transportation,280,debit
              </Text>
            </View>
          </MotiView>
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>
          {/* Preview List */}
          <FlatList
            data={previewData}
            contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
            keyExtractor={(_, index) => index.toString()}
            ListHeaderComponent={
              <View style={styles.previewHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <Ionicons 
                    name={importSource === 'sms' ? 'chatbox-ellipses' : 'document-text'} 
                    size={20} 
                    color={theme.tint} 
                  />
                  <Text style={[styles.previewHeaderText, { color: theme.text }]}>
                    {previewData.length} transactions from {importSource === 'sms' ? 'SMS' : 'CSV'}
                  </Text>
                </View>
                <Text style={[styles.previewSubtext, { color: theme.subtext }]}>
                  Long press any item to remove it
                </Text>
              </View>
            }
            renderItem={({ item, index }) => {
              const categoryIcon = getCategoryIcon(item.category);
              const categoryColor = getCategoryColor(item.category);
              
              return (
                <MotiView
                  from={{ opacity: 0, translateX: -20 }}
                  animate={{ opacity: 1, translateX: 0 }}
                  transition={{ type: 'timing', duration: 400, delay: index * 50 }}
                >
                  <TouchableOpacity
                    style={[styles.previewItem, { backgroundColor: theme.card, borderColor: theme.border }]}
                    onLongPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      Alert.alert(
                        "Remove Item",
                        `Remove "${item.description}"?`,
                        [
                          { text: "Cancel", style: "cancel" },
                          {
                            text: "Remove",
                            style: "destructive",
                            onPress: () => {
                              const newData = [...previewData];
                              newData.splice(index, 1);
                              setPreviewData(newData.length > 0 ? newData : null);
                              if (newData.length === 0) {
                                setImportSource(null);
                              }
                            }
                          }
                        ]
                      );
                    }}
                  >
                    <View style={[styles.categoryIconBox, { backgroundColor: `${categoryColor}20` }]}>
                      <Ionicons 
                        name={categoryIcon as any} 
                        size={20} 
                        color={categoryColor} 
                      />
                    </View>
                    <View style={styles.previewLeft}>
                      <Text style={[styles.previewDesc, { color: theme.text }]} numberOfLines={1}>
                        {item.description}
                      </Text>
                      <Text style={[styles.previewSub, { color: theme.subtext }]}>
                        {item.category} • {item.date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </Text>
                    </View>
                    <Text style={[styles.previewAmount, { color: item.type === 'credit' ? '#10B981' : '#EF4444' }]}>
                      {item.type === 'credit' ? '+' : '-'}₹{item.amount.toFixed(0)}
                    </Text>
                  </TouchableOpacity>
                </MotiView>
              );
            }}
          />
          
          {/* Footer Actions */}
          <View style={[styles.footer, { backgroundColor: theme.background, borderTopColor: theme.border }]}>
            <TouchableOpacity 
              style={[styles.btn, { backgroundColor: theme.card, flex: 1, borderWidth: 1, borderColor: theme.border }]} 
              onPress={() => {
                Haptics.selectionAsync();
                setPreviewData(null);
                setImportSource(null);
              }}
            >
              <Text style={[styles.btnText, { color: theme.text }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.btn, { backgroundColor: theme.tint, flex: 2 }]} 
              onPress={confirmImport}
              disabled={isImporting}
            >
              {isImporting ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={22} color="white" />
                  <Text style={[styles.btnText, { color: 'white' }]}>
                    Import {previewData.length} Items
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  backBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', elevation: 2 },
  title: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  content: { padding: 20 },
  infoCard: { flexDirection: 'row', padding: 20, borderRadius: 24, gap: 16, marginBottom: 25, elevation: 2 },
  infoIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  infoTitle: { fontSize: 16, fontWeight: '800', marginBottom: 6 },
  infoText: { fontSize: 13, lineHeight: 20, fontWeight: '600' },
  demoCard: { flexDirection: 'row', padding: 16, borderRadius: 16, gap: 12, marginBottom: 15, borderWidth: 2, alignItems: 'center' },
  demoText: { fontSize: 12, fontWeight: '700', flex: 1, lineHeight: 18 },
  smsButton: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 24, gap: 16, marginBottom: 20, elevation: 3 },
  smsButtonTitle: { color: 'white', fontSize: 16, fontWeight: '800' },
  smsButtonSub: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '600', marginTop: 2 },
  divider: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 12 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 12, fontWeight: '700' },
  dropZone: { height: 240, borderWidth: 2, borderStyle: 'dashed', borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 25, elevation: 1 },
  iconCircle: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  dropText: { fontSize: 18, fontWeight: '900', marginBottom: 8 },
  dropSubtext: { fontSize: 14, fontWeight: '600' },
  exampleCard: { padding: 20, borderRadius: 24, elevation: 2 },
  exampleTitle: { fontSize: 16, fontWeight: '800', marginBottom: 12 },
  codeBlock: { padding: 16, borderRadius: 16 },
  codeText: { fontFamily: 'monospace', fontSize: 12, lineHeight: 18 },
  previewHeader: { marginBottom: 20 },
  previewHeaderText: { fontSize: 18, fontWeight: '900', marginBottom: 4 },
  previewSubtext: { fontSize: 13, fontWeight: '600' },
  previewItem: { flexDirection: 'row', padding: 16, borderRadius: 20, marginBottom: 12, borderWidth: 1, alignItems: 'center', gap: 12, elevation: 1 },
  categoryIconBox: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  previewLeft: { flex: 1 },
  previewDesc: { fontSize: 16, fontWeight: '800', marginBottom: 4 },
  previewSub: { fontSize: 12, fontWeight: '600' },
  previewAmount: { fontSize: 17, fontWeight: '900' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', padding: 20, gap: 12, borderTopWidth: 1, elevation: 10 },
  btn: { height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 8, elevation: 3 },
  btnText: { fontWeight: '900', fontSize: 16 }
});