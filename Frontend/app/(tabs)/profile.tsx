import { View, Text, StyleSheet } from 'react-native';

export default function profile() {
  return (
    <View style={styles.container}>
      <Text>profile Page!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});