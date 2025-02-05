import { View, Text, StyleSheet } from 'react-native';

export default function scanner() {
  return (
    <View style={styles.container}>
      <Text>camera Page!</Text>
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