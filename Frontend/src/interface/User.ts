import { RecycleValues } from "./Recycle";
import { Image } from "./Image";

export interface User {
  _id: string;
  username: string;
  password?: string;
  email: string;
  profile?: Image;
  role?: 'user' | 'admin';
  money?: number;
  trash_stats?: RecycleValues;
  token?: string;
  checkInDate?: string;
}