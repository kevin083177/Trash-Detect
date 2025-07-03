import React, { ReactNode } from "react"
import { View, Text, TouchableOpacity, StyleSheet } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { Router } from "expo-router";

export default function Headers({ router, username, money, showBackpack=true ,showShop=true, showBackButton=false }: { router: Router, username: string, money: number, showBackpack?: boolean, showShop?: boolean, showBackButton?: boolean }): ReactNode {
    return (
        <View style={styles.header}>
            { showBackButton &&
              <TouchableOpacity onPress={() => router.replace('/')}>
                <Ionicons name="arrow-back" size={24}></Ionicons>
              </TouchableOpacity>
            }
            <TouchableOpacity style={styles.userSection} onPress={() => router.push('/profile')}>
                <View style={styles.coinContainer}>
                  <Ionicons name="logo-usd" size={20} color="#FFD700" />
                  <Text style={styles.coinText}>{money}</Text>
              </View>
            </TouchableOpacity>
            <View style={{ flexDirection: 'row'}}>
              { showBackpack &&
                <TouchableOpacity style={styles.shopIcon} onPress={() => router.push('/backpack' as any)}>
                  <Ionicons name="bed-outline" size={24} color="black" />
                </TouchableOpacity>
              }
              { showShop &&
                <TouchableOpacity style={styles.shopIcon} onPress={() => router.push('/shop')}>
                    <Ionicons name="storefront-outline" size={24} color="black" />
                </TouchableOpacity>
              }
            </View>
      </View>
    )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    height: 45
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    paddingHorizontal: 16,
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