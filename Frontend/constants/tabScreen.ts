export const TAB_SCREEN_OPTIONS = {
  headerShown: false,
  tabBarStyle: {
    height: 60,
    paddingBottom: 8,
    paddingTop: 8,
  },
  tabBarActiveTintColor: '#007AFF',
  tabBarInactiveTintColor: '#8E8E93',
  tabBarLabelStyle: {
    fontSize: 12,
  },
} as const;

export const TAB_SCREENS = [
  {
    name: 'index',
    title: '首頁',
    icon: {
      focused: 'home',
      outline: 'home-outline',
    },
  },
  {
    name: 'shop',
    title: '商店',
    icon: {
      focused: 'storefront',
      outline: 'storefront-outline',
    },
  },
  {
    name: 'scanner',
    title: '相機',
    icon: {
      focused: 'camera',
      outline: 'camera-outline',
    },
  },
  {
    name: 'quest',
    title: '任務',
    icon: {
      focused: 'list',
      outline: 'list-outline',
    },
  },
  {
    name: 'profile',
    title: '個人',
    icon: {
      focused: 'person',
      outline: 'person-outline',
    },
  },
] as const;