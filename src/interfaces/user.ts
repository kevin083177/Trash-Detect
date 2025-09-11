import type { Trash } from "./Trash";
import type { Image } from "./image";
import type { QuestionStats } from "./question";

export interface User {
  _id: string;
  username: string;
  money: number;
  highest_level: number;
  last_check_in: string | null;
  last_active: string | null;
  consecutive_check_in_days: number;
  trash_stats: Trash;
  question_stats: {[K in keyof Trash]: QuestionStats};
  profile: Image | null;
}