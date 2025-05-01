export interface Chapter {
    _id: string;
    sequence: number;
    name: string;
    description: string;
    background_image: {
      public_id: string;
      url: string;
      thumbnail_url: string;
    };
    banner_image: {
      public_id: string;
      url: string;
      thumbnail_url: string;
    };
}