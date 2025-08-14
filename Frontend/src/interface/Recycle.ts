export type RecycleType = 'paper' | 'plastic' | 'containers' | 'bottles' | 'cans';
export type RecycleRequirement = Partial<Record<RecycleType, number>>;

export type RecycleTipsType = {
  containers: string[];
  cans: string[];
  bottles: string[];
  paper: string[];
  plastic: string[];
};

export interface RecycleValues {
  paper: number;
  plastic: number;
  containers: number;
  bottles: number;
  cans: number;
}

export const RECYCLE_TYPE_LABELS: Record<RecycleType, string> = {
  paper: '紙張',
  plastic: '塑膠',
  containers: '紙容器',
  bottles: '寶特瓶',
  cans: '鐵鋁罐',
};

export function convertRecycleType(chinese: string): RecycleType {
  const mapping: Record<string, RecycleType> = {
    '紙張': 'paper',
    '塑膠': 'plastic',
    '紙容器': 'containers',
    '寶特瓶': 'bottles',
    '鐵鋁罐': 'cans',
  };

  return mapping[chinese];
}