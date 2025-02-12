import { View } from 'react-native';
import { Tabs, usePathname } from 'expo-router';
import { TabBarIcon } from '@/components/navigation/TabBarIcon';
import { 
  TAB_SCREEN_OPTIONS, 
  USER_TAB_SCREENS, 
  ADMIN_TAB_SCREENS, 
  HIDE_TAB_BAR_PATHS 
} from '@/constants/tabScreen';
import { useAuth } from '@/hooks/auth';
import { AdminModeToggle } from '@/components/AdminModeToggle';

export default function TabsLayout() {
  const pathname = usePathname();
  const shouldHideTabBar = HIDE_TAB_BAR_PATHS.some(path => pathname.includes(path));
  const { isAdminMode } = useAuth();

  return (
    <View style={{ flex: 1 }}>
      <AdminModeToggle />
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
                  name={focused ? screen.icon.focused : screen.icon.outline}
                  color={color}
                />
              ),
              tabBarButton: isAdminMode ? () => null : undefined,
              // 在管理員模式下完全隱藏
              tabBarItemStyle: isAdminMode ? { display: 'none', width: 0 } : undefined
            }}
          />
        ))}

        {/* 管理員頁面 */}
        {ADMIN_TAB_SCREENS.map((screen) => (
          <Tabs.Screen
            key={`admin-${screen.name}`}
            name={`admin/${screen.name}`}
            options={{
              title: screen.title,
              tabBarIcon: ({ color, focused }) => (
                <TabBarIcon
                  name={focused ? screen.icon.focused : screen.icon.outline}
                  color={color}
                />
              ),
              tabBarButton: !isAdminMode ? () => null : undefined,
              tabBarItemStyle: !isAdminMode ? { display: 'none', width: 0 } : undefined
            }}
          />
        ))}
      </Tabs>
    </View>
  );
}