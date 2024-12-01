import { TEST_USER_ID } from "@/config/constants";
import { makeRequest } from "@/utils";
import { describe, expect, test, beforeEach } from "bun:test";

describe("Orders API", () => {
  let productId: string;

  beforeEach(async () => {
    // Create a test product
    const createRes = await makeRequest("/products", {
      method: "POST",
      body: JSON.stringify({
        name: "Order Test Product",
        description: "Test Description",
        category: "Electronics",
        price: "99.99",
        stock: 10,
      }),
    });
    const product = await createRes.json();
    productId = product.id;

    // Clear cart
    await makeRequest("/carts", { method: "DELETE" });
  });

  test("should not create order with empty cart", async () => {
    const res = await makeRequest("/orders", {
      method: "POST",
    });
    expect(res.status).toBe(400);
  });

  test("should create new order", async () => {
    // Add item to cart
    await makeRequest("/carts", {
      method: "POST",
      body: JSON.stringify({
        productId,
        quantity: 2,
      }),
    });

    // Create order
    const res = await makeRequest("/orders", {
      method: "POST",
    });
    expect(res.status).toBe(201);

    const order = await res.json();
    expect(order.id).toBeDefined();
    expect(order.userId).toBe(TEST_USER_ID);
    expect(order.items.length).toBe(1);
    expect(order.status).toBe("pending");
    expect(order.totalAmount).toBe(199.98); // 99.99 * 2
  });

  test("should list user orders", async () => {
    // First create an order
    await makeRequest("/carts", {
      method: "POST",
      body: JSON.stringify({
        productId,
        quantity: 1,
      }),
    });
    await makeRequest("/orders", { method: "POST" });

    // Then list orders
    const res = await makeRequest("/orders");
    expect(res.status).toBe(200);

    const orders = await res.json();
    expect(Array.isArray(orders)).toBe(true);
    expect(orders.length).toBeGreaterThan(0);
    expect(orders[0].userId).toBe(TEST_USER_ID);
  });

  test("should get order by ID", async () => {
    // First create an order
    await makeRequest("/carts", {
      method: "POST",
      body: JSON.stringify({
        productId,
        quantity: 1,
      }),
    });
    const createRes = await makeRequest("/orders", { method: "POST" });
    const newOrder = await createRes.json();

    // Then fetch it by ID
    const res = await makeRequest(`/orders/${newOrder.id}`);
    expect(res.status).toBe(200);

    const order = await res.json();
    expect(order.id).toBe(newOrder.id);
    expect(order.userId).toBe(TEST_USER_ID);
  });

  test("should update order status", async () => {
    // First create an order
    await makeRequest("/carts", {
      method: "POST",
      body: JSON.stringify({
        productId,
        quantity: 1,
      }),
    });
    const createRes = await makeRequest("/orders", { method: "POST" });
    const newOrder = await createRes.json();

    // Then update its status
    const res = await makeRequest(`/orders/${newOrder.id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: "shipped" }),
    });
    expect(res.status).toBe(200);

    const order = await res.json();
    expect(order.id).toBe(newOrder.id);
    expect(order.status).toBe("shipped");
  });
});
