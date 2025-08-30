import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  TUTORIAL_COMPLETED: '@tutorial_main_completed',
  TUTORIAL_STEPS: '@tutorial_steps_completed',
} as const;

export interface TutorialProgress {
  tutorialCompleted: boolean;
  completedSteps: string[];
}

class TutorialStorage {
  async setTutorialCompleted(completed: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.TUTORIAL_COMPLETED, JSON.stringify(completed));
    } catch (error) {
      console.error('設置教學完成狀態失敗:', error);
      throw error;
    }
  }

  async getTutorialCompleted(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(STORAGE_KEYS.TUTORIAL_COMPLETED);
      return value ? JSON.parse(value) : false;
    } catch (error) {
      console.error('獲取教學完成狀態失敗:', error);
      return false;
    }
  }

  async getCompletedSteps(): Promise<string[]> {
    try {
      const value = await AsyncStorage.getItem(STORAGE_KEYS.TUTORIAL_STEPS);
      return value ? JSON.parse(value) : [];
    } catch (error) {
      console.error('獲取已完成教學步驟失敗:', error);
      return [];
    }
  }

  async isStepCompleted(stepId: string): Promise<boolean> {
    try {
      const completedSteps = await this.getCompletedSteps();
      return completedSteps.includes(stepId);
    } catch (error) {
      console.error('檢查教學步驟狀態失敗:', error);
      return false;
    }
  }

  async getTutorialProgress(): Promise<TutorialProgress> {
    try {
      const [
        tutorialCompleted,
        completedSteps,
      ] = await Promise.all([
        this.getTutorialCompleted(),
        this.getCompletedSteps(),
      ]);

      return {
        tutorialCompleted,
        completedSteps,
      };
    } catch (error) {
      console.error('獲取教學進度失敗:', error);
      return {
        tutorialCompleted: false,
        completedSteps: [],
      };
    }
  }

  async resetAllTutorial(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.TUTORIAL_COMPLETED),
        AsyncStorage.removeItem(STORAGE_KEYS.TUTORIAL_STEPS),
      ]);
    } catch (error) {
      console.error('重置教學狀態失敗:', error);
      throw error;
    }
  }

  async skipAllTutorials(): Promise<void> {
    try {
      await Promise.all([
        this.setTutorialCompleted(true),
      ]);
    } catch (error) {
      console.error('跳過所有教學失敗:', error);
      throw error;
    }
  }
}

export const tutorialStorage = new TutorialStorage();