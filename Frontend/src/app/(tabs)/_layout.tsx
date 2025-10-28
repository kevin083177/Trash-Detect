import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';
import { Tabs, usePathname } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { TabBar } from '@/components/navigation/TabBar';
import { Tutorial } from '@/components/Tutorial';
import { TutorialProvider, useTutorial } from '@/hooks/tutorial';
import { USER_TAB_SCREENS, HIDE_TAB_BAR_PATHS } from '@/constants/tabScreen';
import { useRoute } from '@react-navigation/native';
import { useAuth } from '@/hooks/auth';
import { useUser } from '@/hooks/user';

function TabsWithTutorial() {
  const pathname = usePathname();
  const route = useRoute();
  const shouldHideTabBar = HIDE_TAB_BAR_PATHS.some(path => pathname.includes(path));
  const { 
    isTutorialVisible, 
    tutorialSteps, 
    completeTutorial, 
    checkAndShowTutorial,
  } = useTutorial();

  const { fetchUserProfile } = useUser();
  const { isAuthenticated } = useAuth();
  
  const hasInitializedRef = useRef(false);
  
  useEffect(() => {
    if (isAuthenticated && route.name === '(tabs)' && !hasInitializedRef.current) {
      hasInitializedRef.current = true;
      
      fetchUserProfile()
        .then((userData) => {
          const hasUsername = !!(userData?.username);
          const userEmail = userData?.email || '';
          setTimeout(() => {
            checkAndShowTutorial(userData?.username || null, hasUsername, userEmail);
          }, 500);
        })
        .catch((error) => {
          console.warn('Failed to fetch user profile:', error);
          setTimeout(() => {
            checkAndShowTutorial(null, false);
          }, 500);
        });
    }
  }, [isAuthenticated, route.name]);

  useEffect(() => {
    if (!isAuthenticated) {
      hasInitializedRef.current = false;
    }
  }, [isAuthenticated]);

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