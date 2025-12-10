import { View, Text, ScrollView, StyleSheet } from "react-native"
import { Ionicons } from "@expo/vector-icons"

// --- Data Structure for Transactions ---
const transactions = [
    {
        id: '1',
        description: 'Zomato Order',
        category: 'Food',
        date: '09/12/2025',
        amount: -450.50,
        icon: 'pizza', // New icon
        color: '#EF4444', // Red for expense
        bg: '#FEE2E2' // Light red background
    },
    {
        id: '2',
        description: 'Monthly Salary',
        category: 'Income',
        date: '08/12/2025',
        amount: 50000.00,
        icon: 'cash', // New icon
        color: '#10B981', // Green for income
        bg: '#D1FAE5' // Light green background
    },
    {
        id: '3',
        description: 'Uber Ride',
        category: 'Travel',
        date: '07/12/2025',
        amount: -180.00,
        icon: 'car', // New icon
        color: '#0EA5E9', // Blue for expense
        bg: '#DBEAFE' // Light blue background
    },
    {
        id: '4',
        description: 'Grocery Shopping',
        category: 'Shopping',
        date: '06/12/2025',
        amount: -1850.75,
        icon: 'basket',
        color: '#F97316',
        bg: '#FFEDD5'
    },
    {
        id: '5',
        description: 'Freelance Payment',
        category: 'Income',
        date: '05/12/2025',
        amount: 7500.00,
        icon: 'briefcase',
        color: '#10B981',
        bg: '#D1FAE5'
    }
]

// --- Reusable Transaction Item Component ---
interface TransactionItemProps {
    transaction: typeof transactions[0]
}

const TransactionItem = ({ transaction }: TransactionItemProps) => {
    const isIncome = transaction.amount > 0
    const sign = isIncome ? '+' : '-'
    const color = isIncome ? '#10B981' : transaction.color
    const amountText = `${sign}₹${Math.abs(transaction.amount).toFixed(2)}`

    return (
        <View style={styles.transactionItem}>
            <View style={[styles.iconContainer, { backgroundColor: transaction.bg }]}>
                <Ionicons name={transaction.icon as any} size={24} color={transaction.color} />
            </View>

            <View style={styles.detailsContainer}>
                <Text style={styles.descriptionText}>{transaction.description}</Text>
                <Text style={styles.categoryDateText}>{transaction.category} · {transaction.date}</Text>
            </View>

            <Text style={[styles.amountText, { color }]}>{amountText}</Text>
        </View>
    )
}


// --- Main Screen Component ---

export default function ActivityScreen() {
    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Recent Activity</Text>
                <Text style={styles.headerSubtitle}>A summary of your latest transactions</Text>
            </View>

            {/* Transaction List */}
            <View style={styles.transactionList}>
                {transactions.map(tx => (
                    <TransactionItem key={tx.id} transaction={tx} />
                ))}
            </View>

            <View style={{ height: 40 }} /> {/* Spacer for bottom tab */}
        </ScrollView>
    )
}

// --- Stylesheet ---

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F0F9FF", // Light background color from previous screens
        paddingHorizontal: 16,
        paddingTop: 12,
    },
    header: {
        marginBottom: 20,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: "700",
        color: "#0F172A",
    },
    headerSubtitle: {
        fontSize: 14,
        color: "#64748B",
        marginTop: 4,
    },
    transactionList: {
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 2,
    },
    transactionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    detailsContainer: {
        flex: 1,
    },
    descriptionText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#0F172A',
    },
    categoryDateText: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 2,
    },
    amountText: {
        fontSize: 15,
        fontWeight: '700',
    },
})