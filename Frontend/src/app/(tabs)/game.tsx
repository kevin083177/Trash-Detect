import React, { View, Text, StyleSheet } from 'react-native';

export default function game() {
  return (
    <View style={styles.container}>
      <Text>game Page!</Text>
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