// SmartBudget/app/_lib/smsParser.ts
// 📱 SMS TRANSACTION PARSER SERVICE

import { categorizeTransaction } from './autoCategorize';

export interface ParsedSMSTransaction {
  amount: number;
  description: string;
  category: string;
  type: 'debit' | 'credit';
  date: Date;
  merchant?: string;
  bankName?: string;
  cardLast4?: string;
  success: boolean;
  rawSMS?: string;
}

/**
 * Parse a bank SMS message into a transaction
 * Supports major Indian banks: HDFC, ICICI, SBI, Axis, Kotak, etc.
 */
export const parseBankSMS = (smsText: string, smsDate?: Date): ParsedSMSTransaction | null => {
  const text = smsText.toLowerCase().trim();
  
  // Check if it's a transaction SMS
  if (!isTransactionSMS(text)) {
    return null;
  }

  // Extract transaction type
  const isDebit = /debited|spent|paid|withdrawn|purchase|deducted/.test(text);
  const isCredit = /credited|received|deposited/.test(text);
  
  if (!isDebit && !isCredit) return null;

  // Extract amount (handles various formats)
  const amount = extractAmount(text);
  if (!amount || amount <= 0) return null;

  // Extract merchant/description
  const merchant = extractMerchant(text);
  const description = merchant || (isDebit ? 'Card Payment' : 'Credit');

  // Extract card info
  const cardLast4 = extractCardNumber(text);
  
  // Extract bank name
  const bankName = extractBankName(text);

  // Auto-categorize
  const category = categorizeTransaction(description);

  return {
    amount,
    description,
    category,
    type: isDebit ? 'debit' : 'credit',
    date: smsDate || new Date(),
    merchant: merchant || undefined,
    bankName: bankName || undefined,
    cardLast4: cardLast4 || undefined,
    success: true,
    rawSMS: smsText
  };
};

/**
 * Check if SMS is a transaction message
 */
const isTransactionSMS = (text: string): boolean => {
  // Must contain transaction keywords
  const hasTransactionKeyword = /debited|credited|spent|paid|withdrawn|deposited|purchase|received/.test(text);
  
  // Must contain amount pattern (₹ or rs or inr)
  const hasAmount = /(?:rs\.?|₹|inr)\s*[\d,]+(?:\.\d{2})?/.test(text);
  
  // Must contain account/card reference
  const hasAccountRef = /a\/c|account|card|xx\d{4}|\*\*\d{4}/.test(text);
  
  return hasTransactionKeyword && hasAmount && hasAccountRef;
};

/**
 * Extract amount from SMS (handles ₹, Rs, INR, commas, etc.)
 */
const extractAmount = (text: string): number | null => {
  // Pattern: Rs. 1,234.56 or ₹1234.56 or INR 1234
  const patterns = [
    /(?:rs\.?|₹|inr)\s*([\d,]+(?:\.\d{2})?)/i,
    /([\d,]+(?:\.\d{2})?)\s*(?:rs\.?|₹|inr)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const cleaned = match[1].replace(/,/g, '');
      const amount = parseFloat(cleaned);
      if (!isNaN(amount)) return amount;
    }
  }
  
  return null;
};

/**
 * Extract merchant name from SMS
 */
const extractMerchant = (text: string): string | null => {
  // Common patterns:
  // "at MERCHANT NAME"
  // "to MERCHANT NAME" 
  // "for MERCHANT NAME"
  // "on MERCHANT NAME"
  // "VIA MERCHANT NAME"
  
  const patterns = [
    /(?:at|to|for|on|via)\s+([A-Z][A-Z\s&\-\.]{2,30})(?:\s+on|\s+dated|\s+using|\.)/i,
    /(?:merchant|shop|store):\s*([A-Z][A-Z\s&\-\.]{2,30})/i,
    /info:\s*([A-Z][A-Z\s&\-\.]{2,30})/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }
  
  return null;
};

/**
 * Extract last 4 digits of card
 */
const extractCardNumber = (text: string): string | null => {
  const patterns = [
    /xx(\d{4})/i,
    /\*\*(\d{4})/i,
    /card\s+ending\s+(\d{4})/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1];
  }
  
  return null;
};

/**
 * Extract bank name from sender or content
 */
const extractBankName = (text: string): string | null => {
  const banks = [
    'HDFC', 'ICICI', 'SBI', 'Axis', 'Kotak', 'Yes Bank', 'IDFC',
    'IndusInd', 'Bank of Baroda', 'Punjab National', 'Canara',
    'Union Bank', 'Federal', 'RBL', 'Standard Chartered', 'HSBC'
  ];

  for (const bank of banks) {
    if (text.includes(bank.toLowerCase())) {
      return bank;
    }
  }
  
  return null;
};

/**
 * Batch parse multiple SMS messages
 */
export const parseBulkSMS = (messages: Array<{ text: string; date?: Date }>): ParsedSMSTransaction[] => {
  return messages
    .map(msg => parseBankSMS(msg.text, msg.date))
    .filter((t): t is ParsedSMSTransaction => t !== null);
};

/**
 * Test examples (for debugging)
 */
export const TEST_SMS_EXAMPLES = [
  {
    text: "Rs 1,250.00 debited from A/c XX1234 on 15-Jan-24 at ZOMATO BANGALORE using Card XX5678. Avl Bal: Rs 45,600.00 -HDFC Bank",
    expected: { amount: 1250, type: 'debit', merchant: 'ZOMATO BANGALORE', category: 'Food & Dining' }
  },
  {
    text: "Your A/c XX9876 is credited with INR 50,000.00 on 16-Jan-24. Info: SALARY JAN24. Avl Bal: Rs 95,600.00 -SBI",
    expected: { amount: 50000, type: 'credit', description: 'SALARY JAN24', category: 'Other' }
  },
  {
    text: "₹450 spent on Amazon India via card **1234 on 17-Jan-24. Available balance: ₹45,150 -Axis Bank",
    expected: { amount: 450, type: 'debit', merchant: 'Amazon India', category: 'Shopping' }
  }
];

/**
 * Validate parser accuracy (for testing)
 */
export const testParser = (): void => {
  console.log('🧪 Testing SMS Parser...\n');
  
  TEST_SMS_EXAMPLES.forEach((example, idx) => {
    const result = parseBankSMS(example.text);
    console.log(`Test ${idx + 1}:`, {
      input: example.text.substring(0, 50) + '...',
      parsed: result,
      expected: example.expected,
      passed: result?.amount === example.expected.amount && 
              result?.type === example.expected.type
    });
  });
};