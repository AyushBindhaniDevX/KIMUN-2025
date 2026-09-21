import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#030712', '#0f172a', '#1e1b4b']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Decorative glows */}
      <View style={[styles.glow, styles.glow1]} />
      <View style={[styles.glow, styles.glow2]} />

      <View style={[styles.content, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }]}>
        {/* Logo area */}
        <View style={styles.logoArea}>
          <LinearGradient
            colors={['#1d4ed8', '#7c3aed']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoGrad}
          >
            <Ionicons name="globe-outline" size={40} color="#fff" />
          </LinearGradient>
          <Text style={styles.logoText}>KIMUN</Text>
          <Text style={styles.logoYear}>2025</Text>
        </View>

        {/* Headline */}
        <View style={styles.headline}>
          <Text style={styles.headlineSub}>Delegate Companion App</Text>
          <Text style={styles.headlineMain}>Empowering{'\n'}Diplomacy.</Text>
          <Text style={styles.headlineDesc}>
            Access your committee, schedule, announcements, and digital delegate ID — all in one place.
          </Text>
        </View>

        {/* Features list */}
        <View style={styles.features}>
          {[
            { icon: 'shield-checkmark-outline', text: 'Verify your registration instantly' },
            { icon: 'people-outline', text: 'Real-time EB announcements' },
            { icon: 'qr-code-outline', text: 'Digital delegate ID & QR check-in' },
          ].map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <Ionicons name={f.icon as any} size={16} color="#60a5fa" />
              </View>
              <Text style={styles.featureText}>{f.text}</Text>
            </View>
          ))}
        </View>

        {/* CTA */}
        <View style={styles.cta}>
          <TouchableOpacity onPress={login} activeOpacity={0.85}>
            <LinearGradient
              colors={['#1d4ed8', '#7c3aed']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryBtn}
            >
              <Text style={styles.primaryBtnText}>Verify & Enter</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.push('/register')} activeOpacity={0.7}>
            <Ionicons name="person-add-outline" size={16} color="#94a3b8" />
            <Text style={styles.secondaryBtnText}>New delegate? Register here</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>KIMUN 2025 · Organized by KIMUN Secretariat</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  glow: { position: 'absolute', borderRadius: 999 },
  glow1: { width: 350, height: 350, backgroundColor: '#1d4ed822', top: -100, right: -100 },
  glow2: { width: 250, height: 250, backgroundColor: '#7c3aed18', bottom: 100, left: -80 },
  content: { flex: 1, paddingHorizontal: 28, justifyContent: 'space-between' },
  logoArea: { alignItems: 'center', gap: 8 },
  logoGrad: { width: 80, height: 80, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  logoText: { color: '#f8fafc', fontSize: 28, fontWeight: '900', letterSpacing: -1 },
  logoYear: { color: '#475569', fontSize: 16, fontWeight: '700' },
  headline: { gap: 12 },
  headlineSub: { color: '#60a5fa', fontSize: 13, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  headlineMain: { color: '#f8fafc', fontSize: 44, fontWeight: '900', letterSpacing: -2, lineHeight: 50 },
  headlineDesc: { color: '#64748b', fontSize: 15, lineHeight: 24 },
  features: { gap: 14 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  featureIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#1d4ed822',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1d4ed833',
  },
  featureText: { color: '#94a3b8', fontSize: 14, fontWeight: '500' },
  cta: { gap: 14 },
  primaryBtn: { borderRadius: 16, paddingVertical: 18, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
  primaryBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  secondaryBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  secondaryBtnText: { color: '#94a3b8', fontSize: 15, fontWeight: '600' },
  footer: { color: '#1e293b', fontSize: 11, textAlign: 'center', fontWeight: '500' },
});
