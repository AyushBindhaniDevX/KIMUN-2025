import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  ImageBackground,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

const QUICK_LINKS = [
  { label: "My Committee", icon: "people", color: "#3b82f6" },
  { label: "Schedule", icon: "calendar", color: "#8b5cf6" },
  { label: "Resources", icon: "document-text", color: "#10b981" },
  { label: "Help Desk", icon: "headset", color: "#f59e0b" },
  { label: "Campus Map", icon: "map", color: "#ef4444" },
  { label: "Socials", icon: "sparkles", color: "#ec4899" },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Header */}
        <LinearGradient
          colors={["#030712", "#0f172a", "#1e1b4b"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.hero, { paddingTop: insets.top + 20 }]}
        >
          <View style={styles.heroBadge}>
            <View style={styles.heroBadgeDot} />
            <Text style={styles.heroBadgeText}>Conference Live</Text>
          </View>
          <Text style={styles.heroGreeting}>Welcome Back,</Text>
          <Text style={styles.heroName}>Delegate John</Text>
          <View style={styles.heroTag}>
            <Ionicons name="shield-checkmark" size={14} color="#60a5fa" />
            <Text style={styles.heroTagText}>UNSC · United States</Text>
          </View>

          {/* Stat Pills */}
          <View style={styles.statRow}>
            <View style={styles.statPill}>
              <Text style={styles.statValue}>Day 1</Text>
              <Text style={styles.statLabel}>of 2</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statPill}>
              <Text style={styles.statValue}>10:30</Text>
              <Text style={styles.statLabel}>Session I</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statPill}>
              <Text style={styles.statValue}>3</Text>
              <Text style={styles.statLabel}>Updates</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Announcement Card */}
        <View style={styles.section}>
          <View style={styles.announcementCard}>
            <LinearGradient
              colors={["#1d4ed8", "#7c3aed"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.announcementGradient}
            >
              <View style={styles.announcementIcon}>
                <Ionicons name="megaphone" size={22} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.announcementTitle}>Opening Ceremony Today</Text>
                <Text style={styles.announcementSub}>9:00 AM · Main Auditorium</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.6)" />
            </LinearGradient>
          </View>
        </View>

        {/* Quick Access */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Access</Text>
          <View style={styles.quickGrid}>
            {QUICK_LINKS.map((item, i) => (
              <TouchableOpacity key={i} style={styles.quickItem} activeOpacity={0.7}>
                <View style={[styles.quickIcon, { backgroundColor: item.color + "22" }]}>
                  <Ionicons name={item.icon as any} size={24} color={item.color} />
                </View>
                <Text style={styles.quickLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {[
            { icon: "checkmark-circle", color: "#10b981", text: "Position paper submitted", time: "2h ago" },
            { icon: "mail-unread", color: "#3b82f6", text: "New chit from Delegate China", time: "45m ago" },
            { icon: "star", color: "#f59e0b", text: "Best Delegate nomination", time: "Just now" },
          ].map((item, i) => (
            <View key={i} style={styles.activityItem}>
              <View style={[styles.activityIcon, { backgroundColor: item.color + "22" }]}>
                <Ionicons name={item.icon as any} size={18} color={item.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.activityText}>{item.text}</Text>
              </View>
              <Text style={styles.activityTime}>{item.time}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#030712" },
  container: { flex: 1, backgroundColor: "#030712" },
  hero: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.3)",
  },
  heroBadgeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#10b981",
    marginRight: 6,
  },
  heroBadgeText: { color: "#10b981", fontSize: 12, fontWeight: "700", letterSpacing: 0.5 },
  heroGreeting: { color: "#94a3b8", fontSize: 16, fontWeight: "500" },
  heroName: { color: "#f8fafc", fontSize: 32, fontWeight: "800", letterSpacing: -0.5, marginBottom: 8 },
  heroTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 28,
  },
  heroTagText: { color: "#60a5fa", fontSize: 14, fontWeight: "600" },
  statRow: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
  },
  statPill: { flex: 1, alignItems: "center" },
  statValue: { color: "#f8fafc", fontSize: 20, fontWeight: "800" },
  statLabel: { color: "#64748b", fontSize: 12, fontWeight: "500", marginTop: 2 },
  statDivider: { width: 1, height: 30, backgroundColor: "rgba(255,255,255,0.1)" },
  section: { paddingHorizontal: 20, marginTop: 28 },
  sectionTitle: { color: "#e2e8f0", fontSize: 18, fontWeight: "700", marginBottom: 14, letterSpacing: -0.3 },
  announcementCard: { borderRadius: 16, overflow: "hidden" },
  announcementGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    gap: 14,
  },
  announcementIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  announcementTitle: { color: "#fff", fontSize: 15, fontWeight: "700" },
  announcementSub: { color: "rgba(255,255,255,0.7)", fontSize: 13, marginTop: 2 },
  quickGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  quickItem: {
    width: (width - 40 - 24) / 3,
    backgroundColor: "#0f172a",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  quickIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: "center", alignItems: "center", marginBottom: 10 },
  quickLabel: { color: "#94a3b8", fontSize: 12, fontWeight: "600", textAlign: "center" },
  activityItem: {
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
  activityIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  activityText: { color: "#cbd5e1", fontSize: 14, fontWeight: "500" },
  activityTime: { color: "#475569", fontSize: 12 },
});
