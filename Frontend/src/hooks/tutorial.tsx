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
  checkAndShowTutorial: (username?: string | null, hasUsername?: boolean, userEmail?: string) => Promise<void>;
  resetTutorial: () => Promise<void>;
  saveUsername: (name: string) => Promise<void>;
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

const TUTORIAL_COMPLETED_KEY = 'tutorial_completed';
const TUTORIAL_PROGRESS_KEY = 'tutorial_progress';
const USERNAME_KEY = 'username';

const getUserKey = (baseKey: string, userEmail?: string) => {
  if (userEmail) {
    return `${baseKey}_${userEmail}`;
  }
  return baseKey;
};

export function TutorialProvider({ children }: { children: React.ReactNode }) {
  const [isTutorialVisible, setIsTutorialVisible] = useState(false);
  const [tutorialSteps, setTutorialSteps] = useState<TutorialStep[]>([]);
  const [username, setUsername] = useState('');
  const [initialStep, setInitialStep] = useState(0);
  const elementRefs = useRef<ElementRefs>({});
  
  const [hasCheckedTutorial, setHasCheckedTutorial] = useState(false);
  const currentUserEmailRef = useRef<string>('');

  const { updateUsername, user, fetchUserProfile } = useUser();

  const registerElement = useCallback((id: string, ref: any) => {
    if (ref?.current) {
      elementRefs.current[id as keyof ElementRefs] = {
        measure: () => measureElement(ref)
      };
    }
  }, []);

  const saveUsername = useCallback(async (name: string) => {
    try {
      const userEmail = currentUserEmailRef.current;
      await AsyncStorage.setItem(getUserKey(USERNAME_KEY, userEmail), name);
      await AsyncStorage.setItem(getUserKey(TUTORIAL_PROGRESS_KEY, userEmail), 'username_saved');
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
      const userEmail = currentUserEmailRef.current;
      
      if (hasUsername && username) {
        setUsername(username);
        setInitialStep(1);
        await AsyncStorage.setItem(getUserKey(USERNAME_KEY, userEmail), username);
        await AsyncStorage.setItem(getUserKey(TUTORIAL_PROGRESS_KEY, userEmail), 'username_saved');
        
        const steps = await getTutorialSteps(elementRefs.current, username);
        setTutorialSteps(steps);
      } else {
        const savedUsername = await AsyncStorage.getItem(getUserKey(USERNAME_KEY, userEmail));
        const progress = await AsyncStorage.getItem(getUserKey(TUTORIAL_PROGRESS_KEY, userEmail));

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
      const userEmail = currentUserEmailRef.current;
      await AsyncStorage.setItem(getUserKey(TUTORIAL_COMPLETED_KEY, userEmail), 'true');
      await AsyncStorage.removeItem(getUserKey(TUTORIAL_PROGRESS_KEY, userEmail));
    } catch (error) {
      console.warn('Failed to save tutorial completion:', error);
    }
  }, []);

  const resetTutorial = useCallback(async () => {
    try {
      const userEmail = currentUserEmailRef.current;
      await AsyncStorage.removeItem(getUserKey(TUTORIAL_COMPLETED_KEY, userEmail));
      await AsyncStorage.removeItem(getUserKey(TUTORIAL_PROGRESS_KEY, userEmail));
      await AsyncStorage.removeItem(getUserKey(USERNAME_KEY, userEmail));
      setUsername('');
      setHasCheckedTutorial(false);
    } catch (error) {
      console.warn('Failed to reset tutorial:', error);
    }
  }, []);
  
  const checkAndShowTutorial = useCallback(async (
    providedUsername?: string | null, 
    providedHasUsername?: boolean,
    userEmail?: string
  ) => {
    if (userEmail) {
      currentUserEmailRef.current = userEmail;
    } else {
      try {
        await fetchUserProfile();
        currentUserEmailRef.current = user?.email || ''; 
      } catch (error) {
        console.warn('Failed to get user profile:', error);
      }
    }
    
    if (hasCheckedTutorial) {
      return;
    }
    
    try {
      const currentEmail = currentUserEmailRef.current;
      const completed = await AsyncStorage.getItem(getUserKey(TUTORIAL_COMPLETED_KEY, currentEmail));
      if (completed === 'true') {
        setHasCheckedTutorial(true);
        return;
      }

      let username: string | null;
      let hasUsername: boolean;

      if (providedUsername !== undefined && providedHasUsername !== undefined) {
        username = providedUsername;
        hasUsername = providedHasUsername;
      } else {
        username = null;
        hasUsername = false;
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
  }, [hasCheckedTutorial, fetchUserProfile, startTutorial]);

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