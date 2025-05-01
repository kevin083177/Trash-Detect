import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';

export default function Result() {
  const params = useLocalSearchParams();
  const score = Number(params.score);
  const stars = Number(params.stars);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>遊戲結算</Text>

      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>獲得星星</Text>
          <Text style={styles.statValue}>{stars} / 3</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>總分</Text>
          <Text style={styles.statValue}>{score}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.button} onPress={() => router.push('/(tabs)/game/' as never) }>
        <Text style={styles.buttonText}>離開</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4F8',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 40,
    color: '#333',
  },
  statsContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 60,
  },
  statBox: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: '40%',
  },
  statLabel: {
    fontSize: 16,
    color: '#667EEA',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '600',
    color: '#4A6CFA',
  },
  button: {
    backgroundColor: '#4A6CFA',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 12,
  },
  buttonText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
