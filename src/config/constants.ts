import type { CartItem, Order, Product } from "@/types";

export const carts: Map<string, CartItem[]> = new Map();
export const orders: Order[] = [];

export const BASE_URL = "http://localhost";
export const TEST_USER_ID = "test-user-123";
