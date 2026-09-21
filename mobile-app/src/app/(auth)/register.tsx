import { WebView } from 'react-native-webview';
import { StyleSheet, View, ActivityIndicator } from 'react-native';

export default function RegisterScreen() {
  return (
    <View style={styles.container}>
      <WebView 
        // Replace with your actual deployed website registration URL
        source={{ uri: 'https://kimun-2025.vercel.app/registration' }}
        style={styles.webview}
        startInLoadingState={true}
        renderLoading={() => (
          <ActivityIndicator
            color="#1e3a8a"
            size="large"
            style={styles.loading}
          />
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
  }
});
