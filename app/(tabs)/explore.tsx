import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native"
import { Ionicons } from "@expo/vector-icons"
// Removed template-specific imports: Image, Platform, Collapsible, ExternalLink, ParallaxScrollView, ThemedText, ThemedView, IconSymbol, Fonts

// Renamed and Exported the component
export default function ExploreScreen() {
    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Financial Insights</Text>
                <Text style={styles.headerSubtitle}>Discover ways to save more</Text>
            </View>

            {/* Spending Trends */}
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <View style={styles.cardTitleContainer}>
                        <View style={[styles.cardIcon, { backgroundColor: "#DBEAFE" }]}>
                            <Ionicons name="trending-up" size={20} color="#0EA5E9" />
                        </View>
                        <View>
                            <Text style={styles.cardTitle}>Spending Trends</Text>
                            <Text style={styles.cardSubtitle}>This month vs last month</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.trendContent}>
                    <View style={styles.trendItem}>
                        <Text style={styles.trendLabel}>Food & Dining</Text>
                        <View style={styles.trendComparison}>
                            <Text style={styles.trendAmount}>₹5,500</Text>
                            <View style={[styles.trendBadge, { backgroundColor: "#FEE2E2" }]}>
                                <Ionicons name="arrow-up" size={14} color="#EF4444" />
                                <Text style={[styles.trendPercent, { color: "#EF4444" }]}>12%</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.trendItem}>
                        <Text style={styles.trendLabel}>Travel</Text>
                        <View style={styles.trendComparison}>
                            <Text style={styles.trendAmount}>₹1,200</Text>
                            <View style={[styles.trendBadge, { backgroundColor: "#D1FAE5" }]}>
                                <Ionicons name="arrow-down" size={14} color="#10B981" />
                                <Text style={[styles.trendPercent, { color: "#10B981" }]}>5%</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.trendItem}>
                        <Text style={styles.trendLabel}>Shopping</Text>
                        <View style={styles.trendComparison}>
                            <Text style={styles.trendAmount}>₹3,100</Text>
                            <View style={[styles.trendBadge, { backgroundColor: "#FEE2E2" }]}>
                                <Ionicons name="arrow-up" size={14} color="#EF4444" />
                                <Text style={[styles.trendPercent, { color: "#EF4444" }]}>8%</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </View>

            {/* Savings Goals */}
            <View style={styles.card}>
                <View style={[styles.cardIcon, { backgroundColor: "#D1FAE5", width: 44, height: 44 }]}>
                    <Ionicons name="trophy" size={20} color="#10B981" />
                </View>
                <Text style={styles.cardTitle}>Savings Goals</Text>
                <Text style={styles.cardSubtitle}>Track your financial goals</Text>

                <View style={styles.goalItem}>
                    <View style={styles.goalInfo}>
                        <Text style={styles.goalName}>Emergency Fund</Text>
                        <Text style={styles.goalAmount}>₹25,000 / ₹50,000</Text>
                    </View>
                    <Text style={styles.goalPercent}>50%</Text>
                </View>

                <View style={styles.goalProgressBar}>
                    <View style={[styles.goalProgressFill, { width: "50%" }]} />
                </View>

                <View style={[styles.goalItem, { marginTop: 16 }]}>
                    <View style={styles.goalInfo}>
                        <Text style={styles.goalName}>Vacation Fund</Text>
                        <Text style={styles.goalAmount}>₹15,000 / ₹40,000</Text>
                    </View>
                    <Text style={styles.goalPercent}>37.5%</Text>
                </View>

                <View style={styles.goalProgressBar}>
                    <View style={[styles.goalProgressFill, { width: "37.5%" }]} />
                </View>
            </View>

            {/* Smart Recommendations */}
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <View style={[styles.cardIcon, { backgroundColor: "#FEE2E2" }]}>
                        <Ionicons name="bulb" size={20} color="#EF4444" />
                    </View>
                    <View>
                        <Text style={styles.cardTitle}>Smart Tips</Text>
                        <Text style={styles.cardSubtitle}>Ways to optimize spending</Text>
                    </View>
                </View>

                <View style={styles.tipItem}>
                    <View style={styles.tipNumber}>
                        <Text style={styles.tipNumberText}>1</Text>
                    </View>
                    <View style={styles.tipContent}>
                        <Text style={styles.tipTitle}>Reduce Dining Frequency</Text>
                        <Text style={styles.tipDescription}>You can save ₹2,000 by reducing restaurant visits to 2x/week</Text>
                    </View>
                </View>

                <View style={styles.tipItem}>
                    <View style={styles.tipNumber}>
                        <Text style={styles.tipNumberText}>2</Text>
                    </View>
                    <View style={styles.tipContent}>
                        <Text style={styles.tipTitle}>Use Public Transport</Text>
                        <Text style={styles.tipDescription}>Switch to metro passes for ₹200 savings on travel</Text>
                    </View>
                </View>

                <View style={styles.tipItem}>
                    <View style={styles.tipNumber}>
                        <Text style={styles.tipNumberText}>3</Text>
                    </View>
                    <View style={styles.tipContent}>
                        <Text style={styles.tipTitle}>Plan Shopping Better</Text>
                        <Text style={styles.tipDescription}>Create shopping lists to reduce impulse buying</Text>
                    </View>
                </View>
            </View>

            {/* Call to Action */}
            <TouchableOpacity style={styles.ctaButton} activeOpacity={0.8}>
                <Text style={styles.ctaText}>Get Personalized Insights</Text>
                <Ionicons name="arrow-forward" size={20} color="white" />
            </TouchableOpacity>
        </ScrollView>
    )
}

// Stylesheet copied from the first block
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F0F9FF",
        paddingHorizontal: 16,
        paddingTop: 12,
    },
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
    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginBottom: 16,
    },
    cardTitleContainer: {
        flexDirection: "row",
        alignItems: "flex-start",
        flex: 1,
    },
    cardIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#0F172A",
    },
    cardSubtitle: {
        fontSize: 12,
        color: "#64748B",
        marginTop: 2,
    },
    trendContent: {
        gap: 12,
    },
    trendItem: {
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#F1F5F9",
    },
    trendLabel: {
        fontSize: 13,
        fontWeight: "600",
        color: "#0F172A",
        marginBottom: 6,
    },
    trendComparison: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    trendAmount: {
        fontSize: 14,
        fontWeight: "700",
        color: "#0F172A",
    },
    trendBadge: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        gap: 4,
    },
    trendPercent: {
        fontSize: 12,
        fontWeight: "700",
    },
    goalItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#F1F5F9",
    },
    goalInfo: {
        flex: 1,
    },
    goalName: {
        fontSize: 13,
        fontWeight: "600",
        color: "#0F172A",
    },
    goalAmount: {
        fontSize: 12,
        color: "#64748B",
        marginTop: 2,
    },
    goalPercent: {
        fontSize: 14,
        fontWeight: "700",
        color: "#0EA5E9",
    },
    goalProgressBar: {
        height: 6,
        backgroundColor: "#E2E8F0",
        borderRadius: 3,
        overflow: "hidden",
    },
    goalProgressFill: {
        height: "100%",
        backgroundColor: "#10B981",
        borderRadius: 3,
    },
    tipItem: {
        flexDirection: "row",
        marginBottom: 14,
        paddingBottom: 14,
        borderBottomWidth: 1,
        borderBottomColor: "#F1F5F9",
    },
    tipNumber: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "#DBEAFE",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    tipNumberText: {
        fontSize: 14,
        fontWeight: "700",
        color: "#0EA5E9",
    },
    tipContent: {
        flex: 1,
    },
    tipTitle: {
        fontSize: 13,
        fontWeight: "700",
        color: "#0F172A",
    },
    tipDescription: {
        fontSize: 12,
        color: "#64748B",
        marginTop: 4,
    },
    ctaButton: {
        backgroundColor: "#0EA5E9",
        borderRadius: 12,
        padding: 14,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: 8,
        marginVertical: 24,
        shadowColor: "#0EA5E9",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    ctaText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "700",
    },
})