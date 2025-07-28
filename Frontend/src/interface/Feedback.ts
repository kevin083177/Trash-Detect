import { Image } from "./Image";

type category = 'bug' | 'detect' | 'improvement' | 'other';
type status = 'pending' | 'processing' | 'resolved' | 'closed';

export const CATEGORIES = {
    'bug': '系統錯誤',
    'detect': '辨識錯誤',
    'improvement': '改進建議',
    'other': '其他'
};

export const STATUS_TYPES = {
    'pending': '待處理',
    'processing': '處理中', 
    'resolved': '已解決',
    'closed': '已關閉'
};

export interface Feedback {
    _id: string;
    user_id: string;
    admin_name?: string;
    category: category;
    status: status;
    title: string;
    content: string;
    reply_content?: string;
    images?: Image[];
    reply_at?: string;
    created_at: string;
}