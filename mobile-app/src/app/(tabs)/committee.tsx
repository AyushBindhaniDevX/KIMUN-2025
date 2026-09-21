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
import { useSafeAreaInsets } from "react-native-safe-area-context";

const EB_ANNOUNCEMENTS = [
  {
    id: "1",
    from: "Chair — Sarah Jenkins",
    avatar: "SJ",
    color: "#7c3aed",
    message:
      "Delegates, position papers are due by 8:00 PM tonight. Submissions received after this will not be considered for any awards.",
    time: "Just now",
    priority: "high",
  },
  {
    id: "2",
    from: "Vice Chair — Rahul Mehta",
    avatar: "RM",
    color: "#1d4ed8",
    message:
      "Please ensure that all unmoderated caucus requests are submitted via a written note. No verbal requests will be accepted.",
    time: "1h ago",
    priority: "normal",
  },
];

const RESOURCES = [
  { name: "Background Guide.pdf", size: "2.1 MB", icon: "document-text", color: "#3b82f6" },
  { name: "Rules of Procedure.pdf", size: "450 KB", icon: "book", color: "#8b5cf6" },
  { name: "Country Matrix.xlsx", size: "180 KB", icon: "grid", color: "#10b981" },
];

export default function CommitteeScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <LinearGradient
          colors={["#030712", "#0c1445", "#0e1a6e"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.hero, { paddingTop: insets.top + 20 }]}
        >
          {/* Decorative circles */}
          <View style={styles.circle1} />
          <View style={styles.circle2} />

          <View style={styles.committeeTag}>
            <Ionicons name="globe-outline" size={14} color="#818cf8" />
            <Text style={styles.committeeTagText}>Your Committee</Text>
          </View>
          <Text style={styles.committeeName}>UN Security{"\n"}Council</Text>
          <View style={styles.portfolioRow}>
            <Text style={styles.portfolioFlag}>🇺🇸</Text>
            <Text style={styles.portfolioName}>Delegate of United States</Text>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            {[
              { label: "Members", value: "15" },
              { label: "Session", value: "II" },
              { label: "Speeches", value: "4" },
              { label: "Points", value: "82" },
            ].map((s, i) => (
              <View key={i} style={styles.statItem}>
                <Text style={styles.statVal}>{s.value}</Text>
                <Text style={styles.statLbl}>{s.label}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        {/* EB Announcements */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>EB Announcements</Text>
            <View style={styles.livePill}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>Live</Text>
            </View>
          </View>

          {EB_ANNOUNCEMENTS.map((a) => (
            <View key={a.id} style={[styles.announcementCard, a.priority === "high" && styles.announcementCardHigh]}>
              <View style={[styles.ebAvatar, { backgroundColor: a.color + "33" }]}>
                <Text style={[styles.ebAvatarText, { color: a.color }]}>{a.avatar}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.announcementTopRow}>
                  <Text style={styles.ebFrom}>{a.from}</Text>
                  {a.priority === "high" && (
                    <View style={styles.urgentBadge}>
                      <Text style={styles.urgentText}>URGENT</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.announcementMsg}>{a.message}</Text>
                <Text style={styles.announcementTime}>{a.time}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Agenda */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Agenda</Text>
          <View style={styles.agendaCard}>
            <View style={styles.agendaBullet}>
              <LinearGradient colors={["#3b82f6", "#7c3aed"]} style={styles.agendaBulletGrad} />
            </View>
            <View>
              <Text style={styles.agendaNum}>Agenda Item I</Text>
              <Text style={styles.agendaText}>The situation in the Korean Peninsula regarding denuclearization</Text>
            </View>
          </View>
          <View style={styles.agendaCard}>
            <View style={styles.agendaBullet}>
              <View style={styles.agendaBulletDimmed} />
            </View>
            <View>
              <Text style={[styles.agendaNum, { color: "#334155" }]}>Agenda Item II</Text>
              <Text style={[styles.agendaText, { color: "#334155" }]}>Addressing the humanitarian crisis in conflict zones</Text>
            </View>
          </View>
        </View>

        {/* Resources */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resources</Text>
          {RESOURCES.map((r, i) => (
            <TouchableOpacity key={i} style={styles.resourceItem} activeOpacity={0.8}>
              <View style={[styles.resourceIcon, { backgroundColor: r.color + "22" }]}>
                <Ionicons name={r.icon as any} size={20} color={r.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.resourceName}>{r.name}</Text>
                <Text style={styles.resourceSize}>{r.size}</Text>
              </View>
              <Ionicons name="cloud-download-outline" size={20} color="#475569" />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#030712" },
  hero: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: "hidden",
    position: "relative",
  },
  circle1: {
    position: "absolute",
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: "#3b82f611",
    top: -80,
    right: -80,
  },
  circle2: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "#7c3aed11",
    bottom: -50,
    left: -40,
  },
  committeeTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(129,140,248,0.12)",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(129,140,248,0.25)",
    marginBottom: 16,
  },
  committeeTagText: { color: "#818cf8", fontSize: 12, fontWeight: "700" },
  committeeName: { color: "#f8fafc", fontSize: 38, fontWeight: "900", letterSpacing: -1.5, lineHeight: 44, marginBottom: 12 },
  portfolioRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 28 },
  portfolioFlag: { fontSize: 22 },
  portfolioName: { color: "#93c5fd", fontSize: 15, fontWeight: "600" },
  statsRow: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    padding: 16,
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  statItem: { alignItems: "center" },
  statVal: { color: "#f8fafc", fontSize: 20, fontWeight: "800" },
  statLbl: { color: "#475569", fontSize: 11, fontWeight: "600", marginTop: 2 },
  section: { paddingHorizontal: 20, marginTop: 28 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  sectionTitle: { color: "#e2e8f0", fontSize: 18, fontWeight: "700", letterSpacing: -0.3 },
  livePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#10b98122",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#10b98133",
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#10b981" },
  liveText: { color: "#10b981", fontSize: 11, fontWeight: "700" },
  announcementCard: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "#0f172a",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  announcementCardHigh: { borderColor: "rgba(239,68,68,0.25)", backgroundColor: "#1a0a0a" },
  ebAvatar: { width: 40, height: 40, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  ebAvatarText: { fontSize: 13, fontWeight: "800" },
  announcementTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  ebFrom: { color: "#94a3b8", fontSize: 12, fontWeight: "700" },
  urgentBadge: { backgroundColor: "#ef444422", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: "#ef444433" },
  urgentText: { color: "#ef4444", fontSize: 9, fontWeight: "800", letterSpacing: 0.5 },
  announcementMsg: { color: "#cbd5e1", fontSize: 13, lineHeight: 20, marginBottom: 6 },
  announcementTime: { color: "#334155", fontSize: 11 },
  agendaCard: { flexDirection: "row", gap: 14, marginBottom: 12, alignItems: "flex-start" },
  agendaBullet: { paddingTop: 4 },
  agendaBulletGrad: { width: 4, height: 44, borderRadius: 2 },
  agendaBulletDimmed: { width: 4, height: 44, borderRadius: 2, backgroundColor: "#1e293b" },
  agendaNum: { color: "#60a5fa", fontSize: 11, fontWeight: "700", letterSpacing: 0.5, marginBottom: 4 },
  agendaText: { color: "#e2e8f0", fontSize: 14, fontWeight: "600", lineHeight: 20 },
  resourceItem: {
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
  resourceIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  resourceName: { color: "#e2e8f0", fontSize: 14, fontWeight: "600" },
  resourceSize: { color: "#475569", fontSize: 12, marginTop: 2 },
});
