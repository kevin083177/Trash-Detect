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
    updateLevelProgress: (levelId: number, score: number, stars: number) => Promise<boolean>;
    refreshAll: () => Promise<void>;

    isChapterCompleted: (sequence: number) => boolean;
    isChapterUnlocked: (sequence: number) => boolean;
    getChaptersToRender: (allChapters?: Chapter[]) => Chapter[];
    
    getChapterBySequence: (sequence: number) => Chapter | undefined;
    getLevelProgress: (levelId: number) => { stars: number; score: number } | null;
    getHighestLevel: () => number;
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
        level_progress: {}
    });
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

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

    const updateLevelProgress = useCallback(async (levelId: number, score: number, stars: number): Promise<boolean> => {
        try {
            const token = await tokenStorage.getToken();
            if (!token) false;

            const response = await asyncPut(user_level_api.update_level, {
                headers: { 
                    Authorization: `Bearer ${token}` 
                },
                body: { 
                    sequence: levelId, 
                    score, 
                    stars 
                },
            });

            if (response.status === 200) {
                setUserLevelProgress(prev => ({
                    ...prev,
                    level_progress: {
                        ...prev.level_progress,
                        [levelId]: { stars, score }
                    },
                    highest_level: Math.max(prev.highest_level, levelId)
                }));
                return true;
            }

            return false;
        } catch (error) {
            console.error("Error updating level progress:", error);
            return false;
        }
    }, []);

    const refreshAll = useCallback(async () => {
        await Promise.all([
            fetchChapters(),
            fetchUserLevelProgress()
        ]);
    }, [fetchChapters, fetchUserLevelProgress]);

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

    const isChapterUnlocked = useCallback((sequence: number): boolean => {
        if (sequence === 1) return true;
        return isChapterCompleted(sequence - 1);
    }, [isChapterCompleted]);

    const getChaptersToRender = useCallback((allChapters?: Chapter[]): Chapter[] => {
        const chaptersToUse = allChapters || chapters;
        const sorted = [...chaptersToUse].sort((a, b) => a.sequence - b.sequence);
        const result: Chapter[] = [];
        
        for (let chapter of sorted) {
            result.push(chapter);
            if (!isChapterUnlocked(chapter.sequence)) {
                break;
            }
        }
        return result;
    }, [chapters, isChapterUnlocked]);

    const getChapterBySequence = useCallback((sequence: number): Chapter | undefined => {
        return chapters.find(chapter => chapter.sequence === sequence);
    }, [chapters]);

    const getLevelProgress = useCallback((levelId: number): { stars: number; score: number } | null => {
        return userLevelProgress.level_progress[levelId] || null;
    }, [userLevelProgress.level_progress]);

    const getHighestLevel = useCallback((): number => {
        return userLevelProgress.highest_level;
    }, [userLevelProgress.highest_level]);

     useEffect(() => {
        const initUserLevel = async () => {
            const token = await tokenStorage.getToken();
            if (token) {
                await refreshAll();
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
        refreshAll,

        isChapterCompleted,
        isChapterUnlocked,
        getChaptersToRender,
        
        getChapterBySequence,
        getLevelProgress,
        getHighestLevel,
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