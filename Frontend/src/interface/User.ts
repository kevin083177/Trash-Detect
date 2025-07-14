import { RecycleValues } from "./Recycle";

export interface User {
  _id: string;
  username: string;
  password?: string;
  email: string;
  role?: 'user' | 'admin';
  money?: number;
  trash_stats?: RecycleValues;
  token?: string;
  checkInDate?: string;
}