import type { Image } from "./image";

export interface StationType {
  _id: string;
  name: string;
  description: string;
  image: Image;
}

export interface Station {
  _id: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  distance?: number;
  station_type: StationType;
  category: string[];
}

export const RECYCLABLE_CATEGORIES = [
  { label: '紙類', value: 'paper' },
  { label: '紙容器', value: 'containers' },
  { label: '塑膠', value: 'plastic' },
  { label: '寶特瓶', value: 'bottles' },
  { label: '鐵鋁罐', value: 'cans' },
  { label: '電池', value: 'battery' }
];