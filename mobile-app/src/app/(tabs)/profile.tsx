import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import QRCode from "react-native-qrcode-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";

const DELEGATE_INFO = {
  name: "John Doe",
  initials: "JD",
  committee: "UNSC",
  portfolio: "United States",
  flag: "🇺🇸",
  id: "KIMUN-JD-2025-001",
  school: "DPS Ahmedabad",
  registered: true,
};

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { logout } = useAuth();

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <LinearGradient
          colors={["#030712", "#0f172a"]}
          style={[styles.header, { paddingTop: insets.top + 20 }]}
        >
          <Text style={styles.headerTitle}>My Profile</Text>

          {/* Avatar */}
          <View style={styles.avatarWrapper}>
            <LinearGradient
              colors={["#3b82f6", "#7c3aed"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatarGrad}
            >
              <Text style={styles.avatarText}>{DELEGATE_INFO.initials}</Text>
            </LinearGradient>
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={22} color="#10b981" />
            </View>
          </View>

          <Text style={styles.delegateName}>{DELEGATE_INFO.name}</Text>
          <Text style={styles.delegateSchool}>{DELEGATE_INFO.school}</Text>

          {/* Info Row */}
          <View style={styles.infoRow}>
            <View style={styles.infoPill}>
              <Text style={styles.infoPillText}>{DELEGATE_INFO.flag} {DELEGATE_INFO.portfolio}</Text>
            </View>
            <View style={styles.infoPill}>
              <Ionicons name="people-outline" size={12} color="#818cf8" />
              <Text style={styles.infoPillText}>{DELEGATE_INFO.committee}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Registration Status */}
        <View style={styles.section}>
          <View style={styles.statusCard}>
            <View style={styles.statusLeft}>
              <View style={styles.statusDot} />
              <View>
                <Text style={styles.statusLabel}>Registration Status</Text>
                <Text style={styles.statusValue}>Fully Registered ✓</Text>
              </View>
            </View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>VERIFIED</Text>
            </View>
          </View>
        </View>

        {/* QR ID Card */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delegate ID</Text>
          <View style={styles.qrCard}>
            <LinearGradient
              colors={["#0f172a", "#1e1b4b"]}
              style={styles.qrCardInner}
            >
              {/* Card Top */}
              <View style={styles.qrCardTop}>
                <View>
                  <Text style={styles.qrCardConf}>KIMUN 2025</Text>
                  <Text style={styles.qrCardRole}>Delegate</Text>
                </View>
                <Text style={styles.qrCardFlag}>{DELEGATE_INFO.flag}</Text>
              </View>
              <View style={styles.qrDivider} />

              {/* QR Code */}
              <View style={styles.qrWrapper}>
                <QRCode
                  value={DELEGATE_INFO.id}
                  size={160}
                  color="#f8fafc"
                  backgroundColor="transparent"
                />
              </View>
              <Text style={styles.qrId}>{DELEGATE_INFO.id}</Text>
              <Text style={styles.qrHint}>Scan for check-in · meals · sessions</Text>
            </LinearGradient>
          </View>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          {[
            { icon: "person-outline", label: "Edit Profile", color: "#60a5fa" },
            { icon: "notifications-outline", label: "Notifications", color: "#a78bfa" },
            { icon: "shield-outline", label: "Privacy & Security", color: "#34d399" },
            { icon: "help-circle-outline", label: "Help & Support", color: "#f59e0b" },
          ].map((item, i) => (
            <TouchableOpacity key={i} style={styles.settingsItem} activeOpacity={0.7}>
              <View style={[styles.settingsIcon, { backgroundColor: item.color + "22" }]}>
                <Ionicons name={item.icon as any} size={18} color={item.color} />
              </View>
              <Text style={styles.settingsLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={16} color="#334155" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <View style={[styles.section, { marginBottom: 0 }]}>
          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <Ionicons name="log-out-outline" size={18} color="#ef4444" />
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#030712" },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    alignItems: "center",
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerTitle: { color: "#f8fafc", fontSize: 28, fontWeight: "800", letterSpacing: -0.5, alignSelf: "flex-start", marginBottom: 24 },
  avatarWrapper: { position: "relative", marginBottom: 16 },
  avatarGrad: { width: 88, height: 88, borderRadius: 28, justifyContent: "center", alignItems: "center" },
  avatarText: { color: "#fff", fontSize: 32, fontWeight: "900" },
  verifiedBadge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    backgroundColor: "#030712",
    borderRadius: 12,
    padding: 1,
  },
  delegateName: { color: "#f8fafc", fontSize: 22, fontWeight: "800", letterSpacing: -0.5 },
  delegateSchool: { color: "#64748b", fontSize: 14, fontWeight: "500", marginTop: 4, marginBottom: 16 },
  infoRow: { flexDirection: "row", gap: 10 },
  infoPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  infoPillText: { color: "#cbd5e1", fontSize: 13, fontWeight: "600" },
  section: { paddingHorizontal: 20, marginTop: 24 },
  sectionTitle: { color: "#e2e8f0", fontSize: 18, fontWeight: "700", letterSpacing: -0.3, marginBottom: 12 },
  statusCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#0d1f12",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.2)",
  },
  statusLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  statusDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#10b981" },
  statusLabel: { color: "#64748b", fontSize: 12, fontWeight: "600" },
  statusValue: { color: "#10b981", fontSize: 15, fontWeight: "700", marginTop: 2 },
  statusBadge: {
    backgroundColor: "#10b98122",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#10b98133",
  },
  statusBadgeText: { color: "#10b981", fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
  qrCard: { borderRadius: 24, overflow: "hidden", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  qrCardInner: { padding: 24, alignItems: "center" },
  qrCardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%", marginBottom: 16 },
  qrCardConf: { color: "#818cf8", fontSize: 13, fontWeight: "800", letterSpacing: 1 },
  qrCardRole: { color: "#f8fafc", fontSize: 18, fontWeight: "800", marginTop: 2 },
  qrCardFlag: { fontSize: 36 },
  qrDivider: { width: "100%", height: 1, backgroundColor: "rgba(255,255,255,0.06)", marginBottom: 24 },
  qrWrapper: {
    padding: 20,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  qrId: { color: "#60a5fa", fontSize: 13, fontWeight: "700", letterSpacing: 1, marginBottom: 6 },
  qrHint: { color: "#334155", fontSize: 12, fontWeight: "500" },
  settingsItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0f172a",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  settingsIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  settingsLabel: { flex: 1, color: "#cbd5e1", fontSize: 15, fontWeight: "600" },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#1a0a0a",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.2)",
  },
  logoutText: { color: "#ef4444", fontSize: 15, fontWeight: "700" },
});
