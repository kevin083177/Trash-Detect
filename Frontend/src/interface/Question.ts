export interface Question {
    id: string;
    content: string; // 問題內容
    category: string; // 類別（紙張、鐵鋁罐等）
    options: Array<{
      id: string; // 選項 ID (A, B, C, D)
      text: string; // 選項內容
    }>;
    correctOptionIndex: number; // 正確答案的索引 (0-3)
  }