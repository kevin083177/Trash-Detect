export interface Question {
    _id: string;
    category: string;
    content: string;
    correct_answer: string;
    options: Option[];
};

interface Option {
    id: string;
    text: string;
};

// 臨時儲存
export interface TempQuestion extends Question {
  isTemporary?: boolean;
  tempId?: string;
}