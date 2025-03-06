import React, { ReactNode } from "react"
import { View, Text, TouchableOpacity, StyleSheet } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { Router } from "expo-router";

export default function Headers({ router, username, money, showShop=true }: { router: Router, username: string, money: number, showShop?: boolean }): ReactNode {
    return (
        <View style={styles.header}>
            <TouchableOpacity style={styles.userSection} onPress={() => router.push('/profile')}>
                <Ionicons name="person-outline" size={24} color="black" />
                <Text style={styles.userName}>{username}</Text>
            </TouchableOpacity>
            <View style={styles.coinContainer}>
                <Ionicons name="logo-usd" size={20} color="#FFD700" />
                <Text style={styles.coinText}>{money}</Text>
            </View>
            { showShop &&
              <TouchableOpacity style={styles.shopIcon} onPress={() => router.push('/(tabs)/shop')}>
                  <Ionicons name="storefront-outline" size={24} color="black" />
                  <Text style={styles.smallText}>SHOP</Text>
              </TouchableOpacity>
            }
      </View>
    )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2C3E50',
  },
  coinContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF9E6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  coinText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#B7791F', // 金幣數字顏色
  },
  shopIcon: {
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  smallText: {
    fontSize: 12,
    color: '#4A5568',
    marginTop: 2,
    fontWeight: '500',
  }
});