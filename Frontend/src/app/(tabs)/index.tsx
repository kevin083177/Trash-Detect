import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet } from 'react-native';

export default function Index() {
  return (
    <View style={styles.container}>
      <View style={styles.coinContainer}>
        <Ionicons name="logo-usd" size={30} color={"#FFD000"}></Ionicons>
        <Text>1000</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  coinContainer: {
    flex: 1,
    flexDirection: "row",
  },
});