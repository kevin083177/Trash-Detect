import React, { ReactNode } from "react"
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, Image } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { Router } from "expo-router";

interface HeadersProps {
  router: Router;
  username: string;
  money: number;
  showBackpack?: boolean;
  showShop?: boolean;
  showBackButton?: boolean;
  style?: ViewStyle;
}

export default function Headers({ 
  router, 
  username, 
  money, 
  showBackpack = true,
  showShop = true, 
  showBackButton = false,
  style
}: HeadersProps): ReactNode {
    return (
      <View style={[styles.header, style]}>
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
          <TouchableOpacity style={styles.iconContainer} onPress={() => router.push('/backpack' as any)}>
            <Image
              source={require('@/assets/icons/room.png')}
              style={styles.icon}
            />
          </TouchableOpacity>
        }
        { showShop &&
          <TouchableOpacity style={styles.iconContainer} onPress={() => router.push('/(tabs)/shop')}>
            <Image
              source={require('@/assets/icons/shop.png')}
              style={styles.icon}
            />
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
    elevation: 3,
    height: 50,
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
  icon: {
    width: 50,
    height: 50,
  },
  coinText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#B7791F',
  },
  iconContainer: {
    alignItems: 'center',
    paddingHorizontal: 4,
    borderRadius: 16,
  },
  smallText: {
    fontSize: 12,
    color: '#4A5568',
    marginTop: 2,
    fontWeight: '500',
  }
});