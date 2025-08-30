import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import { TutorialStep } from '@/interface/Tutorial';
import { getTutorialSteps, measureElement, ElementRefs } from '@/constants/tutorialSteps';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUser } from './user';

interface TutorialContextType {
  isTutorialVisible: boolean;
  initialStep: number;
  tutorialSteps: TutorialStep[];
  username: string;
  startTutorial: () => Promise<void>;
  completeTutorial: () => void;
  registerElement: (id: string, ref: any) => void;
  checkAndShowTutorial: () => Promise<void>;
  resetTutorial: () => Promise<void>;
  saveUsername: (name: string) => Promise<void>;
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

const TUTORIAL_COMPLETED_KEY = 'tutorial_completed';
const TUTORIAL_PROGRESS_KEY = 'tutorial_progress';
const USERNAME_KEY = 'username';

export function TutorialProvider({ children }: { children: React.ReactNode }) {
  const [isTutorialVisible, setIsTutorialVisible] = useState(false);
  const [tutorialSteps, setTutorialSteps] = useState<TutorialStep[]>([]);
  const [username, setUsername] = useState('');
  const [initialStep, setInitialStep] = useState(0);
  const elementRefs = useRef<ElementRefs>({});

  const { updateUsername } = useUser();

  const registerElement = useCallback((id: string, ref: any) => {
    if (ref?.current) {
      elementRefs.current[id as keyof ElementRefs] = {
        measure: () => measureElement(ref)
      };
    }
  }, []);

  const saveUsername = useCallback(async (name: string) => {
    try {
      await AsyncStorage.setItem(USERNAME_KEY, name);
      await AsyncStorage.setItem(TUTORIAL_PROGRESS_KEY, 'username_saved');
      setUsername(name);
      
      const { success } = await updateUsername(name);
      if (!success) {
        console.warn('Failed to update username');
      }
      const steps = await getTutorialSteps(elementRefs.current, name);
      setTutorialSteps(steps);
      
    } catch (error) {
      console.warn('Failed to save username:', error);
    }
  }, []);

  const startTutorial = useCallback(async () => {
    try {
      const savedUsername = await AsyncStorage.getItem(USERNAME_KEY);
      const progress = await AsyncStorage.getItem(TUTORIAL_PROGRESS_KEY);

      if (savedUsername) {
        setUsername(savedUsername);
      }
      
      if (progress === 'username_saved' && savedUsername) {
        setInitialStep(1);
      } else {
        setInitialStep(0);
      }

      const steps = await getTutorialSteps(elementRefs.current, savedUsername || '');
      setTutorialSteps(steps);
    } catch (error) {
      console.warn('Failed to get element positions, using fallback:', error);
    }
    
    setIsTutorialVisible(true);
  }, []);

  const completeTutorial = useCallback(async () => {
    setIsTutorialVisible(false);
    try {
      await AsyncStorage.setItem(TUTORIAL_COMPLETED_KEY, 'true');
      await AsyncStorage.removeItem(TUTORIAL_PROGRESS_KEY);
    } catch (error) {
      console.warn('Failed to save tutorial completion:', error);
    }
  }, []);

  const resetTutorial = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(TUTORIAL_COMPLETED_KEY);
      await AsyncStorage.removeItem(TUTORIAL_PROGRESS_KEY);
      await AsyncStorage.removeItem(USERNAME_KEY);
      setUsername('');
    } catch (error) {
      console.warn('Failed to reset tutorial:', error);
    }
  }, []);
  
  const checkAndShowTutorial = useCallback(async () => {
    try {
      const completed = await AsyncStorage.getItem(TUTORIAL_COMPLETED_KEY);
      if (!completed) {
        setTimeout(() => {
          startTutorial();
        }, 1000);
      }
    } catch (error) {
      console.warn('Failed to check tutorial status:', error);
      setTimeout(() => {
        startTutorial();
      }, 1000);
    }
  }, [startTutorial]);

  return (
    <TutorialContext.Provider value={{
      isTutorialVisible,
      initialStep,
      tutorialSteps,
      username,
      startTutorial,
      completeTutorial,
      registerElement,
      checkAndShowTutorial,
      saveUsername,
      resetTutorial
    }}>
      {children}
    </TutorialContext.Provider>
  );
}

export const useTutorial = () => {
  const context = useContext(TutorialContext);
  if (!context) {
    throw new Error('useTutorial must be used within TutorialProvider');
  }
  return context;
};