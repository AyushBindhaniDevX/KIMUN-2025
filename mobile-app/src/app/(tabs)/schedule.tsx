import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SCHEDULE_DATA = [
  {
    title: "Day 1  ·  Friday, Oct 24",
    data: [
      { time: "08:00", period: "AM", event: "Registration & Breakfast", location: "Main Foyer", type: "logistics", done: true },
      { time: "09:00", period: "AM", event: "Opening Ceremony", location: "Auditorium A", type: "ceremony", done: true },
      { time: "10:30", period: "AM", event: "Committee Session I", location: "Committee Rooms", type: "session", done: false },
      { time: "01:00", period: "PM", event: "Lunch Break", location: "Cafeteria", type: "logistics", done: false },
      { time: "02:00", period: "PM", event: "Committee Session II", location: "Committee Rooms", type: "session", done: false },
      { time: "05:00", period: "PM", event: "High Tea & Networking", location: "Lawn Area", type: "social", done: false },
    ],
  },
  {
    title: "Day 2  ·  Saturday, Oct 25",
    data: [
      { time: "09:00", period: "AM", event: "Committee Session III", location: "Committee Rooms", type: "session", done: false },
      { time: "01:00", period: "PM", event: "Lunch Break", location: "Cafeteria", type: "logistics", done: false },
      { time: "02:00", period: "PM", event: "Committee Session IV", location: "Committee Rooms", type: "session", done: false },
      { time: "06:00", period: "PM", event: "Delegate Dance & Socials", location: "Grand Ballroom", type: "social", done: false },
      { time: "09:00", period: "PM", event: "Closing Ceremony", location: "Auditorium A", type: "ceremony", done: false },
    ],
  },
];

const TYPE_CONFIG: Record<string, { color: string; icon: string; bg: string }> = {
  session: { color: "#60a5fa", icon: "mic-outline", bg: "#1d4ed822" },
  ceremony: { color: "#a78bfa", icon: "ribbon-outline", bg: "#7c3aed22" },
  social: { color: "#f472b6", icon: "sparkles-outline", bg: "#db277722" },
  logistics: { color: "#34d399", icon: "cube-outline", bg: "#05966922" },
};

export default function ScheduleScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <SectionList
        sections={SCHEDULE_DATA}
        keyExtractor={(item) => item.event}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={() => (
          <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
            <View>
              <Text style={styles.headerTitle}>Conference</Text>
              <Text style={styles.headerTitle2}>Schedule</Text>
            </View>
            <TouchableOpacity style={styles.headerBtn}>
              <Ionicons name="download-outline" size={20} color="#60a5fa" />
            </TouchableOpacity>
          </View>
        )}
        renderSectionHeader={({ section: { title } }) => (
          <View style={styles.dayHeader}>
            <LinearGradient
              colors={["#1e1b4b", "#0f172a"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.dayHeaderGradient}
            >
              <Ionicons name="calendar-outline" size={14} color="#818cf8" />
              <Text style={styles.dayHeaderText}>{title}</Text>
            </LinearGradient>
          </View>
        )}
        renderItem={({ item, index }) => {
          const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.logistics;
          return (
            <View style={styles.itemRow}>
              {/* Timeline */}
              <View style={styles.timelineCol}>
                <View style={styles.timeBlock}>
                  <Text style={styles.timeVal}>{item.time}</Text>
                  <Text style={styles.timePeriod}>{item.period}</Text>
                </View>
                <View style={[styles.timelineLine, item.done && styles.timelineLineDone]} />
              </View>

              {/* Dot */}
              <View style={styles.dotCol}>
                <View style={[styles.dot, { backgroundColor: item.done ? cfg.color : "#1e293b", borderColor: cfg.color }]} />
              </View>

              {/* Card */}
              <TouchableOpacity style={[styles.card, item.done && styles.cardDone]} activeOpacity={0.8}>
                <View style={[styles.cardIcon, { backgroundColor: cfg.bg }]}>
                  <Ionicons name={cfg.icon as any} size={16} color={cfg.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.eventName, item.done && styles.textDone]}>{item.event}</Text>
                  <View style={styles.locationRow}>
                    <Ionicons name="location-outline" size={11} color="#475569" />
                    <Text style={styles.locationText}>{item.location}</Text>
                  </View>
                </View>
                {item.done && <Ionicons name="checkmark-circle" size={18} color="#10b981" />}
              </TouchableOpacity>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#030712" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  headerTitle: { color: "#f8fafc", fontSize: 32, fontWeight: "800", letterSpacing: -1, lineHeight: 36 },
  headerTitle2: { color: "#818cf8", fontSize: 32, fontWeight: "800", letterSpacing: -1 },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#0f172a",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  dayHeader: { paddingHorizontal: 20, marginTop: 24, marginBottom: 8 },
  dayHeaderGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2d2d6b",
  },
  dayHeaderText: { color: "#818cf8", fontSize: 13, fontWeight: "700", letterSpacing: 0.3 },
  itemRow: { flexDirection: "row", paddingHorizontal: 20, marginBottom: 8, alignItems: "flex-start" },
  timelineCol: { width: 52, alignItems: "center" },
  timeBlock: { alignItems: "center", marginBottom: 4 },
  timeVal: { color: "#64748b", fontSize: 13, fontWeight: "700" },
  timePeriod: { color: "#334155", fontSize: 10, fontWeight: "600" },
  timelineLine: { width: 1, flex: 1, minHeight: 30, backgroundColor: "#1e293b" },
  timelineLineDone: { backgroundColor: "#10b98155" },
  dotCol: { width: 20, alignItems: "center", paddingTop: 10 },
  dot: { width: 10, height: 10, borderRadius: 5, borderWidth: 2 },
  card: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0f172a",
    borderRadius: 14,
    padding: 14,
    marginLeft: 10,
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  cardDone: { opacity: 0.5 },
  cardIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  eventName: { color: "#e2e8f0", fontSize: 14, fontWeight: "700", marginBottom: 4 },
  textDone: { color: "#475569" },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  locationText: { color: "#475569", fontSize: 12 },
});
