// app/import-screen.tsx

import { View, Text, StyleSheet } from 'react-native';

export default function ImportScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Import Screen: Ready for implementation!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  text: {
    fontSize: 18,
    color: '#1E293B',
  },
});