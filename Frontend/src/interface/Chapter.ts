export interface Chapter {
    _id: string;
    sequence: number;
    name: string;
    trash_requirement: number;
    image: {
      public_id: string;
      url: string;
    };
    levels: string[];
}