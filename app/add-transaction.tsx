// src/screens/AddTransactionScreen.tsx

import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { addTransaction } from '../src/services/firestoreService';
import { router } from 'expo-router'; // Assuming you use expo-router for navigation

const CATEGORIES = ['Food', 'Travel', 'Bills', 'Shopping', 'Other'];

export default function AddTransactionScreen() {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [type, setType] = useState<'debit' | 'credit'>('debit');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    const transactionAmount = parseFloat(amount);

    if (isNaN(transactionAmount) || transactionAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount.');
      return;
    }
    
    if (!description.trim()) {
       Alert.alert('Error', 'Please enter a description.');
      return;
    }

    setLoading(true);

    try {
      await addTransaction({
        amount: transactionAmount,
        category: category,
        description: description.trim(),
        type: type,
        date: new Date(), // Use current date/time for manual entry
      });

      Alert.alert('Success', 'Transaction saved!');
      setAmount('');
      setDescription('');
      setCategory(CATEGORIES[0]);
      // Optional: Navigate back to the home screen
      // router.back(); 

    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to save transaction.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#0EA5E9" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Manual Transaction</Text>
      
      {/* Amount Input */}
      <TextInput
        style={styles.input}
        placeholder="Amount (e.g., 450.50)"
        keyboardType="numeric"
        value={amount}
        onChangeText={setAmount}
      />
      
      {/* Description Input */}
      <TextInput
        style={styles.input}
        placeholder="Description (e.g., Coffee at Cafe)"
        value={description}
        onChangeText={setDescription}
      />
      
      {/* Type Selector (Debit/Credit) */}
      <View style={styles.typeContainer}>
        <Button title="Expense (Debit)" color={type === 'debit' ? '#EF4444' : '#E2E8F0'} onPress={() => setType('debit')} />
        <Button title="Income (Credit)" color={type === 'credit' ? '#22C55E' : '#E2E8F0'} onPress={() => setType('credit')} />
      </View>

      {/* Category Picker (Simplified for now) */}
      <Text style={styles.label}>Category: {category}</Text>
      <View style={styles.categoryContainer}>
        {CATEGORIES.map(cat => (
          <Button 
            key={cat} 
            title={cat} 
            color={category === cat ? '#0EA5E9' : '#94A3B8'} 
            onPress={() => setCategory(cat)} 
          />
        ))}
      </View>

      <View style={styles.saveButton}>
        <Button title="Save Transaction" onPress={handleSave} color="#0EA5E9" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F8FAFC',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 30,
    color: '#1E293B',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    backgroundColor: 'white',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 8,
    color: '#475569',
  },
  typeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  saveButton: {
    marginTop: 20,
  }
});