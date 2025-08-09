// 關閉 Tab Bar 的路由
export const HIDE_TAB_BAR_PATHS = [
  'setting',
  'verification',
  '/scanner',
  '/backpack',
  '/shop/theme',
  '/game/gameplay',
  '/game/result',
  'feedback',
  'create'
]

// Tab Bar styles
export const TAB_SCREEN_OPTIONS = {
  headerShown: false,
  tabBarStyle: {
    height: 62,
    paddingBottom: 8,
    paddingTop: 8,
  },
  tabBarActiveTintColor: '#007AFF',
  tabBarInactiveTintColor: '#8E8E93',
  tabBarLabelStyle: {
    fontSize: 14,
  },
} as const;

// Tab bar icon with navigation/TabBarIcon
export const USER_TAB_SCREENS = [
  {
    name: 'index',
    title: '首頁',
    icon: {
      focused: require('@/assets/icons/home-on.png'),
      outline: require('@/assets/icons/home-off.png'),
    },
  },
  // {
  //   name: 'shop',
  //   title: '商店',
  //   icon: {
  //     focused: require('@/assets/icons/profile-on.png'),
  //     outline: require('@/assets/icons/profile-off.png'),
  //   },
  // },
  {
    name: 'scanner',
    title: '相機',
    icon: {
      focused: require('@/assets/icons/scanner-on.png'),
      outline: require('@/assets/icons/scanner-off.png'),
    },
  },
  // {
  //   name: 'game',
  //   title: '冒險',
  //   icon: {
  //     focused: require('@/assets/icons/profile-on.png'),
  //     outline: require('@/assets/icons/profile-off.png'),
  //   },
  // },
  {
    name: 'profile',
    title: '個人',
    icon: {
      focused: require('@/assets/icons/profile-on.png'),
      outline: require('@/assets/icons/profile-off.png'),
    },
  },
] as const;