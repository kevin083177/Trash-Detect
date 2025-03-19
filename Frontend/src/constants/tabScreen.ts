// 關閉 Tab Bar 的路由
export const HIDE_TAB_BAR_PATHS = [
  'setting',
  '/backpack',
  '/shop/theme',
]

// Tab Bar styles
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

// Tab bar icon with navigation/TabBarIcon
export const USER_TAB_SCREENS = [
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
    name: 'game',
    title: '冒險',
    icon: {
      focused: 'map',
      outline: 'map-outline',
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

export const ADMIN_TAB_SCREENS = [
  {
    name: 'index',
    title: '總覽',
    icon: {
      focused: 'pie-chart',
      outline: 'pie-chart-outline',
    },
  },
  {
    name: 'users',
    title: '用戶管理',
    icon: {
      focused: 'people',
      outline: 'people-outline',
    },
  },
  {
    name: 'products',
    title: '商品管理',
    icon: {
      focused: 'bag-check',
      outline: 'bag-check-outline'
    }
  },
  {
    name: 'themes',
    title: '主題管理',
    icon: {
      focused: 'color-palette',
      outline: 'color-palette-outline'
    }
  }
] as const;