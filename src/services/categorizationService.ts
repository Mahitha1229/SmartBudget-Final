// src/services/categorizationService.ts

export interface CategoryRule {
  category: string;
  keywords: string[];
  patterns: RegExp[];
  priority: number; // Higher priority rules are checked first
}

// Comprehensive merchant keyword mapping
const CATEGORY_RULES: CategoryRule[] = [
  // Food & Dining
  {
    category: 'Food & Dining',
    keywords: [
      'swiggy', 'zomato', 'ubereats', 'dominos', 'pizza', 'mcdonald',
      'kfc', 'subway', 'starbucks', 'cafe', 'restaurant', 'food',
      'dunkin', 'burger', 'biryani', 'dunkin', 'food court',
    ],
    patterns: [
      /swiggy/i,
      /zomato/i,
      /food.*delivery/i,
      /restaurant/i,
      /cafe|coffee/i,
    ],
    priority: 10,
  },

  // Transportation
  {
    category: 'Transportation',
    keywords: [
      'uber', 'ola', 'rapido', 'metro', 'petrol', 'fuel', 'gas',
      'parking', 'toll', 'fasttag', 'car', 'bike', 'taxi', 'cab',
      'railway', 'irctc', 'bus', 'auto', 'paytm toll', 'diesel',
    ],
    patterns: [
      /uber|ola|rapido/i,
      /fuel|petrol|diesel/i,
      /parking|toll/i,
      /metro|railway|irctc/i,
    ],
    priority: 10,
  },

  // Shopping
  {
    category: 'Shopping',
    keywords: [
      'amazon', 'flipkart', 'myntra', 'ajio', 'meesho', 'nykaa',
      'shopping', 'mall', 'store', 'retail', 'supermarket', 'bigbasket',
      'blinkit', 'instamart', 'jiomart', 'dmart', 'reliance',
    ],
    patterns: [
      /amazon|flipkart|myntra/i,
      /shopping|retail/i,
      /supermarket|grocery/i,
    ],
    priority: 9,
  },

  // Entertainment
  {
    category: 'Entertainment',
    keywords: [
      'netflix', 'prime', 'hotstar', 'spotify', 'youtube', 'gaana',
      'movie', 'cinema', 'pvr', 'inox', 'bookmyshow', 'game',
      'playstation', 'xbox', 'steam', 'jio cinema',
    ],
    patterns: [
      /netflix|prime.*video|hotstar/i,
      /spotify|gaana|music/i,
      /movie|cinema|pvr|inox/i,
      /gaming|playstation|xbox/i,
    ],
    priority: 9,
  },

  // Bills & Utilities
  {
    category: 'Bills & Utilities',
    keywords: [
      'electricity', 'water', 'gas', 'internet', 'broadband', 'wifi',
      'mobile', 'recharge', 'postpaid', 'airtel', 'jio', 'vodafone',
      'bsnl', 'tata', 'bill', 'utility', 'rent', 'maintenance',
    ],
    patterns: [
      /electricity|power.*bill/i,
      /water.*bill/i,
      /internet|broadband|wifi/i,
      /mobile|recharge|postpaid/i,
      /rent|maintenance/i,
    ],
    priority: 8,
  },

  // Healthcare
  {
    category: 'Healthcare',
    keywords: [
      'hospital', 'clinic', 'doctor', 'medical', 'pharmacy', 'medicine',
      'health', 'apollo', 'medplus', 'netmeds', '1mg', 'pharmeasy',
      'lab', 'diagnostic', 'insurance', 'health insurance',
    ],
    patterns: [
      /hospital|clinic|doctor/i,
      /pharmacy|medicine|medical/i,
      /health.*insurance/i,
    ],
    priority: 8,
  },

  // Education
  {
    category: 'Education',
    keywords: [
      'school', 'college', 'university', 'tuition', 'course', 'udemy',
      'coursera', 'books', 'education', 'fees', 'exam', 'upgrad',
      'byjus', 'unacademy', 'study', 'coaching',
    ],
    patterns: [
      /school|college|university/i,
      /course|tuition|coaching/i,
      /education|study/i,
    ],
    priority: 7,
  },

  // Travel
  {
    category: 'Travel',
    keywords: [
      'flight', 'hotel', 'makemytrip', 'goibibo', 'cleartrip', 'booking',
      'agoda', 'oyo', 'airbnb', 'travel', 'vacation', 'trip', 'tour',
      'indigo', 'air india', 'spicejet', 'vistara',
    ],
    patterns: [
      /flight|airline|air.*india/i,
      /hotel|oyo|airbnb/i,
      /travel|vacation|trip/i,
    ],
    priority: 7,
  },

  // Investment & Savings
  {
    category: 'Investment',
    keywords: [
      'mutual fund', 'sip', 'stock', 'zerodha', 'groww', 'upstox',
      'investment', 'equity', 'shares', 'gold', 'crypto', 'fd',
      'deposit', 'savings', 'ppf', 'nps',
    ],
    patterns: [
      /mutual.*fund|sip/i,
      /stock|equity|shares/i,
      /investment|invest/i,
    ],
    priority: 6,
  },

  // Personal Care
  {
    category: 'Personal Care',
    keywords: [
      'salon', 'spa', 'gym', 'fitness', 'yoga', 'beauty', 'grooming',
      'cult.fit', 'urban company', 'lakme', 'haircut', 'massage',
    ],
    patterns: [
      /salon|spa|beauty/i,
      /gym|fitness|yoga/i,
      /grooming|haircut/i,
    ],
    priority: 6,
  },

  // Insurance
  {
    category: 'Insurance',
    keywords: [
      'insurance', 'premium', 'policy', 'lic', 'hdfc.*life', 'icici.*prudential',
      'term.*insurance', 'health.*insurance',
    ],
    patterns: [
      /insurance|premium/i,
      /policy/i,
    ],
    priority: 5,
  },

  // Other (Lowest priority - catch-all)
  {
    category: 'Other',
    keywords: [],
    patterns: [],
    priority: 0,
  },
];

export class CategorizationService {
  /**
   * Auto-categorize a transaction based on merchant/description
   */
  static categorize(description: string, merchant?: string | undefined): string {
    const text = `${description} ${merchant || ''}`.toLowerCase();

    // Sort rules by priority (highest first)
    const sortedRules = [...CATEGORY_RULES].sort((a, b) => b.priority - a.priority);

    for (const rule of sortedRules) {
      // Skip 'Other' category initially
      if (rule.category === 'Other') continue;

      // Check keywords
      if (rule.keywords.some((keyword) => text.includes(keyword.toLowerCase()))) {
        return rule.category;
      }

      // Check regex patterns
      if (rule.patterns.some((pattern) => pattern.test(text))) {
        return rule.category;
      }
    }

    // Default to 'Other'
    return 'Other';
  }

  /**
   * Get confidence score for categorization (0-1)
   */
  static getConfidence(description: string, category: string, merchant?: string | undefined): number {
    const text = `${description} ${merchant || ''}`.toLowerCase();
    const rule = CATEGORY_RULES.find((r) => r.category === category);

    if (!rule) return 0;

    // Count keyword matches
    const keywordMatches = rule.keywords.filter((keyword) =>
      text.includes(keyword.toLowerCase())
    ).length;

    // Count pattern matches
    const patternMatches = rule.patterns.filter((pattern) =>
      pattern.test(text)
    ).length;

    // Calculate confidence
    const totalMatches = keywordMatches + patternMatches;
    const possibleMatches = rule.keywords.length + rule.patterns.length;

    if (possibleMatches === 0) return 0.3; // Low confidence for 'Other'

    const confidence = Math.min(totalMatches / possibleMatches, 1);

    // Boost confidence based on rule priority
    return Math.min(confidence + (rule.priority / 100), 1);
  }

  /**
   * Get all possible categories for a transaction with confidence scores
   */
  static getCategoryProbabilities(
    description: string,
    merchant?: string | undefined
  ): Array<{ category: string; confidence: number }> {
    const text = `${description} ${merchant || ''}`.toLowerCase();
    const probabilities: Array<{ category: string; confidence: number }> = [];

    for (const rule of CATEGORY_RULES) {
      if (rule.category === 'Other') continue;

      const confidence = this.getConfidence(description, rule.category, merchant);
      if (confidence > 0.1) {
        // Only include if somewhat confident
        probabilities.push({
          category: rule.category,
          confidence,
        });
      }
    }

    // Sort by confidence
    return probabilities.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Batch categorize multiple transactions
   */
  static batchCategorize(
    transactions: Array<{ description: string; merchant?: string }>
  ): Array<{ category: string; confidence: number }> {
    return transactions.map((t) => ({
      category: this.categorize(t.description, t.merchant),
      confidence: this.getConfidence(
        t.description,
        this.categorize(t.description, t.merchant),
        t.merchant
      ),
    }));
  }

  /**
   * Learn from user corrections (for future ML enhancement)
   */
  static learnFromCorrection(
    description: string,
    originalCategory: string,
    correctedCategory: string,
    merchant?: string | undefined
  ): void {
    // TODO: Store this data for ML training
    // For now, just log it
    console.log('Learning from correction:', {
      description,
      merchant,
      from: originalCategory,
      to: correctedCategory,
    });

    // In production, save to Firestore:
    // await firestoreService.saveCategoryCorrection({...})
  }

  /**
   * Add custom rule (for user-defined categorization)
   */
  static addCustomRule(rule: CategoryRule): void {
    CATEGORY_RULES.push(rule);
  }

  /**
   * Get all available categories
   */
  static getAllCategories(): string[] {
    return [...new Set(CATEGORY_RULES.map((r) => r.category))];
  }
}

// ============================================================================
// ML-Enhanced Categorization (Optional Advanced Feature)
// ============================================================================

export interface MLCategorizationConfig {
  apiKey?: string;
  endpoint?: string;
  model?: string;
}

export class MLCategorizationService {
  private config: MLCategorizationConfig;

  constructor(config: MLCategorizationConfig = {}) {
    this.config = config;
  }

  /**
   * Use Claude API to categorize transaction when rule-based fails
   */
  async categorizWithAI(
    description: string,
    merchant?: string | undefined
  ): Promise<{ category: string; confidence: number }> {
    try {
      // First try rule-based
      const ruleBasedCategory = CategorizationService.categorize(description, merchant);
      const ruleBasedConfidence = CategorizationService.getConfidence(
        description,
        ruleBasedCategory,
        merchant
      );

      // If high confidence, use rule-based result
      if (ruleBasedConfidence > 0.7) {
        return {
          category: ruleBasedCategory,
          confidence: ruleBasedConfidence,
        };
      }

      // Otherwise, use AI (implement when needed)
      // const aiResult = await this.callClaudeAPI(description, merchant);
      // return aiResult;

      // For now, return rule-based result
      return {
        category: ruleBasedCategory,
        confidence: ruleBasedConfidence,
      };
    } catch (error) {
      console.error('Error in ML categorization:', error);
      // Fallback to rule-based
      return {
        category: CategorizationService.categorize(description, merchant),
        confidence: 0.5,
      };
    }
  }

  /**
   * Call Claude API for categorization (implement when needed)
   */
  private async callClaudeAPI(
    description: string,
    merchant?: string | undefined
  ): Promise<{ category: string; confidence: number }> {
    // TODO: Implement Claude API call
    // const response = await fetch('https://api.anthropic.com/v1/messages', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'x-api-key': this.config.apiKey,
    //     'anthropic-version': '2023-06-01',
    //   },
    //   body: JSON.stringify({
    //     model: 'claude-3-haiku-20240307',
    //     max_tokens: 100,
    //     messages: [{
    //       role: 'user',
    //       content: `Categorize this transaction: "${description}" at "${merchant}". Categories: ${CategorizationService.getAllCategories().join(', ')}. Reply with just the category name.`
    //     }]
    //   })
    // });

    throw new Error('Not implemented');
  }
}

// Example usage:
/*
const category = CategorizationService.categorize(
  "Payment to SWIGGY BANGALORE",
  "SWIGGY"
);
console.log(category); // "Food & Dining"

const confidence = CategorizationService.getConfidence(
  "Payment to SWIGGY BANGALORE",
  "Food & Dining",
  "SWIGGY"
);
console.log(confidence); // 0.95

const probabilities = CategorizationService.getCategoryProbabilities(
  "Payment to UNKNOWN MERCHANT"
);
console.log(probabilities);
// [
//   { category: "Shopping", confidence: 0.4 },
//   { category: "Other", confidence: 0.3 }
// ]
*/