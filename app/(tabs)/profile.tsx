// app/(tabs)/profile.tsx

import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
// You will need to install 'expo install @expo/vector-icons' if you haven't
import { Ionicons } from '@expo/vector-icons'; 
import { router } from 'expo-router';
// ⭐️ Use useAuthContext and signOut, not direct access to global 'auth'
import { useAuthContext } from '../lib/providers';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase'; 

// --- Setting Item Component ---

interface SettingItemProps {
    icon: string
    label: string
    onPress?: () => void
    isDestructive?: boolean
}

const SettingItem = ({ icon, label, onPress, isDestructive }: SettingItemProps) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress} activeOpacity={0.7}>
        <View style={styles.settingLeft}>
            <View
                style={[styles.settingIcon, isDestructive ? { backgroundColor: "#FEE2E2" } : { backgroundColor: "#DBEAFE" }]}
            >
                <Ionicons name={icon as any} size={20} color={isDestructive ? "#EF4444" : "#0EA5E9"} />
            </View>
            <Text style={[styles.settingLabel, isDestructive && { color: "#EF4444" }]}>{label}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
    </TouchableOpacity>
)

// --- Main Screen Component ---

export default function ProfileScreen() {
    const { user } = useAuthContext()
    const userName = user?.displayName || user?.email?.split("@")[0] || "User"
    const userEmail = user?.email || "user@example.com"

    const handleLogout = async () => {
        try {
            await signOut(auth)
            // Redirect to the login screen after successful logout
            router.replace("/(auth)/login") 
        } catch (error) {
            console.error("Logout error:", error)
            // Optionally, show a user-friendly error message
        }
    }

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Profile Header Card */}
            <View style={styles.profileCard}>
                <View style={styles.avatarSection}>
                    <View style={styles.avatar}>
                        <Ionicons name="person" size={40} color="#0EA5E9" />
                    </View>
                    <View style={styles.userInfo}>
                        <Text style={styles.userName}>{userName}</Text>
                        <Text style={styles.userEmail}>{userEmail}</Text>
                    </View>
                </View>
                <TouchableOpacity style={styles.editButton}>
                    <Ionicons name="pencil" size={18} color="white" />
                </TouchableOpacity>
            </View>

            {/* Account Stats */}
            <View style={styles.statsContainer}>
                <View style={styles.statBox}>
                    <Text style={styles.statValue}>₹85K</Text>
                    <Text style={styles.statLabel}>Total Balance</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                    <Text style={styles.statValue}>12</Text>
                    <Text style={styles.statLabel}>Transactions</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                    <Text style={styles.statValue}>5</Text>
                    <Text style={styles.statLabel}>Budgets</Text>
                </View>
            </View>

            {/* Settings Sections */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>App Settings</Text>
                <SettingItem icon="notifications-outline" label="Notifications" />
                <SettingItem icon="moon-outline" label="Dark Mode" />
                <SettingItem icon="lock-closed-outline" label="Change Password" />
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Data & Import</Text>
                <SettingItem
                    icon="document-outline"
                    label="Import Bank Statements"
                    // Assuming a route exists for this, as per the new code
                    onPress={() => router.push("/import-screen")} 
                />
                <SettingItem icon="cloud-upload-outline" label="Data Backup" />
                <SettingItem icon="download-outline" label="Export Data" />
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Help & Support</Text>
                <SettingItem icon="help-circle-outline" label="FAQ" />
                <SettingItem icon="document-text-outline" label="Privacy Policy" />
                <SettingItem icon="information-circle-outline" label="About" />
            </View>

            {/* Logout Button */}
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
                <Ionicons name="log-out-outline" size={20} color="white" />
                <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>

            <View style={styles.footer}>
                <Text style={styles.footerText}>SmartBudget v1.0.0</Text>
            </View>
        </ScrollView>
    )
}

// --- Stylesheet ---

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F0F9FF",
        paddingHorizontal: 16,
        paddingTop: 12,
    },
    // Profile Card
    profileCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 2,
    },
    avatarSection: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: "#DBEAFE",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 14,
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 16,
        fontWeight: "700",
        color: "#0F172A",
    },
    userEmail: {
        fontSize: 12,
        color: "#64748B",
        marginTop: 2,
    },
    editButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#0EA5E9",
        justifyContent: "center",
        alignItems: "center",
    },
    // Stats Container
    statsContainer: {
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
        flexDirection: "row",
        justifyContent: "space-around",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 2,
    },
    statBox: {
        alignItems: "center",
        flex: 1,
    },
    statValue: {
        fontSize: 18,
        fontWeight: "700",
        color: "#0EA5E9",
    },
    statLabel: {
        fontSize: 12,
        color: "#64748B",
        marginTop: 4,
    },
    statDivider: {
        width: 1,
        backgroundColor: "#E2E8F0",
        marginHorizontal: 8,
    },
    // Settings Sections
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: "700",
        color: "#0F172A",
        marginBottom: 12,
        marginLeft: 4,
    },
    settingItem: {
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        padding: 14,
        marginBottom: 10,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.02,
        shadowRadius: 3,
        elevation: 1,
    },
    settingLeft: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },
    settingIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    settingLabel: {
        fontSize: 15,
        fontWeight: "600",
        color: "#0F172A",
    },
    // Logout Button
    logoutButton: {
        backgroundColor: "#EF4444",
        borderRadius: 12,
        padding: 14,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: 8,
        marginTop: 8,
        marginBottom: 24,
        shadowColor: "#EF4444",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    logoutText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "700",
    },
    // Footer
    footer: {
        alignItems: "center",
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: "#E2E8F0",
    },
    footerText: {
        fontSize: 12,
        color: "#94A3B8",
    },
})