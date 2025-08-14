import { RecycleType } from "./Recycle";

export interface Question {
  id: string;
  content: string; // 問題內容
  category: RecycleType;
  options: Array<{
    id: string; // 選項 ID (A, B, C, D)
    text: string; // 選項內容
  }>;
  correctOptionIndex: number; // 正確答案的索引 (0-3)
}

interface CategoryStats { // 定義 QuestionStats 中需要的內容
  total: number;
  correct: number;
  accuracy?: number;
}

export type QuestionStats = {
  [K in RecycleType]: CategoryStats;
};