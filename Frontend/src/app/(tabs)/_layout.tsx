import React, { View } from 'react-native';
import { Tabs, usePathname } from 'expo-router';
import { TabBarIcon } from '@/components/navigation/TabBarIcon';
import { 
  TAB_SCREEN_OPTIONS, 
  USER_TAB_SCREENS, 
  HIDE_TAB_BAR_PATHS 
} from '@/constants/tabScreen';

export default function TabsLayout() {
  const pathname = usePathname();
  const shouldHideTabBar = HIDE_TAB_BAR_PATHS.some(path => pathname.includes(path));

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          ...TAB_SCREEN_OPTIONS,
          tabBarStyle: {
            ...TAB_SCREEN_OPTIONS.tabBarStyle,
            display: shouldHideTabBar ? 'none' : 'flex',
          }
        }}
      >
        {/* 用戶頁面 */}
        {USER_TAB_SCREENS.map((screen) => (
        <Tabs.Screen
          key={screen.name}
          name={screen.name}
          options={{
            title: screen.title,
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon
                source={focused ? screen.icon.focused : screen.icon.outline}
                color={color}
                focused={focused}
              />
            ),
          }}
        />
      ))}
      </Tabs>
    </View>
  );
}