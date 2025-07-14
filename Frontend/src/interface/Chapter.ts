import { Image } from "./Image";

export interface Chapter {
    _id: string;
    sequence: number;
    name: string;
    trash_requirement: number;
    image: Image;
    levels: string[];
}