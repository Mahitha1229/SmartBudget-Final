// SmartBudget/app/_lib/autoCategorize.ts
// 🎯 CENTRALIZED AUTO-CATEGORIZATION SERVICE

import { CATEGORIES, CATEGORY_MAP } from '../../constants/category';
import { Ionicons } from '@expo/vector-icons';

/**
 * Auto-categorizes transactions based on description keywords
 * Uses the ACTUAL category names from constants/category.ts
 */
export const categorizeTransaction = (description: string): string => {
  const desc = description.toLowerCase();
  
  // Food & Dining keywords
  if (desc.includes('restaurant') || desc.includes('food') || desc.includes('cafe') || 
      desc.includes('coffee') || desc.includes('starbucks') || desc.includes('mcdonald') ||
      desc.includes('pizza') || desc.includes('burger') || desc.includes('zomato') ||
      desc.includes('swiggy') || desc.includes('ubereats') || desc.includes('dining') ||
      desc.includes('lunch') || desc.includes('dinner') || desc.includes('breakfast')) {
    return 'Food & Dining';
  }
  
  // Groceries keywords
  if (desc.includes('grocery') || desc.includes('supermarket') || desc.includes('walmart') ||
      desc.includes('costco') || desc.includes('target') || desc.includes('vegetables') ||
      desc.includes('fruits') || desc.includes('meat') || desc.includes('dairy') ||
      desc.includes('bigbasket') || desc.includes('grofers') || desc.includes('reliance fresh')) {
    return 'Groceries';
  }
  
  // Transportation keywords
  if (desc.includes('uber') || desc.includes('lyft') || desc.includes('taxi') || 
      desc.includes('gas') || desc.includes('fuel') || desc.includes('petrol') ||
      desc.includes('metro') || desc.includes('bus') || desc.includes('train') ||
      desc.includes('parking') || desc.includes('toll') || desc.includes('ola') ||
      desc.includes('auto') || desc.includes('rapido')) {
    return 'Transportation';
  }
  
  // Bills & Utilities keywords
  if (desc.includes('electric') || desc.includes('water') || desc.includes('gas bill') ||
      desc.includes('internet') || desc.includes('wifi') || desc.includes('phone bill') ||
      desc.includes('mobile recharge') || desc.includes('rent') || desc.includes('utility') ||
      desc.includes('dth') || desc.includes('cable') || desc.includes('maintenance')) {
    return 'Bills & Utilities';
  }
  
  // Shopping keywords
  if (desc.includes('amazon') || desc.includes('flipkart') || desc.includes('shopping') ||
      desc.includes('clothing') || desc.includes('shoes') || desc.includes('fashion') ||
      desc.includes('electronics') || desc.includes('myntra') || desc.includes('ajio') ||
      desc.includes('store') || desc.includes('mall') || desc.includes('retail')) {
    return 'Shopping';
  }
  
  // Entertainment keywords
  if (desc.includes('movie') || desc.includes('netflix') || desc.includes('spotify') ||
      desc.includes('prime video') || desc.includes('disney') || desc.includes('hotstar') ||
      desc.includes('game') || desc.includes('entertainment') || desc.includes('concert') ||
      desc.includes('theatre') || desc.includes('cinema')) {
    return 'Entertainment';
  }
  
  // Health & Fitness keywords
  if (desc.includes('doctor') || desc.includes('hospital') || desc.includes('pharmacy') ||
      desc.includes('medicine') || desc.includes('gym') || desc.includes('fitness') ||
      desc.includes('yoga') || desc.includes('health') || desc.includes('clinic') ||
      desc.includes('medical') || desc.includes('dental')) {
    return 'Health & Fitness';
  }
  
  // Education keywords
  if (desc.includes('school') || desc.includes('college') || desc.includes('university') ||
      desc.includes('course') || desc.includes('tuition') || desc.includes('books') ||
      desc.includes('education') || desc.includes('udemy') || desc.includes('coursera') ||
      desc.includes('stationery')) {
    return 'Education';
  }
  
  // Default to Other
  return 'Other';
};

/**
 * Get category icon for display
 */
export const getCategoryIcon = (categoryName: string): keyof typeof Ionicons.glyphMap => {
  const category = CATEGORY_MAP[categoryName];
  return category ? category.icon : 'ellipse';
};

/**
 * Get category color
 */
export const getCategoryColor = (categoryName: string): string => {
  const category = CATEGORY_MAP[categoryName];
  return category ? category.color : '#64748B';
};

/**
 * Validate if a category name is valid
 */
export const isValidCategory = (categoryName: string): boolean => {
  return CATEGORIES.some(cat => cat.name === categoryName);
};

/**
 * Get the closest matching category (fuzzy match)
 */
export const findClosestCategory = (categoryName: string): string => {
  const normalized = categoryName.toLowerCase().trim();
  
  // Try exact match first
  const exactMatch = CATEGORIES.find(cat => 
    cat.name.toLowerCase() === normalized
  );
  if (exactMatch) return exactMatch.name;
  
  // Try partial match
  const partialMatch = CATEGORIES.find(cat => 
    cat.name.toLowerCase().includes(normalized) ||
    normalized.includes(cat.name.toLowerCase())
  );
  if (partialMatch) return partialMatch.name;
  
  // Try auto-categorization as fallback
  return categorizeTransaction(categoryName);
};