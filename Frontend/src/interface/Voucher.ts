import { Image } from "./Image";

export interface Voucher {
    _id: string;
    voucher_code: string;
    voucher_type_id: string;
    status: "active" | "expired" | "used";
    issued_at: string;
    expires_at: string;
    voucher_type: VoucherType;
}

export interface VoucherType {
    _id: string;
    name: string;
    description: string;
    quantity: number;
    price: number;
    image: Image;
}