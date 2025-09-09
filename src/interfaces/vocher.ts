import type { Image } from "./image";

export interface Voucher {
  _id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  image: Image;
}

export interface VoucherFormData {
  name: string;
  description: string;
  price: number;
  quantity: number;
  image: string;
}