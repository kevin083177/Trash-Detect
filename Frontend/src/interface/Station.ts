import { RecycleType } from "./Recycle";
import { Image } from "./Image";

interface StationType {
  name: string;
  description: string;
  image: Image;
}

export interface Station {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  distance?: number;
  type: StationType;
  categories: RecycleType[];
}

export interface UserLocation {
  latitude: number;
  longitude: number;
}