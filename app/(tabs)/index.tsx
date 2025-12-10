// app/(tabs)/index.tsx

import React, { useState, useEffect } from "react"
// Combined imports from both files, including TouchableOpacity and router
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native"
import { Ionicons } from "@expo/vector-icons"
// Assuming these utilities are in a consistent location (../lib/providers, ../lib/firebase)
import { useAuthContext } from "../lib/providers" 
import { router } from "expo-router"
import { signOut } from "firebase/auth"
// NOTE: Assuming your firebase auth instance is accessible at "../lib/firebase" or similar
// I will use 'firebase/auth' and 'auth' from the first block's logic
import { auth } from "../lib/firebase" // ⭐️ FIX: Using local path, adjust if needed
import { Transaction } from '../types'; // ⭐️ FIX: Using local path, adjust if needed

// NOTE: Since the new UI TransactionItem is simpler, we are keeping the type from the old file
// and adding the required fields for the new UI to work smoothly.

// --- MOCK DATA AND ITEM COMPONENTS ---

// Defining the merged Transaction Interface (must match what's used in components and mocks)
interface DashboardTransaction {
    id: string;
    description: string;
    amount: number;
    category: string;
    type: "debit" | "credit";
    date: Date;
    // Fields required by the second mock's function signature, needed for compilation 
    userId?: string; 
    source?: string;
    createdAt?: any;
}

// Using the mock data structure and values from the first (more complete) block
const mockFetchRecentTransactions = async (): Promise<DashboardTransaction[]> => {
    await new Promise(resolve => setTimeout(resolve, 500)); // Shorter delay for dashboard

    return [
        {
            id: "1",
            description: "Zomato Order",
            amount: 450.5,
            category: "Food",
            type: "debit",
            date: new Date(Date.now() - 86400000),
        },
        {
            id: "2",
            description: "Monthly Salary",
            amount: 50000,
            category: "Income",
            type: "credit",
            date: new Date(Date.now() - 172800000),
        },
        {
            id: "3",
            description: "Uber Ride",
            amount: 180,
            category: "Travel",
            type: "debit",
            date: new Date(Date.now() - 259200000),
        },
    ] as DashboardTransaction[];
};


// Simple component for a single transaction row (Using the improved UI from the first block)
const TransactionItem = ({ transaction }: { transaction: DashboardTransaction }) => {
    const isDebit = transaction.type === "debit"
    const amountColor = isDebit ? "#EF4444" : "#10B981"
    const sign = isDebit ? "-" : "+"

    return (
        <View style={styles.transactionRow}>
            <View style={styles.transactionLeft}>
                {/* Dynamic Icon/Background based on debit/credit type */}
                <View style={[styles.categoryIcon, { backgroundColor: isDebit ? "#FEE2E2" : "#D1FAE5" }]}>
                    <Ionicons name={isDebit ? "arrow-down" : "arrow-up"} size={18} color={amountColor} />
                </View>
                <View>
                    <Text style={styles.transactionName}>{transaction.description}</Text>
                    {/* Simplified meta data to just category for clean dashboard view */}
                    <Text style={styles.transactionMeta}>{transaction.category}</Text>
                </View>
            </View>
            <Text style={[styles.transactionAmount, { color: amountColor }]}>
                {sign}₹{transaction.amount.toFixed(2)}
            </Text>
        </View>
    )
}

// --- DASHBOARD SCREEN COMPONENT ---

export default function DashboardScreen() {
    const { user } = useAuthContext();
    
    // Using the user name logic from the first block
    const userName = user?.displayName || user?.email?.split("@")[0] || "Guest";
    
    // State for transactions
    const [transactions, setTransactions] = useState<DashboardTransaction[]>([]); 
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Fetch data when the component mounts
        mockFetchRecentTransactions().then(data => {
            setTransactions(data);
            setIsLoading(false);
        });
    }, []);

    // New Logout Handler
    const handleLogout = async () => {
        try {
            await signOut(auth)
            router.replace("/login")
        } catch (error) {
            console.error("Logout error:", error)
        }
    }
    
    // Transaction Content Logic
    const transactionContent = isLoading ? (
        <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#0EA5E9" />
        </View>
    ) : (
        <View style={styles.transactionsList}>
            {transactions.map(item => (
                <TransactionItem key={item.id} transaction={item} />
            ))}
        </View>
    );


    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            
            {/* 1. Header with greeting (Improved UI) */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Hi, {userName} 👋</Text>
                    <Text style={styles.subgreeting}>Here's your financial snapshot</Text>
                </View>
                <TouchableOpacity activeOpacity={0.7} onPress={() => router.push("/profile")}> 
                    <View style={styles.profileAvatar}>
                        <Ionicons name="person" size={24} color="#0EA5E9" />
                    </View>
                </TouchableOpacity>
            </View>

            {/* 2. Main Balance Card (Improved UI) */}
            <View style={styles.balanceCard}>
                <View>
                    <Text style={styles.balanceLabel}>Total Balance</Text>
                    <Text style={styles.balanceAmount}>₹ 85,000</Text>
                    <Text style={styles.balanceChange}>+12% from last month</Text>
                </View>
                <View style={styles.balanceIcon}>
                    <Ionicons name="wallet" size={40} color="#0EA5E9" />
                </View>
            </View>
            
            {/* 3. Stats Grid (New Feature/Improved UI) */}
            <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                    <View style={[styles.statIcon, { backgroundColor: "#DBEAFE" }]}>
                        <Ionicons name="arrow-down" size={20} color="#0EA5E9" />
                    </View>
                    <Text style={styles.statLabel}>Spending</Text>
                    <Text style={styles.statValue}>₹15,300</Text>
                </View>
                <View style={styles.statCard}>
                    <View style={[styles.statIcon, { backgroundColor: "#D1FAE5" }]}>
                        <Ionicons name="arrow-up" size={20} color="#10B981" />
                    </View>
                    <Text style={styles.statLabel}>Income</Text>
                    <Text style={styles.statValue}>₹50,000</Text>
                </View>
                <View style={styles.statCard}>
                    <View style={[styles.statIcon, { backgroundColor: "#FEE2E2" }]}>
                        <Ionicons name="alert-circle" size={20} color="#EF4444" />
                    </View>
                    <Text style={styles.statLabel}>Savings</Text>
                    <Text style={styles.statValue}>34.7%</Text>
                </View>
            </View>

            {/* 4. Spending Alert (Improved UI) */}
            <View style={styles.alertCard}>
                <View style={styles.alertLeft}>
                    <Ionicons name="warning" size={24} color="#EA580C" />
                </View>
                <View style={styles.alertContent}>
                    <Text style={styles.alertTitle}>Budget Alert</Text>
                    <Text style={styles.alertText}>You've spent 78% of your Food budget</Text>
                </View>
            </View>

            {/* 5. Recent Transactions Section (Integrated List) */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Recent Transactions</Text>
                    {/* Link to the full transactions screen */}
                    <TouchableOpacity onPress={() => router.push("/transactions")}> 
                        <Text style={styles.seeAll}>See all</Text>
                    </TouchableOpacity>
                </View>
                {transactionContent}
            </View>

            {/* 6. Add Transaction Button (New Feature) */}
            <TouchableOpacity style={styles.addButton} onPress={() => router.push("/add-transaction")} activeOpacity={0.8}>
                <Ionicons name="add" size={24} color="white" />
                <Text style={styles.addButtonText}>Add Transaction</Text>
            </TouchableOpacity>

            {/* 7. Logout Button (New Feature) */}
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
                <Text style={styles.logoutBtnText}>Sign Out</Text>
            </TouchableOpacity>

        </ScrollView>
    )
}

// --- CONSOLIDATED STYLES (Used the superior styles from the first block) ---

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F0F9FF", // Lighter background
        paddingHorizontal: 16,
        paddingTop: 12,
    },
    // Header
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 24,
    },
    greeting: {
        fontSize: 28,
        fontWeight: "700",
        color: "#0F172A",
    },
    subgreeting: {
        fontSize: 14,
        color: "#64748B",
        marginTop: 4,
    },
    profileAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#DBEAFE",
        justifyContent: "center",
        alignItems: "center",
    },
    // Main Balance Card
    balanceCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },
    balanceLabel: {
        fontSize: 13,
        color: "#64748B",
        fontWeight: "500",
        marginBottom: 6,
    },
    balanceAmount: {
        fontSize: 32,
        fontWeight: "800",
        color: "#0F172A",
    },
    balanceChange: {
        fontSize: 12,
        color: "#10B981",
        marginTop: 4,
        fontWeight: "500",
    },
    balanceIcon: {
        opacity: 0.1,
    },
    // Stats Grid
    statsGrid: {
        flexDirection: "row",
        gap: 10,
        marginBottom: 20,
    },
    statCard: {
        flex: 1,
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 14,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 2,
    },
    statIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 8,
    },
    statLabel: {
        fontSize: 12,
        color: "#64748B",
        marginBottom: 4,
    },
    statValue: {
        fontSize: 16,
        fontWeight: "700",
        color: "#0F172A",
    },
    // Alert Card
    alertCard: {
        backgroundColor: "#FFFBEB",
        borderRadius: 16,
        padding: 14,
        flexDirection: "row",
        marginBottom: 24,
        borderLeftWidth: 4,
        borderLeftColor: "#EA580C", // Orange border for alert
    },
    alertLeft: {
        marginRight: 12,
    },
    alertContent: {
        flex: 1,
    },
    alertTitle: {
        fontSize: 14,
        fontWeight: "700",
        color: "#92400E",
    },
    alertText: {
        fontSize: 12,
        color: "#B45309",
        marginTop: 2,
    },
    // Sections & Headers
    section: {
        marginBottom: 20,
    },
    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#0F172A",
    },
    seeAll: {
        fontSize: 13,
        color: "#0EA5E9",
        fontWeight: "600",
    },
    // Transactions List
    transactionsList: {
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 2,
    },
    transactionRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#F1F5F9",
    },
    transactionLeft: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },
    categoryIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    transactionName: {
        fontSize: 14,
        fontWeight: "600",
        color: "#0F172A",
    },
    transactionMeta: {
        fontSize: 12,
        color: "#94A3B8",
        marginTop: 2,
    },
    transactionAmount: {
        fontSize: 14,
        fontWeight: "700",
    },
    loadingContainer: {
        paddingVertical: 20,
        alignItems: "center",
    },
    // Buttons
    addButton: {
        backgroundColor: "#0EA5E9",
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 14,
        padding: 14,
        marginBottom: 32,
        gap: 8,
        shadowColor: "#0EA5E9",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    addButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "700",
    },
    logoutBtn: {
        backgroundColor: "#EF4444",
        padding: 14,
        borderRadius: 10,
        alignItems: "center",
        marginBottom: 32,
    },
    logoutBtnText: {
        color: "white",
        fontSize: 16,
        fontWeight: "700",
    },
    // Clean up old styles that were not used/merged
    greenText: { color: "#10B981" },
    redText: { color: "#EF4444" },
});