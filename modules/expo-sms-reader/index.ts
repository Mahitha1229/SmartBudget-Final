// SmartBudget/modules/expo-sms-reader/index.ts

import { NativeModules, Platform } from 'react-native';

export interface SMSFilter {
  box?: 'inbox' | 'sent' | 'draft' | 'outbox' | 'failed' | 'queued';
  minDate?: number;
  maxDate?: number;
  maxCount?: number;
  read?: number;
  indexFrom?: number;
  address?: string;
}

export interface SMSMessage {
  _id: string;
  address: string;
  body: string;
  date: string;
  read: string;
}

// Check if the native module exists
const ExpoSmsReaderNative = NativeModules.ExpoSmsReader;

/**
 * Read SMS messages from device
 */
const readSMS = async (filter: SMSFilter = {}): Promise<SMSMessage[]> => {
  if (Platform.OS !== 'android') {
    console.warn('📱 SMS reading is only available on Android');
    return [];
  }

  if (!ExpoSmsReaderNative) {
    console.warn('📱 Native SMS module not found - module not linked or not built');
    return [];
  }

  try {
    const messages = await ExpoSmsReaderNative.readSMS(filter);
    return messages || [];
  } catch (error) {
    console.error('📱 Error reading SMS from native module:', error);
    return [];
  }
};

/**
 * Check if SMS reading is available
 */
const isAvailable = (): boolean => {
  const available = Platform.OS === 'android' && !!ExpoSmsReaderNative;
  
  if (!available) {
    console.log('📱 SMS Module not available:', {
      platform: Platform.OS,
      nativeModuleExists: !!ExpoSmsReaderNative
    });
  }
  
  return available;
};

export default {
  readSMS,
  isAvailable,
};