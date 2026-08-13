// SmartBudget/app/_lib/smsModule.ts
// 🔄 HYBRID SMS MODULE with Custom Expo Module

import { Platform } from 'react-native';

// Try to import our custom module
let ExpoSmsReader: any = null;

try {
  if (Platform.OS === 'android') {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- native module must be conditionally required, not statically imported
    ExpoSmsReader = require('../../modules/expo-sms-reader').default;
    
    // Double-check if it's actually available
    if (ExpoSmsReader && typeof ExpoSmsReader.isAvailable === 'function') {
      const available = ExpoSmsReader.isAvailable();
      if (available) {
        console.log('✅ Custom SMS Module loaded and available');
      } else {
        console.log('⚠️ Custom SMS Module loaded but not available (not linked/built)');
        ExpoSmsReader = null; // Reset to null so we use demo mode
      }
    } else {
      console.log('⚠️ Custom SMS Module loaded but missing isAvailable method');
      ExpoSmsReader = null;
    }
  }
} catch {
  console.log('📱 Custom SMS module not available, will use demo mode');
}

export interface SMSMessage {
  _id: string;
  address: string;
  body: string;
  date: string;
  read: string;
}

export interface SMSFilter {
  box?: 'inbox' | 'sent' | 'draft' | 'outbox' | 'failed' | 'queued';
  minDate?: number;
  maxDate?: number;
  maxCount?: number;
  read?: number;
  indexFrom?: number;
  address?: string;
}

/**
 * Check if native SMS reading is available
 */
export const isSMSAvailable = (): boolean => {
  const isAvailable = Platform.OS === 'android' && 
                      ExpoSmsReader !== null && 
                      typeof ExpoSmsReader?.readSMS === 'function';
  
  return isAvailable;
};

/**
 * Read SMS messages from device (native only)
 */
export const readSMS = async (
  maxCount: number = 500, 
  daysBack: number = 180
): Promise<SMSMessage[]> => {
  if (!isSMSAvailable()) {
    console.log('⚠️ SMS reading not available');
    return [];
  }

  try {
    const minDate = Date.now() - (daysBack * 24 * 60 * 60 * 1000);
    
    const filter: SMSFilter = {
      box: 'inbox',
      maxCount,
      minDate,
    };

    console.log('📱 Reading SMS with filter:', filter);
    
    const messages = await ExpoSmsReader.readSMS(filter);
    
    if (!messages || !Array.isArray(messages)) {
      console.log('⚠️ No messages returned from native module');
      return [];
    }
    
    console.log(`✅ Successfully read ${messages.length} SMS messages from device`);
    
    return messages;
  } catch (error) {
    console.error('❌ Failed to read SMS:', error);
    return [];
  }
};

/**
 * Get demo/mock SMS messages (for testing)
 */
export const getDemoSMS = async (): Promise<SMSMessage[]> => {
  console.log('🎭 Loading demo SMS data...');
  await new Promise(resolve => setTimeout(resolve, 1000));

  const now = Date.now();
  
  const demoMessages: SMSMessage[] = [
    {
      _id: '1',
      address: 'VM-HDFCBK',
      body: 'Rs 1,250.00 debited from A/c XX1234 on 15-Jan-24 at ZOMATO BANGALORE using Card XX5678. Avl Bal: Rs 45,600.00 -HDFC Bank',
      date: String(now - (13 * 24 * 60 * 60 * 1000)),
      read: '1'
    },
    {
      _id: '2',
      address: 'SBI',
      body: 'Your A/c XX9876 is credited with INR 50,000.00 on 16-Jan-24. Info: SALARY JAN24. Avl Bal: Rs 95,600.00 -SBI',
      date: String(now - (12 * 24 * 60 * 60 * 1000)),
      read: '1'
    },
    {
      _id: '3',
      address: 'AX-AXISBK',
      body: '₹450 spent on Amazon India via card **1234 on 17-Jan-24. Available balance: ₹45,150 -Axis Bank',
      date: String(now - (11 * 24 * 60 * 60 * 1000)),
      read: '1'
    },
    {
      _id: '4',
      address: 'VM-ICICIB',
      body: 'INR 280.00 debited from card ending 5678 for UBER TRIP on 18-Jan-24. Available: Rs 44,870 -ICICI',
      date: String(now - (10 * 24 * 60 * 60 * 1000)),
      read: '1'
    },
    {
      _id: '5',
      address: 'KOTAKB',
      body: 'Rs.750 paid to SWIGGY using UPI on 19-Jan-24. Balance: Rs.44,120 -Kotak',
      date: String(now - (9 * 24 * 60 * 60 * 1000)),
      read: '1'
    },
    {
      _id: '6',
      address: 'VM-HDFCBK',
      body: 'Rs 2,500.00 debited from A/c XX1234 at BIG BAZAAR BANGALORE on 20-Jan-24. Avl Bal: Rs 41,620.00',
      date: String(now - (8 * 24 * 60 * 60 * 1000)),
      read: '1'
    },
    {
      _id: '7',
      address: 'PAYTM',
      body: 'INR 150 debited from Paytm wallet for MOBILE RECHARGE on 21-Jan-24. Balance: Rs 850',
      date: String(now - (7 * 24 * 60 * 60 * 1000)),
      read: '1'
    },
    {
      _id: '8',
      address: 'AX-AXISBK',
      body: '₹3200 spent on APOLLO PHARMACY via card **1234 on 22-Jan-24. Available balance: ₹38,420',
      date: String(now - (6 * 24 * 60 * 60 * 1000)),
      read: '1'
    },
  ];
  
  console.log(`✅ Loaded ${demoMessages.length} demo messages`);
  return demoMessages;
};

/**
 * Read SMS with automatic fallback to demo data
 */
export const readSMSWithFallback = async (
  maxCount: number = 500,
  daysBack: number = 180
): Promise<{ messages: SMSMessage[], isDemo: boolean }> => {
  if (isSMSAvailable()) {
    console.log('📱 Attempting to read real SMS...');
    const messages = await readSMS(maxCount, daysBack);
    if (messages.length > 0) {
      console.log(`✅ Got ${messages.length} real SMS messages`);
      return { messages, isDemo: false };
    }
    console.log('⚠️ No messages from native module, falling back to demo');
  } else {
    console.log('📱 Native SMS not available, using demo data');
  }
  
  const messages = await getDemoSMS();
  return { messages, isDemo: true };
};