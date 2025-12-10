// app/(tabs)/budget.tsx

"use client"

import { useState } from "react"
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Modal } from "react-native"
import { Ionicons } from "@expo/vector-icons"

// --- INTERFACES AND MOCK DATA ---

interface Budget {
    id: string
    category: string
    limit: number
    spent: number
    icon: string
    color: string
}

const mockBudgets: Budget[] = [
    { id: "1", category: "Food & Dining", limit: 8000, spent: 5500, icon: "restaurant", color: "#FF6B6B" },
    { id: "2", category: "Travel", limit: 5000, spent: 1200, icon: "car", color: "#4ECDC4" },
    { id: "3", category: "Shopping", limit: 4000, spent: 3100, icon: "bag-handle", color: "#FFE66D" },
    { id: "4", category: "Entertainment", limit: 3000, spent: 2800, icon: "film", color: "#95E1D3" },
    { id: "5", category: "Utilities", limit: 2000, spent: 1950, icon: "flash", color: "#FF85A2" },
]

// --- COMPONENTS ---

const BudgetItem = ({ budget }: { budget: Budget }) => {
    const progress = Math.min((budget.spent / budget.limit) * 100, 100)
    const remaining = budget.limit - budget.spent
    const isWarning = progress > 75
    const isExceeded = budget.spent > budget.limit

    return (
        <View style={styles.budgetItem}>
            <View style={styles.budgetHeader}>
                <View style={[styles.categoryIconBg, { backgroundColor: budget.color + "20" }]}>
                    <Ionicons name={budget.icon as any} size={20} color={budget.color} />
                </View>
                <View style={styles.budgetInfo}>
                    <Text style={styles.categoryName}>{budget.category}</Text>
                    <Text style={styles.spentText}>
                        Spent ₹{budget.spent.toLocaleString()} / ₹{budget.limit.toLocaleString()}
                    </Text>
                </View>
            </View>

            <View style={styles.progressBarContainer}>
                <View
                    style={[
                        styles.progressBar,
                        {
                            width: `${Math.min(progress, 100)}%`,
                            // Dynamic color logic based on spending progress
                            backgroundColor: isExceeded ? "#EF4444" : isWarning ? "#F97316" : "#0EA5E9",
                        },
                    ]}
                />
            </View>

            <View style={styles.budgetFooter}>
                <Text style={[styles.remainingText, { color: isExceeded ? "#EF4444" : "#10B981" }]}>
                    {isExceeded
                        ? `Over by ₹{(budget.spent - budget.limit).toLocaleString()}`
                        : `₹${remaining.toLocaleString()} left`}
                </Text>
                <Text style={styles.percentText}>{progress.toFixed(0)}%</Text>
            </View>
        </View>
    )
}

// --- MAIN SCREEN ---

export default function BudgetScreen() {
    // State for the Add Budget Modal (New Feature)
    const [showAddModal, setShowAddModal] = useState(false)
    const [newBudgetName, setNewBudgetName] = useState("")
    const [newBudgetLimit, setNewBudgetLimit] = useState("")

    // Calculations for the Summary Card
    const totalBudget = mockBudgets.reduce((sum, b) => sum + b.limit, 0)
    const totalSpent = mockBudgets.reduce((sum, b) => sum + b.spent, 0)

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Monthly Budgets</Text>
                <Text style={styles.headerSubtitle}>Manage your spending limits</Text>
            </View>

            {/* Summary Card (New Feature) */}
            <View style={styles.summaryCard}>
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Total Budget</Text>
                    <Text style={styles.summaryAmount}>₹{totalBudget.toLocaleString()}</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Total Spent</Text>
                    <Text style={[styles.summaryAmount, { color: "#EF4444" }]}>₹{totalSpent.toLocaleString()}</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Remaining</Text>
                    <Text style={[styles.summaryAmount, { color: "#10B981" }]}>
                        ₹{(totalBudget - totalSpent).toLocaleString()}
                    </Text>
                </View>
            </View>

            {/* Overall Progress (New Feature) */}
            <View style={styles.overallProgressCard}>
                <View style={styles.progressHeader}>
                    <Text style={styles.progressLabel}>Overall Progress</Text>
                    <Text style={styles.progressPercent}>{((totalSpent / totalBudget) * 100).toFixed(0)}%</Text>
                </View>
                <View style={styles.largeProgressBar}>
                    <View 
                        style={[
                            styles.largeProgressFill, 
                            { width: `${Math.min((totalSpent / totalBudget) * 100, 100)}%` }
                        ]} 
                    />
                </View>
            </View>

            {/* Budget Items */}
            <View style={styles.budgetsSection}>
                <Text style={styles.sectionTitle}>Category Budgets</Text>
                {mockBudgets.map((budget) => (
                    <BudgetItem key={budget.id} budget={budget} />
                ))}
            </View>

            {/* Add Budget Button (New Feature) */}
            <TouchableOpacity style={styles.addBudgetBtn} onPress={() => setShowAddModal(true)} activeOpacity={0.8}>
                <Ionicons name="add" size={22} color="white" />
                <Text style={styles.addBudgetText}>Set New Budget</Text>
            </TouchableOpacity>

            {/* Add Budget Modal (New Feature) */}
            <Modal visible={showAddModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Create Budget</Text>
                            <TouchableOpacity onPress={() => setShowAddModal(false)}>
                                <Ionicons name="close" size={24} color="#0F172A" />
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            style={styles.input}
                            placeholder="Category name"
                            value={newBudgetName}
                            onChangeText={setNewBudgetName}
                            placeholderTextColor="#94A3B8"
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Budget limit (₹)"
                            value={newBudgetLimit}
                            onChangeText={setNewBudgetLimit}
                            keyboardType="numeric"
                            placeholderTextColor="#94A3B8"
                        />

                        <TouchableOpacity style={styles.modalButton} activeOpacity={0.8}>
                            <Text style={styles.modalButtonText}>Save Budget</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    )
}

// --- STYLESHEET ---

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F0F9FF",
        paddingHorizontal: 16,
        paddingTop: 12,
    },
    // Header
    header: {
        marginBottom: 24,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: "700",
        color: "#0F172A",
    },
    headerSubtitle: {
        fontSize: 14,
        color: "#64748B",
        marginTop: 4,
    },
    // Summary Card
    summaryCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 16,
        flexDirection: "row",
        justifyContent: "space-around",
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 2,
    },
    summaryItem: {
        flex: 1,
        alignItems: "center",
    },
    summaryLabel: {
        fontSize: 12,
        color: "#64748B",
        marginBottom: 6,
    },
    summaryAmount: {
        fontSize: 16,
        fontWeight: "700",
        color: "#0F172A",
    },
    summaryDivider: {
        width: 1,
        backgroundColor: "#E2E8F0",
        marginHorizontal: 8,
    },
    // Overall Progress
    overallProgressCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 2,
    },
    progressHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    progressLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: "#0F172A",
    },
    progressPercent: {
        fontSize: 18,
        fontWeight: "700",
        color: "#0EA5E9",
    },
    largeProgressBar: {
        height: 12,
        backgroundColor: "#E2E8F0",
        borderRadius: 6,
        overflow: "hidden",
    },
    largeProgressFill: {
        height: "100%",
        backgroundColor: "#0EA5E9",
        borderRadius: 6,
    },
    // Budget Items Section
    budgetsSection: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#0F172A",
        marginBottom: 12,
    },
    // Single Budget Item
    budgetItem: {
        backgroundColor: "#FFFFFF",
        borderRadius: 14,
        padding: 14,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 2,
    },
    budgetHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
    },
    categoryIconBg: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    budgetInfo: {
        flex: 1,
    },
    categoryName: {
        fontSize: 14,
        fontWeight: "700",
        color: "#0F172A",
    },
    spentText: {
        fontSize: 12,
        color: "#64748B",
        marginTop: 2,
    },
    progressBarContainer: {
        height: 8,
        backgroundColor: "#E2E8F0",
        borderRadius: 4,
        marginBottom: 8,
        overflow: "hidden",
    },
    progressBar: {
        height: "100%",
        borderRadius: 4,
    },
    budgetFooter: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    remainingText: {
        fontSize: 12,
        fontWeight: "600",
    },
    percentText: {
        fontSize: 12,
        fontWeight: "700",
        color: "#64748B",
    },
    // Add Budget Button
    addBudgetBtn: {
        backgroundColor: "#0EA5E9",
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 12,
        padding: 14,
        marginBottom: 32,
        gap: 8,
        shadowColor: "#0EA5E9",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    addBudgetText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "700",
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "flex-end",
    },
    modalContent: {
        backgroundColor: "#FFFFFF",
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        paddingBottom: 32,
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#0F172A",
    },
    input: {
        borderWidth: 1,
        borderColor: "#E2E8F0",
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        marginBottom: 12,
        fontSize: 16,
        color: "#0F172A",
    },
    modalButton: {
        backgroundColor: "#0EA5E9",
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: "center",
        marginTop: 20,
    },
    modalButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "700",
    },
})