import { makeRequest } from "@/utils";
import { describe, expect, test, beforeEach } from "bun:test";

describe("Cart API", () => {
  let productId: string;

  beforeEach(async () => {
    // Create a test product and store its ID
    const createRes = await makeRequest("/products", {
      method: "POST",
      body: JSON.stringify({
        name: "Cart Test Product",
        description: "Test Description",
        price: 99.99,
        stock: 10,
      }),
    });
    const product = await createRes.json();
    productId = product.id;

    // Clear cart before each test
    await makeRequest("/cart", { method: "DELETE" });
  });

  test("should start with empty cart", async () => {
    const res = await makeRequest("/cart");
    expect(res.status).toBe(200);

    const cart = await res.json();
    expect(Array.isArray(cart)).toBe(true);
    expect(cart.length).toBe(0);
  });

  test("should add item to cart", async () => {
    const cartItem = {
      productId,
      quantity: 2,
    };

    const res = await makeRequest("/cart", {
      method: "POST",
      body: JSON.stringify(cartItem),
    });
    expect(res.status).toBe(200);

    const cart = await res.json();
    expect(cart.length).toBe(1);
    expect(cart[0].productId).toBe(productId);
    expect(cart[0].quantity).toBe(2);
  });

  test("should clear cart", async () => {
    // First add an item
    await makeRequest("/cart", {
      method: "POST",
      body: JSON.stringify({
        productId,
        quantity: 1,
      }),
    });

    // Then clear the cart
    const res = await makeRequest("/cart", {
      method: "DELETE",
    });
    expect(res.status).toBe(200);

    // Verify cart is empty
    const getRes = await makeRequest("/cart");
    const cart = await getRes.json();
    expect(cart.length).toBe(0);
  });
});
