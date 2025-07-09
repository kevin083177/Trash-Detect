import { type Image } from "./image";

export interface Chapter {
    name: string;
    sequence: number;
    trash_requirement: number;
    image: Image;
}