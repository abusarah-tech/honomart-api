import type { CartItem, Order, Product } from "@/types";

export const products: Product[] = [
  {
    id: "1",
    name: "Smartphone",
    description: "Latest model smartphone",
    price: 999.99,
    stock: 50,
  },
  {
    id: "2",
    name: "Laptop",
    description: "High-performance laptop",
    price: 1499.99,
    stock: 30,
  },
];

export const carts: Map<string, CartItem[]> = new Map();
export const orders: Order[] = [];

export const BASE_URL = "http://localhost";
export const TEST_USER_ID = "test-user-123";
