// 關閉 Tab Bar 的路由
export const HIDE_TAB_BAR_PATHS = [
  '/setting',
  '/verification',
  '/scanner',
  '/backpack',
  '/shop',
  '/game/gameplay',
  '/feedback',
  '/create'
]

// Tab bar icon with navigation/TabBarIcon
export const USER_TAB_SCREENS = [
  {
    name: 'index',
    title: '首頁',
    icon: require('@/assets/icons/home.png')
  },
  {
    name: 'shop',
    title: '商店',
    icon: require('@/assets/icons/shop.png'),
  },
  {
    name: 'scanner',
    title: '相機',
    icon: require('@/assets/icons/camera.png'),
    isSpecial: true,
  },
  {
    name: 'game',
    title: '冒險',
    icon: require('@/assets/icons/game.png'),
  },
  {
    name: 'profile',
    title: '個人',
    icon: require('@/assets/icons/profile.png'),
  },
] as const;