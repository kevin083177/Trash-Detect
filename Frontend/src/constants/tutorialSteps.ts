import { TutorialStep } from "@/interface/Tutorial";

export interface ElementRefs {
  home?: { measure: () => Promise<{ x: number; y: number; width: number; height: number }> };
  dog?: { measure: () => Promise<{ x: number; y: number; width: number; height: number }> };
  scannerTab?: { measure: () => Promise<{ x: number; y: number; width: number; height: number }> };
  gameTab?: { measure: () => Promise<{ x: number; y: number; width: number; height: number }> };
  shopTab?: { measure: () => Promise<{ x: number; y: number; width: number; height: number }> };
  profileTab?: { measure: () => Promise<{ x: number; y: number; width: number; height: number }> };
  roomDecoration?: { measure: () => Promise<{ x: number; y: number; width: number; height: number }> };
  dailyCheckIn?: { measure: () => Promise<{ x: number; y: number; width: number; height: number }> };
}

const getStaticTutorialSteps = (username: string = ''): Omit<TutorialStep, 'targetElement'>[] => [
  {
    id: 'dog',
    title: '初次見面！',
    description: '主人您好！我是您的小寵物嘎逼，請問主人叫什麼呢？',
    placement: 'top',
    requiresInput: true,
  },
  {
    id: 'dog',
    title: `${username} 您好！`,
    description: '很高興認識您！讓我帶您了解應用程式的所有功能吧！',
    placement: 'top'
  },
  {
    id: 'home',
    title: '主人與嘎逼的家',
    description:'這裡是我們的房間，平常我會待在家裡，等主人出門冒險回來！',
    placement: 'screen-top',
    spotlight: {
      padding: {
        bottom: -25,
      }
    }
  },
  {
    id: 'room_decoration',
    title: '家具布置',
    description: '這裡可以變更家具，讓我有更好的家，住的更舒適！',
    placement: 'bottom',
  },
  {
    id: 'shop_tab',
    title: '商店',
    description: '家具可以在商店中透過狗狗幣購買，或是兌換實體商品喔！',
    placement: 'top',
    spotlight: {
      padding: {
        top: -1,
        bottom: -0.5,
        right: -4,
        left: -4
      }
    }
  },
  {
    id: 'game_tab',
    title: '冒險',
    description: '狗狗幣需要主人去冒險才能獲得，但每個關卡都要掃描一定的垃圾才能解鎖喔！',
    placement: 'top',
    spotlight: {
      padding: {
        top: -1,
        bottom: -0.5,
        right: -4,
        left: -4
      }
    }
    
  },
  {
    id: 'scanner_tab',
    title: '垃圾掃描',
    description: '這裡可以掃描垃圾，只要把手機對準垃圾就可以解鎖冒險關卡！',
    placement: 'top',
    spotlight: {
      padding: {
        top: -0.5,
        bottom: -1,
        left: -1,
        right: -1
      }
    }
  },
  {
    id: 'profile_tab',
    title: '個人資料',
    description: '另外主人能夠查看回收與答題統計，了解自己對於資源回收的知識掌握度。',
    placement: 'top',
    spotlight: {
      padding: {
        top: -1,
        bottom: -0.5,
        right: -4,
        left: -4
      }
    }
  },
  {
    id: 'dailyCheckIn',
    title: '每日簽到',
    description: '還有別忘了每天都來看看我，並且領取獎勵！',
    placement: 'bottom'
  },
  {
    id: 'dog',
    title: '教學完成',
    description: '主人您已經了解所有主要功能，點選下方的掃描按鈕並開始冒險吧',
    placement: 'top',
  },
];

export const getTutorialSteps = async (
  elementRefs: ElementRefs,
  username: string = ''
): Promise<TutorialStep[]> => {
  const staticSteps = getStaticTutorialSteps(username);
  const steps: TutorialStep[] = [];

  for (const step of staticSteps) {
    let targetElement;

    try {
      switch (step.id) {
        case 'home':
          if (elementRefs.home) {
            targetElement = await elementRefs.home.measure();
            break;
          }
        case 'dog':
          if (elementRefs.dog) {
            targetElement = await elementRefs.dog.measure();
            break;
          }
        case 'scanner_tab':
          if (elementRefs.scannerTab) {
            targetElement = await elementRefs.scannerTab.measure();
          }
          break;
        case 'game_tab':
          if (elementRefs.gameTab) {
            targetElement = await elementRefs.gameTab.measure();
          }
          break;
        case 'shop_tab':
          if (elementRefs.shopTab) {
            targetElement = await elementRefs.shopTab.measure();
            break;
          }
        case 'room_decoration':
          if (elementRefs.roomDecoration) {
            targetElement = await elementRefs.roomDecoration.measure();
          }
          break;
        case 'profile_tab':
          if (elementRefs.profileTab) {
            targetElement = await elementRefs.profileTab.measure();
            break;
          }
        case 'dailyCheckIn':
          if (elementRefs.dailyCheckIn) {
            targetElement = await elementRefs.dailyCheckIn.measure();
            break;
          }
      }
    } catch (error) {
      console.warn(`Failed to measure element for step ${step.id}:`, error);
    }

    steps.push({
      ...step,
      targetElement,
    });
  }

  return steps;
};

export const measureElement = (ref: any): Promise<{ x: number; y: number; width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    if (!ref?.current) {
      reject(new Error('Element ref is not available'));
      return;
    }

    ref.current.measureInWindow((x: number, y: number, width: number, height: number) => {
      resolve({ x, y, width, height });
    });
  });
};