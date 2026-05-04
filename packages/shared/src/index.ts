export type PaymentMethod = "CARD" | "MOBILE_MONEY" | "CASH_ON_DELIVERY";

export type OrderStatus =
  | "PENDING_PAYMENT"
  | "PLACED"
  | "CONFIRMED"
  | "PACKED"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  description: string;
}

export interface CartLineInput {
  productId: string;
  quantity: number;
}
