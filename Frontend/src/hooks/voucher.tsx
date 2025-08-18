import { voucher_api } from "@/api/api";
import { Voucher, VoucherType } from "@/interface/Voucher";
import { asyncGet, asyncPost } from "@/utils/fetch";
import { tokenStorage } from "@/utils/tokenStorage";
import React, { createContext, ReactNode, useCallback, useContext, useState } from "react";

interface VoucherContextType {
    voucherTypes: VoucherType[];
    userVouchers: Voucher[];
    loading: boolean;
    redeeming: boolean;

    fetchVoucherTypes: () => Promise<void>;
    fetchUserVouchers: () => Promise<void>;
    redeem: (voucherTypeId: string, count?: number) => Promise<{ success: boolean; message: string }>;
    refreshAll: () => Promise<void>;
    
    hasEnoughMoney: (voucherPrice: number, userMoney: number) => boolean;
    canRedeem: (voucherType: VoucherType) => boolean;
}

const VoucherContext = createContext<VoucherContextType | undefined>(undefined);

interface VoucherProviderProps {
    children: ReactNode;
}

export function VoucherProvider({ children }: VoucherProviderProps) {
    const [voucherTypes, setVoucherTypes] = useState<VoucherType[]>([]);
    const [userVouchers, setUserVouchers] = useState<Voucher[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [redeeming, setRedeeming] = useState<boolean>(false);

    const fetchVoucherTypes = useCallback(async () => {
        const token = await tokenStorage.getToken();
        if (!token) return;

        try {
            setLoading(true);
            
            const response = await asyncGet(voucher_api.get_voucher, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            
            if (response && response.body) {
                setVoucherTypes(response.body);
            }
        } catch (error) {
            console.error("Error fetching voucher types:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchUserVouchers = useCallback(async () => {
        const token = await tokenStorage.getToken();
        if (!token) return;

        try {
            const response = await asyncGet(voucher_api.get_user_redeem, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            
            if (response && response.body) {
                setUserVouchers(response.body);
            }
        } catch (error) {
            console.error("Error fetching user vouchers:", error);
        }
    }, []);

    const redeem = useCallback(async (voucherTypeId: string, count: number = 1): Promise<{ success: boolean; message: string }> => {
        const token = await tokenStorage.getToken();
        if (!token) return { success: false, message: "請先登入" };

        try {
            setRedeeming(true);
            
            const response = await asyncPost(voucher_api.redeem, {
                headers: {
                    "Authorization": `Bearer ${token}`
                },
                body: {
                    voucher_type_id: voucherTypeId,
                    count: count
                }
            });

            if (response.status === 200) {
                await Promise.all([fetchVoucherTypes()]);
                
                return { 
                    success: true, 
                    message: response.message 
                };
            } else {
                return { 
                    success: false, 
                    message: response.message
                };
            }
        } catch (error: any) {
            console.error("Error redeeming voucher:", error);
            return { 
                success: false, 
                message: error.message || "兌換失敗，請檢查網路連接" 
            };
        } finally {
            setRedeeming(false);
        }
    }, [fetchVoucherTypes, fetchUserVouchers]);

    const refreshAll = useCallback(async () => {
        await Promise.all([
            fetchVoucherTypes(),
            fetchUserVouchers()
        ]);
    }, [fetchVoucherTypes, fetchUserVouchers]);

    const hasEnoughMoney = useCallback((voucherPrice: number, userMoney: number) => {
        return userMoney >= voucherPrice;
    }, []);

    const canRedeem = useCallback((voucherType: VoucherType) => {
        return voucherType.quantity > 0;
    }, []);

    const value: VoucherContextType = {
        voucherTypes,
        userVouchers,
        loading,
        redeeming,
        
        fetchVoucherTypes,
        fetchUserVouchers,
        redeem,
        refreshAll,
        
        hasEnoughMoney,
        canRedeem,
    };

    return (
        <VoucherContext.Provider value={value}>
            {children}
        </VoucherContext.Provider>
    );
}

export function useVoucher() {
    const context = useContext(VoucherContext);

    if (context === undefined) {
        throw new Error('useVoucher must be used within a VoucherProvider');
    }

    return context;
}