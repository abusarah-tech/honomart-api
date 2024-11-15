export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
};

export type CartItem = {
  productId: string;
  quantity: number;
};

export type Order = {
  id: string;
  userId: string;
  items: CartItem[];
  totalAmount: number;
  status: "pending" | "confirmed" | "shipped" | "delivered";
  createdAt: string;
};
