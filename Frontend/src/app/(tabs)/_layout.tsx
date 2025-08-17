import React from 'react';
import { View } from 'react-native';
import { Tabs, usePathname } from 'expo-router';
import { TabBar } from '@/components/navigation/TabBar';
import { 
  USER_TAB_SCREENS, 
  HIDE_TAB_BAR_PATHS 
} from '@/constants/tabScreen';

export default function TabsLayout() {
  const pathname = usePathname();
  const shouldHideTabBar = HIDE_TAB_BAR_PATHS.some(path => pathname.includes(path));

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{ headerShown: false }}
        tabBar={(props) => {
          if (shouldHideTabBar) {
            return <View />;
          }
          return <TabBar {...props} />;
        }}
      >
        {/* 用戶頁面 */}
        {USER_TAB_SCREENS.map((screen) => (
          <Tabs.Screen
            key={screen.name}
            name={screen.name}
            options={{
              title: screen.title,
            }}
          />
        ))}
      </Tabs>
    </View>
  );
}