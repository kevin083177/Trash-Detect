import { type Image } from "./image";

export interface Chapter {
    _id: string;
    name: string;
    sequence?: number;
    trash_requirement: number;
    image: Image;
}