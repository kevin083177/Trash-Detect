import { Tabs } from 'expo-router';
import { TabBarIcon } from '@/src/components/navigation/TabBarIcon'
import { TAB_SCREEN_OPTIONS, TAB_SCREENS } from '@/src/constants/tabScreen';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={TAB_SCREEN_OPTIONS}>
      {TAB_SCREENS.map((screen) => (
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
          }}
        />
      ))}
    </Tabs>
  );
}