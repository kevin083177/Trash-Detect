import React, { useEffect } from 'react';
import { View } from 'react-native';
import { Tabs, usePathname } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { TabBar } from '@/components/navigation/TabBar';
import { Tutorial } from '@/components/Tutorial';
import { TutorialProvider, useTutorial } from '@/hooks/tutorial';
import { USER_TAB_SCREENS, HIDE_TAB_BAR_PATHS } from '@/constants/tabScreen';

function TabsWithTutorial() {
  const pathname = usePathname();
  const shouldHideTabBar = HIDE_TAB_BAR_PATHS.some(path => pathname.includes(path));
  const { 
    isTutorialVisible, 
    tutorialSteps, 
    completeTutorial, 
    checkAndShowTutorial,
  } = useTutorial();

  useEffect(() => {
    if (pathname === '/') {
      checkAndShowTutorial();
    }
  }, [pathname, checkAndShowTutorial]);

  return (
    <>
      <Tabs
        screenOptions={{ headerShown: false }}
        tabBar={(props) => {
          if (shouldHideTabBar) {
            return <View />;
          }
          return <TabBar {...props} />;
        }}
      >
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

      {isTutorialVisible && (
        <Tutorial
          visible={isTutorialVisible}
          steps={tutorialSteps}
          onComplete={completeTutorial}
        />
      )}
    </>
  );
}

export default function TabsLayout() {
  return (
    <SafeAreaProvider>
      <TutorialProvider>
        <View style={{ flex: 1 }}>
          <TabsWithTutorial />
        </View>
      </TutorialProvider>
    </SafeAreaProvider>
  );
}