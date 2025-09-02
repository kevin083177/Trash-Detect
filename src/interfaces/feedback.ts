import type { Image } from "./image";

type Category = 'bug' | 'detect' | 'improvement' | 'other';
type Status = 'pending' | 'processing' | 'resolved' | 'closed';

export interface Feedback {
    _id: string;
    admin_name?: string;
    user_id: string;
    user_info: {
        email: string;
        username: string;
    }
    category: Category;
    status: Status;
    title: string;
    content: string;
    images?: Image[];
    reply_at?: string;
    reply_content?: string;
    created_at: string;
}