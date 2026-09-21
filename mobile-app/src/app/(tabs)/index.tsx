import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

export default function HomeScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcome}>Welcome to</Text>
        <Text style={styles.title}>KIMUN 2025</Text>
        <Text style={styles.subtitle}>Empowering the Leaders of Tomorrow</Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Announcements</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Opening Ceremony</Text>
          <Text style={styles.cardText}>Join us at the Main Auditorium at 9:00 AM.</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Committee Sessions</Text>
          <Text style={styles.cardText}>First sessions begin at 10:30 AM in respective blocks.</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Links</Text>
        <View style={styles.grid}>
          <TouchableOpacity style={styles.gridItem}>
            <Text style={styles.gridItemText}>Committees</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.gridItem}>
            <Text style={styles.gridItemText}>Campus Map</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.gridItem}>
            <Text style={styles.gridItemText}>Resources</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.gridItem}>
            <Text style={styles.gridItemText}>Help Desk</Text>
          </TouchableOpacity>
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
    backgroundColor: '#1e3a8a',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  welcome: {
    color: '#bfdbfe',
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 4,
  },
  subtitle: {
    color: '#dbeafe',
    fontSize: 14,
    marginTop: 8,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  cardText: {
    fontSize: 14,
    color: '#475569',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '48%',
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  gridItemText: {
    fontWeight: '600',
    color: '#1e3a8a',
    marginTop: 8,
  },
});
