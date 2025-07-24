import { chapter_api, user_level_api } from "@/api/api";
import { Chapter } from "@/interface/Chapter";
import { UserLevel } from "@/interface/UserLevel";
import { asyncGet, asyncPut } from "@/utils/fetch";
import { tokenStorage } from "@/utils/tokenStorage";
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";

interface UserLevelContextType {
    chapters: Chapter[];
    userLevelProgress: UserLevel;
    loading: boolean;
    error: string | null;

    fetchChapters: () => Promise<void>;
    fetchUserLevelProgress: () => Promise<void>;
    updateLevelProgress: (levelId: number, score: number) => Promise<boolean>;
    updateCompletedChapter: (chapter_sequence: number, score: number, money: number) => Promise<boolean>;
    setChapterUnlocked: (chapterSequence: number) => Promise<boolean>;
    setChapterCompleted: (chapterSequence: number) => Promise<boolean>;
    refreshAll: () => Promise<void>;

    isChapterCompleted: (sequence: number) => boolean;
    isChapterUnlocked: (sequence: number) => boolean;
    isChapterInDatabase: (sequence: number) => boolean;
    canUnlockChapter: (sequence: number) => boolean;
    getChaptersToRender: (allChapters?: Chapter[]) => Chapter[];
    
    getChapterBySequence: (sequence: number) => Chapter | undefined;
    getLevelProgress: (levelId: number) => { stars: number; score: number } | null;
    getHighestLevel: () => number;
    getRemainingTimes: (sequence: number) => number | undefined;
    getChallengeHighestScore: (sequence: number) => number | undefined;
}

const UserLevelContext = createContext<UserLevelContextType | undefined>(undefined);

interface UserLevelProviderProps {
    children: ReactNode;
}

export function UserLevelProvider({ children }: UserLevelProviderProps){
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [userLevelProgress, setUserLevelProgress] = useState<UserLevel>({
        chapter_progress: {},
        highest_level: 0,
        level_progress: {},
        completed_chapter: {}
    });
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [dataInitialized, setDataInitialized] = useState<boolean>(false);

    const fetchChapters = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            
            const token = await tokenStorage.getToken();
            if (!token) return;

            const response = await asyncGet(chapter_api.get_all_chapters, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            });

            if (response.status === 200) {
                const chaptersData = response.body;
                setChapters(chaptersData);
                setError(null);
            }
        } catch (error) {
            console.error('Error fetching chapters:', error);
            setError('發生錯誤，請檢查網路連接');
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchUserLevelProgress = useCallback(async () => {
        try {
            const token = await tokenStorage.getToken();
            if (!token) return;

            const response = await asyncGet(user_level_api.get_user_level, {
                headers: { 
                    Authorization: `Bearer ${token}` 
                }
            });

            if (response && response.status === 200) {
                setUserLevelProgress(response.body);
            }
        } catch (error) {
            console.error('Error fetching user level progress:', error);
            setError('無法獲取關卡進度，請檢查網路連接');
        }
    }, []);

    const updateLevelProgress = useCallback(async (levelId: number, score: number): Promise<boolean> => {
        try {
            const token = await tokenStorage.getToken();
            if (!token) return false;

            const response = await asyncPut(user_level_api.update_level, {
                headers: { 
                    Authorization: `Bearer ${token}` 
                },
                body: { 
                    sequence: levelId, 
                    score, 
                },
            });

            if (response.status === 200) {
                const newUserLevelProgress = response.body;
                setUserLevelProgress(newUserLevelProgress);
                
                const chapterSequence = Math.ceil(levelId / 5);
                const isChapterFullyCompleted = isChapterAllThreeStars(chapterSequence, newUserLevelProgress.level_progress);
                
                if (isChapterFullyCompleted && !isChapterCompleted(chapterSequence)) {
                    await setChapterCompleted(chapterSequence);
                }
                
                return true;
            }

            return false;
        } catch (error) {
            console.error("Error updating level progress:", error);
            return false;
        }
    }, []);

    const updateCompletedChapter = useCallback(async (chapter_sequence: number, score: number, money: number): Promise<boolean> => {
        try {
            const token = await tokenStorage.getToken();
            if (!token) return false;

            const response = await asyncPut(user_level_api.update_completed_chapter, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: {
                    "chapter_sequence": chapter_sequence,
                    "score": score,
                    "money": money
                }
            });

            if (response.status === 200) {
                const chapterKey = chapter_sequence.toString();
                
                setUserLevelProgress(prevState => ({
                    ...prevState,
                    completed_chapter: {
                        ...prevState.completed_chapter,
                        [chapterKey]: {
                            remaining: response.body.remaining,
                            highest_score: response.body.highest_score
                        }
                    }
                }));

                return true;
            }
            return false;
        } catch (error) {
            console.error("Error updating completed chapter:", error);
            return false;
        }
    }, []);
    
    const setChapterUnlocked = useCallback(async (chapterSequence: number): Promise<boolean> => {
        try {
            const token = await tokenStorage.getToken();
            if (!token) return false;

            const response = await asyncPut(user_level_api.unlocked_chapter, {
                headers: { 
                    Authorization: `Bearer ${token}` 
                },
                body: { 
                    chapter_sequence: chapterSequence
                },
            });

            if (response.status === 200) {
                await fetchUserLevelProgress();
                return true;
            }

            return false;
        } catch (error) {
            console.error("Error unlocking chapter:", error);
            return false;
        }
    }, [fetchUserLevelProgress]);

    const setChapterCompleted = useCallback(async (chapterSequence: number): Promise<boolean> => {
        try {
            const token = await tokenStorage.getToken();
            if (!token) return false;

            const response = await asyncPut(user_level_api.completed_chapter, {
                headers: { 
                    Authorization: `Bearer ${token}` 
                },
                body: { 
                    chapter_sequence: chapterSequence
                },
            });

            if (response.status === 200) {
                await fetchUserLevelProgress();
                return true;
            }

            return false;
        } catch (error) {
            console.error("Error setting chapter completed:", error);
            return false;
        }
    }, [fetchUserLevelProgress]);

    const refreshAll = useCallback(async () => {
        try {
            setLoading(true);
            
            await Promise.all([
                fetchChapters(),
                fetchUserLevelProgress()
            ]);
            
            setDataInitialized(true);
        } catch (error) {
            console.error('Error in refreshAll:', error);
        } finally {
            setLoading(false);
        }
    }, [fetchChapters, fetchUserLevelProgress]);

    const isChapterInDatabase = useCallback((sequence: number): boolean => {
        const chapterKey = sequence.toString();
        return chapterKey in (userLevelProgress.chapter_progress || {});
    }, [userLevelProgress.chapter_progress]);

    const isChapterUnlocked = useCallback((sequence: number): boolean => {
        const chapterKey = sequence.toString();
        const chapterProgress = userLevelProgress.chapter_progress?.[chapterKey];
        return chapterProgress?.unlocked || false;
    }, [userLevelProgress.chapter_progress]);

    const isChapterCompleted = useCallback((sequence: number): boolean => {
        const startLevel = (sequence - 1) * 5 + 1;
        const endLevel = sequence * 5;
        
        for (let levelId = startLevel; levelId <= endLevel; levelId++) {
            const progress = userLevelProgress.level_progress[levelId];
            if (!progress || progress.stars < 1) {
                return false;
            }
        }
        return true;
    }, [userLevelProgress.level_progress]);

    const isChapterAllThreeStars = useCallback((sequence: number, levelProgress?: any): boolean => {
        const progressToCheck = levelProgress || userLevelProgress.level_progress;
        const startLevel = (sequence - 1) * 5 + 1;
        const endLevel = sequence * 5;
        
        for (let levelId = startLevel; levelId <= endLevel; levelId++) {
            const progress = progressToCheck[levelId];
            if (!progress || progress.stars < 3) {
                return false;
            }
        }
        return true;
    }, [userLevelProgress.level_progress]);

    const canUnlockChapter = useCallback((sequence: number): boolean => {
        const chapter = chapters.find(c => c.sequence === sequence);
        if (!chapter) return false;

        if (!isChapterInDatabase(sequence)) return false;
        if (isChapterUnlocked(sequence)) return false;

        const requiredLevel = (sequence - 1) * 5;
        const hasEnoughLevel = userLevelProgress.highest_level >= requiredLevel;
        
        return hasEnoughLevel;
    }, [chapters, userLevelProgress.highest_level, isChapterInDatabase, isChapterUnlocked]);

    const getChaptersToRender = useCallback((allChapters?: Chapter[]): Chapter[] => {
        if (!dataInitialized) {
            return [];
        }
        
        const chaptersToUse = allChapters || chapters;
        if (chaptersToUse.length === 0) {
            return [];
        }
        
        const sorted = [...chaptersToUse].sort((a, b) => a.sequence - b.sequence);
        
        if (!userLevelProgress.chapter_progress || 
            Object.keys(userLevelProgress.chapter_progress).length === 0) {
            return [];
        }
        
        return sorted.filter(chapter => isChapterInDatabase(chapter.sequence));
    }, [chapters, isChapterInDatabase, dataInitialized, userLevelProgress.chapter_progress]);

    const getChapterBySequence = useCallback((sequence: number): Chapter | undefined => {
        return chapters.find(chapter => chapter.sequence === sequence);
    }, [chapters]);

    const getLevelProgress = useCallback((levelId: number): { stars: number; score: number } | null => {
        return userLevelProgress.level_progress[levelId] || null;
    }, [userLevelProgress.level_progress]);

    const getHighestLevel = useCallback((): number => {
        return userLevelProgress.highest_level;
    }, [userLevelProgress.highest_level]);

    const getRemainingTimes = useCallback((sequence: number): number | undefined => {
        const chapterKey = sequence.toString();
        const completedChapterData = userLevelProgress.completed_chapter?.[chapterKey];
        return completedChapterData?.remaining;
    }, [userLevelProgress.completed_chapter]);

    const getChallengeHighestScore = useCallback((sequence: number): number | undefined => {
        const chapterKey = sequence.toString();
        const completedChapterData = userLevelProgress.completed_chapter?.[chapterKey];
        return completedChapterData?.highest_score;
    }, [userLevelProgress.completed_chapter]);

     useEffect(() => {
        const initUserLevel = async () => {
            const token = await tokenStorage.getToken();
            if (token) {
                await refreshAll();
            } else {
                setLoading(false);
            }
        };
        
        initUserLevel();
    }, [refreshAll]);

    const value: UserLevelContextType = {
        chapters,
        userLevelProgress,
        loading,
        error,

        fetchChapters,
        fetchUserLevelProgress,
        updateLevelProgress,
        updateCompletedChapter,
        setChapterUnlocked,
        setChapterCompleted,
        refreshAll,

        isChapterCompleted,
        isChapterUnlocked,
        isChapterInDatabase,
        canUnlockChapter,
        getChaptersToRender,
        
        getChapterBySequence,
        getLevelProgress,
        getHighestLevel,
        getRemainingTimes,
        getChallengeHighestScore
    };

    return (
        <UserLevelContext.Provider value={value}>
            {children}
        </UserLevelContext.Provider>
    );
}

export function useUserLevel() {
    const context = useContext(UserLevelContext);
    if (context === undefined) {
        throw new Error('useUserLevel must be used within a UserLevelProvider');
    }
    return context;
}