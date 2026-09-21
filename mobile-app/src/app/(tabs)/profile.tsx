import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

export default function ProfileScreen() {
  const delegateId = 'KIMUN-JD-2025-001';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>JD</Text>
        </View>
        <Text style={styles.name}>John Doe</Text>
        <Text style={styles.committee}>UNSC - United States</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Delegate ID</Text>
        <View style={styles.qrPlaceholder}>
          <QRCode
            value={delegateId}
            size={160}
            color="#0f172a"
            backgroundColor="transparent"
          />
        </View>
        <Text style={styles.infoText}>Show this code for check-in and meals.</Text>
      </View>

      <View style={styles.settingsGroup}>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Edit Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.logoutButton]}>
          <Text style={styles.logoutButtonText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 32,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  committee: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 20,
  },
  qrPlaceholder: {
    width: 200,
    height: 200,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    marginBottom: 16,
  },
  qrMock: {
    width: 160,
    height: 160,
    borderWidth: 2,
    borderColor: '#94a3b8',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  qrMockText: {
    color: '#64748b',
    fontWeight: 'bold',
  },
  infoText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  settingsGroup: {
    gap: 12,
  },
  button: {
    backgroundColor: '#e2e8f0',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
  },
  logoutButton: {
    backgroundColor: '#fee2e2',
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
  },
});
