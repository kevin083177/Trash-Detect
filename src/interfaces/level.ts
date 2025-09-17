export interface Level {
  _id: string;
  chapter: string;
  description: string | null;
  name: string;
  sequence: number;
  unlock_requirement: number;
}