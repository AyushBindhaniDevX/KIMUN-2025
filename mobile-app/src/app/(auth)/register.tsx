import { WebView } from 'react-native-webview';
import { StyleSheet, View, ActivityIndicator, Platform, Text } from 'react-native';

export default function RegisterScreen() {
  // If testing on a physical device, you need to use your machine's local IP address (e.g., http://192.168.x.x:3000)
  // For iOS Simulator, localhost works. For Android Emulator, 10.0.2.2 points to the host's localhost.
  const webUrl = Platform.OS === 'android' 
    ? 'http://10.0.2.2:3000/registration' 
    : 'http://localhost:3000/registration';

  return (
    <View style={styles.container}>
      <WebView 
        source={{ uri: webUrl }}
        style={styles.webview}
        startInLoadingState={true}
        renderLoading={() => (
          <ActivityIndicator
            color="#1e3a8a"
            size="large"
            style={styles.loading}
          />
        )}
        renderError={(errorName) => (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Could not load registration page.</Text>
            <Text style={styles.errorSub}>Make sure your Next.js web app is running locally (npm run dev in the KIMUN-2025 folder)!</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
  loading: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -18,
    marginTop: -18,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fee2e2',
  },
  errorText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ef4444',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSub: {
    fontSize: 16,
    color: '#7f1d1d',
    textAlign: 'center',
  }
});
