import { describe, expect, test } from "bun:test";
import app from ".";
import { makeRequest } from "@/utils";
import { BASE_URL } from "./config/constants";

describe("HonoMart API", () => {
  describe("Health Check", () => {
    test("should return healthy status", async () => {
      const res = await makeRequest("/");
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.status).toBe("healthy");
      expect(data.timestamp).toBeDefined();
    });
  });

  describe("Error Handling", () => {
    test("should require user ID header", async () => {
      const res = await app.fetch(
        new Request(`${BASE_URL}/cart`, {
          headers: { "Content-Type": "application/json" },
        }),
      );
      expect(res.status).toBe(400);

      const data = await res.json();
      expect(data.message).toBe("User ID required");
    });

    test("should handle non-existent product", async () => {
      const res = await makeRequest("/products/non-existent-id");
      expect(res.status).toBe(404);

      const data = await res.json();
      expect(data.message).toBe("Product not found");
    });

    test("should handle non-existent order", async () => {
      const res = await makeRequest("/orders/non-existent-id");
      expect(res.status).toBe(404);

      const data = await res.json();
      expect(data.message).toBe("Order not found");
    });
  });
});
