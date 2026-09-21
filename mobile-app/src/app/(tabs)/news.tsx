import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  StatusBar,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

const NEWS_DATA = [
  {
    id: "1",
    tag: "Official",
    title: "Keynote Speaker Announced for Opening Ceremony",
    excerpt:
      "Former UN Ambassador Prof. Anil Sood will deliver the inaugural address on multilateral diplomacy in the 21st century.",
    date: "2 hours ago",
    readTime: "3 min read",
    image: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=800&q=80",
    tagColor: "#3b82f6",
  },
  {
    id: "2",
    tag: "Logistics",
    title: "Updated Shuttle Schedule — Please Check Timings",
    excerpt:
      "Shuttles will now depart every 15 minutes from the Grand Hyatt lobby. The last shuttle departs at 11:00 PM.",
    date: "5 hours ago",
    readTime: "1 min read",
    image: "https://images.unsplash.com/photo-1494515843206-f3117d3f51b7?auto=format&fit=crop&w=800&q=80",
    tagColor: "#f59e0b",
  },
  {
    id: "3",
    tag: "Social",
    title: "Delegate Dance Venue Changed to Grand Ballroom",
    excerpt:
      "Due to overwhelming response, the Delegate Dance & Socials event has been moved to the Grand Ballroom on Level 2.",
    date: "Yesterday",
    readTime: "2 min read",
    image: "https://images.unsplash.com/photo-1577962917302-cd874c4e31d2?auto=format&fit=crop&w=800&q=80",
    tagColor: "#ec4899",
  },
  {
    id: "4",
    tag: "Academic",
    title: "Position Paper Deadline Extended by 2 Hours",
    excerpt:
      "The Secretariat has extended the position paper submission deadline to 10:00 PM tonight. No further extensions will be granted.",
    date: "3 hours ago",
    readTime: "1 min read",
    image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=800&q=80",
    tagColor: "#10b981",
  },
];

export default function NewsScreen() {
  const insets = useSafeAreaInsets();

  const featured = NEWS_DATA[0];
  const rest = NEWS_DATA.slice(1);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <View>
            <Text style={styles.headerTitle}>Newsroom</Text>
            <Text style={styles.headerSub}>KIMUN 2025 Updates</Text>
          </View>
          <TouchableOpacity style={styles.filterBtn}>
            <Ionicons name="options-outline" size={20} color="#60a5fa" />
          </TouchableOpacity>
        </View>

        {/* Featured Card */}
        <View style={styles.featuredContainer}>
          <TouchableOpacity activeOpacity={0.9} style={styles.featuredCard}>
            <Image source={{ uri: featured.image }} style={styles.featuredImage} />
            <LinearGradient
              colors={["transparent", "rgba(3,7,18,0.95)"]}
              style={styles.featuredOverlay}
            >
              <View style={[styles.tag, { backgroundColor: featured.tagColor + "33", borderColor: featured.tagColor + "55" }]}>
                <Text style={[styles.tagText, { color: featured.tagColor }]}>{featured.tag}</Text>
              </View>
              <Text style={styles.featuredTitle}>{featured.title}</Text>
              <View style={styles.metaRow}>
                <Ionicons name="time-outline" size={12} color="#64748b" />
                <Text style={styles.metaText}>{featured.date}</Text>
                <Text style={styles.metaDot}>·</Text>
                <Text style={styles.metaText}>{featured.readTime}</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* News List */}
        <View style={styles.listSection}>
          <Text style={styles.sectionLabel}>Latest Updates</Text>
          {rest.map((item) => (
            <TouchableOpacity key={item.id} style={styles.newsCard} activeOpacity={0.8}>
              <Image source={{ uri: item.image }} style={styles.newsThumb} />
              <View style={styles.newsContent}>
                <View style={[styles.tag, { backgroundColor: item.tagColor + "22", borderColor: item.tagColor + "44" }]}>
                  <Text style={[styles.tagText, { color: item.tagColor }]}>{item.tag}</Text>
                </View>
                <Text style={styles.newsTitle} numberOfLines={2}>{item.title}</Text>
                <View style={styles.metaRow}>
                  <Text style={styles.metaText}>{item.date}</Text>
                  <Text style={styles.metaDot}>·</Text>
                  <Text style={styles.metaText}>{item.readTime}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
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
  headerTitle: { color: "#f8fafc", fontSize: 28, fontWeight: "800", letterSpacing: -0.5 },
  headerSub: { color: "#475569", fontSize: 14, fontWeight: "500", marginTop: 2 },
  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#0f172a",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  featuredContainer: { paddingHorizontal: 20, marginBottom: 28 },
  featuredCard: { borderRadius: 20, overflow: "hidden", height: 260 },
  featuredImage: { width: "100%", height: "100%" },
  featuredOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    gap: 10,
  },
  featuredTitle: { color: "#f8fafc", fontSize: 18, fontWeight: "800", lineHeight: 24 },
  tag: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 4,
  },
  tagText: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  metaText: { color: "#64748b", fontSize: 12 },
  metaDot: { color: "#334155", fontSize: 12 },
  listSection: { paddingHorizontal: 20 },
  sectionLabel: { color: "#64748b", fontSize: 13, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase", marginBottom: 14 },
  newsCard: {
    flexDirection: "row",
    backgroundColor: "#0f172a",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  newsThumb: { width: 100, height: 110 },
  newsContent: { flex: 1, padding: 14, gap: 8, justifyContent: "center" },
  newsTitle: { color: "#e2e8f0", fontSize: 14, fontWeight: "700", lineHeight: 20 },
});
