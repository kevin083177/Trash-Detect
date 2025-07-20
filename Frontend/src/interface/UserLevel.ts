export interface UserLevel {
  chapter_progress: { [key: string]: any };
  highest_level: number;
  level_progress: { [key: string]: LevelProgress };
  completed_chapter: { [key: string]: CompletedChatper }
}

export interface LevelProgress {
    score: number;
    stars: number;
}

export interface CompletedChatper {
  remaining: number;
  highest_score: number;
}