import { user_api } from "@/api/api";
import { QuestionStats } from "@/interface/Question";
import { RecycleType, RecycleValues } from "@/interface/Recycle";
import { User } from "@/interface/User";
import { asyncGet, asyncPost, asyncPut } from "@/utils/fetch";
import { tokenStorage } from "@/utils/tokenStorage";
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";

interface UserContextType {
    user: User | null;
    loading: boolean;

    fetchUserProfile: () => Promise<User | null>;
    updateUsername: (username: string) => Promise<{ success: boolean; message: string }>;
    updatePassword: (oldPassword: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
    updateEmail: (email: string) => Promise<{ success: boolean; message: string; }>;
    updateProfile: (imageUri: string) => Promise<{ success: boolean; message: string }>;
    clearUser: () => void;
    refreshUserData: () => Promise<void>;

    addMoney: (amount: number) => Promise<void>;
    subtractMoney: (amount: number) => Promise<void>;
    
    dailyCheckIn: () => Promise<{ success: boolean; message: string; alreadyCheckedIn?: boolean }>;
    checkDailyCheckInStatus: () => Promise<{ hasCheckedIn: boolean }>;

    addTrashStat: (type: keyof RecycleValues) => Promise<number>;
    getTotalTrash: () => number;
    
    updateQuestionStats: (category: RecycleType, total: number, correct: number) => Promise<boolean>;
    getQuestionStats: () => Promise<{ success: boolean; data?: QuestionStats; message: string}>;

    getUsername: () => string;
    getMoney: () => number;
    getTrashStats: () => RecycleValues;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
    children: ReactNode
}

export function UserProvider({ children }: UserProviderProps) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    const fetchUserProfile = useCallback(async (): Promise<User | null> => {
        try {
            setLoading(true);
            const token = await tokenStorage.getToken();
            if (!token) {
                setUser(null);
                return null;
            }

            const response = await asyncGet(user_api.get_user, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            if (response && response.body) {
                const userData: User = {
                    _id: response.body._id,
                    username: response.body.username,
                    email: response.body.email,
                    money: response.body.money || 0,
                    profile: response.body.profile || null,
                    role: response.body.userRole,
                    trash_stats: response.body.trash_stats,
                    checkInDate: response.body.checkInDate
                }

                setUser(userData);
                return userData;
            } else {
                setUser(null);
                return null;
            }
        } catch (error) {
            console.log("Failed to fetch user profile: ", error);
            setUser(null);
            return null;
        } finally {
            setLoading(false);
        }
    }, [])

    const updateUsername = useCallback(async (username: string): Promise<{ success: boolean; message: string }> => {
        try {
            const token = await tokenStorage.getToken();
            if (!token) {
                return { success: false, message: '未登入' };
            }

            if (!username.trim()) {
                return { success: false, message: '請輸入新的使用者名稱' };
            }

            if (username.length < 6 || username.length > 12) {
                return { success: false, message: '使用者名稱必須介於6至12字元' };
            }

            if (username === user?.username) {
                return { success: false, message: '新使用者名稱不能與當前相同' };
            }

            const response = await asyncPut(user_api.update_username, {
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: { username }
            });

            if (response.status === 200) {
                setUser(prevUser => {
                    if (!prevUser) return null;
                    return { ...prevUser, username };
                });
                return { success: true, message: '使用者名稱更新成功！' };
            } else {
                return { success: false, message: response.message };
            }
        } catch (error) {
            console.error('Failed to update username:', error);
            return { success: false, message: '網路錯誤，請稍後再試' };
        }
    }, [user]);

    const updatePassword = useCallback(async (oldPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
        try {
            const token = await tokenStorage.getToken();
            if (!token) {
                return { success: false, message: '未登入' };
            }

            if (!oldPassword || !newPassword) {
                return { success: false, message: '請填寫所有密碼欄位' };
            }

            if (newPassword.length < 6) {
                return { success: false, message: '新密碼長度至少需要6個字元' };
            }

            if (oldPassword === newPassword) {
                return { success: false, message: '新密碼不能與舊密碼相同' };
            }

            const response = await asyncPut(user_api.update_password, {
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: {
                    old_password: oldPassword,
                    new_password: newPassword
                }
            });

            if (response.status === 200) {
                return { success: true, message: '密碼更新成功！' };
            } else {
                return { success: false, message: response.message || '更新失敗' };
            }
        } catch (error) {
            console.error('Failed to update password:', error);
            return { success: false, message: '網路錯誤，請稍後再試' };
        }
    }, []);

    const updateEmail = useCallback(async (email: string): Promise<{ success: boolean; message: string; requiresVerification?: boolean }> => {
        try {
            const token = await tokenStorage.getToken();
            if (!token) {
                return { success: false, message: '未登入' };
            }

            if (!email.trim()) {
                return { success: false, message: '請輸入新的電子郵件' };
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return { success: false, message: '請輸入有效的電子郵件地址' };
            }

            if (email === user?.email) {
                return { success: false, message: '新電子郵件不能與當前相同' };
            }

            const response = await asyncPut(user_api.update_email, {
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: { email }
            });

            if (response.status === 200) {
                if (response.message) {
                    return { 
                        success: true, 
                        message: '請檢查新郵件地址中的驗證碼', 
                        requiresVerification: true 
                    };
                } else {
                    setUser(prevUser => {
                        if (!prevUser) return null;
                        return { ...prevUser, email };
                    });
                    return { success: true, message: '電子郵件更新成功！' };
                }
            } else {
                return { success: false, message: response.message || '更新失敗' };
            }
        } catch (error) {
            console.error('Failed to update email:', error);
            return { success: false, message: '網路錯誤，請稍後再試' };
        }
    }, [user]);

    const updateProfile = useCallback(async (imageUri: string): Promise<{ success: boolean; message: string }> => {
        try {
            const token = await tokenStorage.getToken();
            if (!token) {
                return { success: false, message: '未登入' };
            }

            const formData = new FormData();
            const filename = imageUri.split('/').pop() || 'profile.jpg';
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : 'image/jpeg';

            formData.append('image', {
                uri: imageUri,
                name: filename,
                type: type,
            } as any);

            const response = await asyncPut(user_api.update_profile, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data',
                },
                body: formData,
            });
            
            if (response && response.body) {
                console.log(response.body)
                setUser(prevUser => {
                    if (!prevUser) return null;
                    return { 
                        ...prevUser, 
                        profile: response.body.profile 
                    };
                });

                return { success: true, message: '頭像更新成功！' };
            } else {
                return { success: false, message: response.message };
            }
        } catch (error) {
            console.error('Failed to update profile:', error);
            return { success: false, message: '網路錯誤，請稍後再試' };
        }
    }, []);

    // logout
    const clearUser = useCallback(() => {
        setUser(null);
    }, []);

    const refreshUserData = useCallback(async () => {
        await fetchUserProfile();
    }, [fetchUserProfile]);

    const addMoney = useCallback(async (amount: number) => {
        try {
            const token = tokenStorage.getToken();
            if (!token) return;

            const response = await asyncPost(user_api.add_money, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }, 
                body: { amount }
            })

            if (response.status === 200) {
                setUser(prevUser => {
                    if (!prevUser) return null;
                    return { ...prevUser, money: (prevUser.money ?? 0) + amount};
                });
            }
        } catch (error) {
            console.log("Failed to add money: ", error);
        }
    }, [])

    const subtractMoney = useCallback(async (amount: number) => {
        try {
            const token = await tokenStorage.getToken();
            if (!token) return;

            const response = await asyncPost(user_api.subtract_money, {
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: { amount }
            });

            if (response.status === 200) {
                setUser(prevUser => {
                    if (!prevUser) return null;
                    const newMoney = Math.max(0, prevUser.money ?? 0 - amount);
                    return { ...prevUser, money: newMoney };
                });
            }
        } catch (error) {
            console.error('Failed to subtract money:', error);
        }
    }, []);

    const getTotalTrash = useCallback((): number => {
        if (!user) return 0;
        const { bottles = 0, cans = 0, containers = 0, paper = 0, plastic = 0 } = user.trash_stats || {};
        return bottles + cans + containers + paper + plastic;
    }, [user]);

    const addTrashStat = useCallback(async (type: keyof RecycleValues): Promise<number> => {
        try {
            const token = await tokenStorage.getToken();
            if (!token) return getTotalTrash();

            const trashMap: Record<keyof RecycleValues, string> = {
                bottles: 'bottles',
                cans: 'cans', 
                containers: 'containers',
                paper: 'paper',
                plastic: 'plastic'
            };

            const response = await asyncPost(user_api.add_trash_stats, {
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: {
                    trash_type: trashMap[type],
                    count: 1
                }
            });

            if (response.status === 200) {
                let newTotalTrash = 0;
                
                setUser(prevUser => {
                    if (!prevUser) return null;

                    const stats = prevUser.trash_stats || {
                        paper: 0,
                        plastic: 0,
                        containers: 0,
                        bottles: 0,
                        cans: 0
                    };

                    const newStats = {
                        ...stats,
                        [type]: (stats[type] ?? 0) + 1
                    };

                    newTotalTrash = Object.values(newStats).reduce((sum, count) => sum + count, 0);

                    return {
                        ...prevUser,
                        trash_stats: newStats
                    };
                });

                return newTotalTrash;
            } else {
                return getTotalTrash();
            }
        } catch (error) {
            console.error('Failed to add trash stat:', error);
            return getTotalTrash();
        }
    }, [getTotalTrash]);

    const dailyCheckIn = useCallback(async (): Promise<{ success: boolean; message: string; alreadyCheckedIn?: boolean }> => {
        try {
            const token = await tokenStorage.getToken();
            if (!token) {
                return { success: false, message: '未登入' };
            }

            const response = await asyncPost(user_api.daily_check_in, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            switch (response.status) {
                case 200:
                    await fetchUserProfile();
                    return { success: true, message: '簽到成功！' };
                case 400:
                    return { success: false, message: '今天已經簽到過了！', alreadyCheckedIn: true };
                case 500:
                    return { success: false, message: '伺服器異常，請稍後再試' };
                default:
                    return { success: false, message: '未知錯誤，請稍後再試' };
            }
        } catch (error) {
            console.error('Failed to daily check-in:', error);
            return { success: false, message: '簽到失敗，請檢查網路連線' };
        }
    }, [])

    const checkDailyCheckInStatus = useCallback(async (): Promise<{ hasCheckedIn: boolean }> => {
        try {
            const token = await tokenStorage.getToken();
            if (!token) {
                return { hasCheckedIn: false };
            }

            const response = await asyncGet(user_api.daily_check_in_status, {
                headers: {
                'Authorization': `Bearer ${token}`
                }
            });

            return {
                hasCheckedIn: response.body?.hasCheckedIn || false
            };
        } catch (error) {
            console.error('Failed to get check-in status:', error);
            return { hasCheckedIn: false };
        }
    }, []);

    const getQuestionStats = useCallback(async (): Promise<{ success: boolean; data?: QuestionStats; message: string }> => {
        try {
            const token = await tokenStorage.getToken();
            if (!token) return { success: false, message: "未登入" }

            const response = await asyncGet(user_api.get_question_stats, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response && response.body) {
                return { 
                    success: true,
                    message: "成功獲取答題統計", 
                    data: response.body
                }
            }
            else {
                return {
                    success: false,
                    message: response.message
                }
            }
        } catch (error) {
            console.error('Failed to get question stats:', error);
            return {
                success: false,
                message: "網路錯誤，請稍後再試"
            }
        }
    }, [])

    const updateQuestionStats = useCallback(async (category: RecycleType, total: number, correct: number): Promise<boolean> => {
        try {
            const token = await tokenStorage.getToken();
            if (!token) return false;

            const response = await asyncPut(user_api.update_question_stats, {
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: {
                    category: category,
                    total: total,
                    correct: correct
                }
            });
            return (!response.body);
        } catch (error) {
            console.error('Failed to update question stats:', error);
            return false;
        }
    }, [])

    const getUsername = useCallback((): string => {
        return user?.username || '';
    }, [user]);
    
    const getMoney = useCallback((): number => {
        return user?.money || 0;
    }, [user]);

    const getTrashStats = useCallback((): RecycleValues => {
        return user?.trash_stats || {
            bottles: 0,
            cans: 0,
            containers: 0,
            paper: 0,
            plastic: 0
        };
    }, [user]);

    useEffect(() => {
        const initUser = async () => {
            const token = await tokenStorage.getToken();
            if (token) {
                await fetchUserProfile();
            }
        };
        
        initUser();
    }, [fetchUserProfile]);

    const value: UserContextType = {
    user,
    loading,
    
    fetchUserProfile,
    clearUser,
    refreshUserData,
    updateUsername,
    updateEmail,
    updatePassword,
    updateProfile,
    
    addMoney,
    subtractMoney,
    
    dailyCheckIn,
    checkDailyCheckInStatus,
    
    getTotalTrash,
    getTrashStats,
    addTrashStat,

    getQuestionStats,
    updateQuestionStats,

    getUsername,
    getMoney,
  };

  return (
        <UserContext.Provider value={value}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
}