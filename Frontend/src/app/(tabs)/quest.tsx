import { View, Text, StyleSheet } from 'react-native';

export default function quest() {
  return (
    <View style={styles.container}>
      <Text>quest Page!</Text>
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