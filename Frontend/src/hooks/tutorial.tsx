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
  startTutorial: (username: string | null, hasUsername: boolean) => Promise<void>;
  completeTutorial: () => void;
  registerElement: (id: string, ref: any) => void;
  checkAndShowTutorial: (username?: string | null, hasUsername?: boolean) => Promise<void>;
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
  
  const [hasCheckedTutorial, setHasCheckedTutorial] = useState(false);

  const { updateUsername, getUsername } = useUser();

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
  }, [updateUsername]);

  const startTutorial = useCallback(async (username: string | null, hasUsername: boolean) => {
    try {
      if (hasUsername && username) {
        setUsername(username);
        setInitialStep(1);
        await AsyncStorage.setItem(USERNAME_KEY, username);
        await AsyncStorage.setItem(TUTORIAL_PROGRESS_KEY, 'username_saved');
        
        const steps = await getTutorialSteps(elementRefs.current, username);
        setTutorialSteps(steps);
      } else {
        const savedUsername = await AsyncStorage.getItem(USERNAME_KEY);
        const progress = await AsyncStorage.getItem(TUTORIAL_PROGRESS_KEY);

        if (savedUsername && progress === 'username_saved') {
          setUsername(savedUsername);
          setInitialStep(1);
        } else {
          setUsername('');
          setInitialStep(0);
        }

        const steps = await getTutorialSteps(elementRefs.current, savedUsername || '');
        setTutorialSteps(steps);
      }
    } catch (error) {
      console.warn('Failed to get element positions, using fallback:', error);
      setInitialStep(0);
      const steps = await getTutorialSteps(elementRefs.current, '');
      setTutorialSteps(steps);
    }
    
    setIsTutorialVisible(true);
  }, []);

  const completeTutorial = useCallback(async () => {
    setIsTutorialVisible(false);
    setHasCheckedTutorial(true);
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
      setHasCheckedTutorial(false);
    } catch (error) {
      console.warn('Failed to reset tutorial:', error);
    }
  }, []);
  
  const checkAndShowTutorial = useCallback(async (providedUsername?: string | null, providedHasUsername?: boolean) => {
    if (hasCheckedTutorial) {
      return;
    }
    
    try {
      const completed = await AsyncStorage.getItem(TUTORIAL_COMPLETED_KEY);
      if (completed === 'true') {
        setHasCheckedTutorial(true);
        return;
      }

      let username: string | null;
      let hasUsername: boolean;

      if (providedUsername !== undefined && providedHasUsername !== undefined) {
        username = providedUsername;
        hasUsername = providedHasUsername;
      } 

      setHasCheckedTutorial(true);

      setTimeout(() => {
        startTutorial(username, hasUsername);
      }, 500);
      
    } catch (error) {
      console.warn('Failed to check tutorial status:', error);
      setTimeout(() => {
        startTutorial(null, false);
      }, 500);
    }
  }, [hasCheckedTutorial, getUsername, startTutorial]);

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