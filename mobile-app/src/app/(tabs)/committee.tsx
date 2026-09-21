import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FileText, Users, MessageSquare } from 'lucide-react-native';

export default function CommitteeScreen() {
  return (
    <ScrollView style={styles.container}>
      <LinearGradient colors={['#0ea5e9', '#2563eb']} style={styles.header}>
        <Text style={styles.badge}>Your Committee</Text>
        <Text style={styles.committeeName}>United Nations Security Council</Text>
        <Text style={styles.portfolio}>Delegate of United States</Text>
      </LinearGradient>

      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Users color="#3b82f6" size={24} />
          <Text style={styles.statNumber}>15</Text>
          <Text style={styles.statLabel}>Members</Text>
        </View>
        <View style={styles.statBox}>
          <FileText color="#3b82f6" size={24} />
          <Text style={styles.statNumber}>2</Text>
          <Text style={styles.statLabel}>Agendas</Text>
        </View>
        <View style={styles.statBox}>
          <MessageSquare color="#3b82f6" size={24} />
          <Text style={styles.statNumber}>Live</Text>
          <Text style={styles.statLabel}>Chit Box</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>EB Announcements</Text>
        <View style={styles.announcementCard}>
          <Text style={styles.ebName}>From: Chair - Sarah Jenkins</Text>
          <Text style={styles.announcementText}>
            Delegates, please ensure you submit your position papers by 8:00 PM tonight. Any late submissions will not be considered for the best delegate award.
          </Text>
          <Text style={styles.time}>Just now</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Committee Resources</Text>
        <View style={styles.resourceItem}>
          <FileText color="#64748b" size={20} />
          <Text style={styles.resourceText}>Background Guide.pdf</Text>
        </View>
        <View style={styles.resourceItem}>
          <FileText color="#64748b" size={20} />
          <Text style={styles.resourceText}>Rules of Procedure.pdf</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 24,
    paddingTop: 32,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 20,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  badge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 16,
    overflow: 'hidden',
  },
  committeeName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  portfolio: {
    fontSize: 16,
    color: '#bfdbfe',
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statBox: {
    backgroundColor: '#ffffff',
    width: '30%',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 12,
  },
  announcementCard: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 16,
    padding: 16,
  },
  ebName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1d4ed8',
    marginBottom: 8,
  },
  announcementText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
    marginBottom: 12,
  },
  time: {
    fontSize: 12,
    color: '#64748b',
  },
  resourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  resourceText: {
    marginLeft: 12,
    fontSize: 15,
    fontWeight: '500',
    color: '#334155',
  },
});
