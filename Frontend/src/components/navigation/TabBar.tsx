import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Text, Image, Animated, Pressable, Keyboard } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Grayscale } from 'react-native-color-matrix-image-filters';
import { USER_TAB_SCREENS } from '@/constants/tabScreen';
import { useTutorial } from '@/hooks/tutorial';

const THEME_COLORS = {
  background: '#1C1C1E',
  activeText: '#FFFFFF',
  inactiveText: '#8E8E93',
  cameraBackground: '#cee6ba',
  borderColor: '#1C1C1E',
};

export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const theme = THEME_COLORS;
  
  const scaleAnims = useRef(
    state.routes.map(() => new Animated.Value(1))
  ).current;

  const { registerElement, isTutorialVisible } = useTutorial();
  const scannerTabRef = useRef(null);
  const profileTabRef = useRef(null);
  const gameTabRef = useRef(null);
  const shopTabRef = useRef(null);

  const cameraButtonScale = useRef(new Animated.Value(1)).current;
  const cameraButtonRotate = useRef(new Animated.Value(0)).current;

  const animateTab = (index: number, toValue: number) => {
    Animated.spring(scaleAnims[index], {
      toValue,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  useEffect(() => {
  const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide',
    () => {
      if (isTutorialVisible) {
        setTimeout(() => {
        }, 100);
      }
    }
  );

  return () => {
    keyboardDidHideListener.remove();
  };
}, [isTutorialVisible]);

  const animateCameraPress = () => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(cameraButtonScale, {
          toValue: 0.85,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(cameraButtonRotate, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.spring(cameraButtonScale, {
          toValue: 1,
          friction: 3,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(cameraButtonRotate, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  };

  const rotation = cameraButtonRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '30deg'],
  });

  const getTabTestId = (routeName: string, index: number) => {
    return routeName === 'index' ? 'tab-home' : `tab-${routeName}`;
  };

  useEffect(() => {
    registerElement('scannerTab', scannerTabRef);
    registerElement('profileTab', profileTabRef);
    registerElement('gameTab', gameTabRef);
    registerElement('shopTab', shopTabRef);
  }, [registerElement]);

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <View style={styles.tabContainer}>
        <View style={[
          styles.backgroundDecoration,
          { backgroundColor: theme.background }
        ]}>
        </View>
      </View>
      
      <View style={styles.tabBarContainer} testID="tab-bar-container">
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label = options.title

          const isFocused = state.index === index;
          const isCamera = route.name === 'scanner';
          
          let ref;
          if (route.name === 'scanner') ref = scannerTabRef;
          else if (route.name === 'shop') ref = shopTabRef;
          else if (route.name === 'profile') ref = profileTabRef;
          else if (route.name === 'game') ref = gameTabRef;

          const screenConfig = USER_TAB_SCREENS.find(screen => screen.name === route.name);
          const iconSource = screenConfig?.icon;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }

            if (isCamera) {
              animateCameraPress();
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          if (isCamera) {
            return (
              <View 
                key={index} 
                ref={ref}
                style={styles.cameraButtonContainer}
                testID={getTabTestId(route.name, index)}
              >
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={isFocused ? { selected: true } : {}}
                  accessibilityLabel={options.tabBarAccessibilityLabel}
                  onPress={onPress}
                  onLongPress={onLongPress}
                  onPressIn={() => animateCameraPress()}
                >
                  <Animated.View
                    style={[
                      styles.cameraButton,
                      {
                        backgroundColor: theme.cameraBackground,
                        borderColor: theme.borderColor,
                        transform: [
                          { scale: cameraButtonScale },
                          { rotate: rotation },
                        ],
                      },
                    ]}
                  >
                    <Image 
                      source={iconSource}
                      style={styles.cameraIcon}
                      resizeMode="contain"
                    />
                  </Animated.View>
                </Pressable>
                {isFocused && (
                  <Animated.View style={styles.cameraActiveIndicator} />
                )}
              </View>
            );
          }

          const renderIcon = () => {
            const icon = (
              <Image 
                source={iconSource}
                style={styles.normalIcon}
                resizeMode="contain"
              />
            );
            
            return isFocused ? icon : <Grayscale>{icon}</Grayscale>;
          };

          return (
            <Pressable
              key={index}
              ref={ref}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              onPress={onPress}
              onLongPress={onLongPress}
              onPressIn={() => animateTab(index, 0.8)}
              onPressOut={() => animateTab(index, 1)}
              style={styles.tab}
              testID={getTabTestId(route.name, index)}
            >
              <Animated.View
                style={[
                  styles.tabContent,
                  {
                    transform: [{ scale: scaleAnims[index] }],
                  },
                ]}
              >
                <View style={styles.iconContainer}>
                  {renderIcon()}
                </View>
                <Text
                  style={[
                    styles.label,
                    { 
                      color: isFocused ? theme.activeText : theme.inactiveText,
                      fontWeight: isFocused ? '600' : '500',
                    }
                  ]}
                >
                  {label as string}
                </Text>
              </Animated.View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  tabContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 65,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  backgroundDecoration: {
    flex: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  tabBarContainer: {
    flexDirection: 'row',
    height: 65,
    alignItems: 'center',
  },
  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContent: {
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 3,
  },
  normalIcon: {
    width: 50,
    height: 50,
  },
  label: {
    marginTop: -12,
    fontSize: 12,
  },
  cameraButtonContainer: {
    flex: 1,
    alignItems: 'center',
    marginTop: -30,
  },
  cameraButton: {
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 8,
  },
  cameraIcon: {
    width: 60,
    height: 60,
    margin: 4,
  },
  cameraActiveIndicator: {
    position: 'absolute',
    bottom: -10,
    width: 8,
    height: 8,
    borderRadius: 4,
    opacity: 0.3,
  },
});