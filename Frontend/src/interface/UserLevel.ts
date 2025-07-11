export interface UserLevel {
  chapter_progress: { [key: string]: any };
  highest_level: number;
  level_progress: { [key: string]: LevelProgress };
}

export interface LevelProgress {
    score: number;
    stars: number;
}