import { carts, products } from "@/config/constants";
import type { CartItem } from "@/types";
import { Hono } from "hono";

const app = new Hono()
	.get("/", async (c) => {
		const userId = c.req.header("X-User-ID");
		if (!userId) {
			return c.json({ message: "User ID required" }, 400);
		}
		return c.json(carts.get(userId) || []);
	})
	.post(async (c) => {
		const userId = c.req.header("X-User-ID");
		if (!userId) {
			return c.json({ message: "User ID required" }, 400);
		}

		const body = await c.req.json<CartItem>();
		const product = products.find((p) => p.id === body.productId);
		if (!product) {
			return c.json({ message: "Product not found" }, 404);
		}

		const userCart = carts.get(userId) || [];
		const existingItem = userCart.find(
			(item) => item.productId === body.productId,
		);

		if (existingItem) {
			existingItem.quantity += body.quantity;
		} else {
			userCart.push(body);
		}

		carts.set(userId, userCart);
		return c.json(userCart);
	})
	.delete((c) => {
		const userId = c.req.header("X-User-ID");
		if (!userId) {
			return c.json({ message: "User ID required" }, 400);
		}
		carts.delete(userId);
		return c.json({ message: "Cart cleared" });
	});

export default app;
