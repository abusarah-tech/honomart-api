import { products } from "@/config/constants";
import type { Product } from "@/types";
import { Hono } from "hono";

const app = new Hono()
	.get("/", async (c) => {
		return c.json(products);
	})
	.post(async (c) => {
		const body = await c.req.json<Omit<Product, "id">>();
		const newProduct: Product = {
			id: Math.random().toString(36).substring(2, 9),
			...body,
		};
		products.push(newProduct);
		return c.json(newProduct, 201);
	})
	.get("/:id", (c) => {
		const id = c.req.param("id");
		const product = products.find((p) => p.id === id);
		if (!product) {
			return c.json({ message: "Product not found" }, 404);
		}
		return c.json(product);
	})
	.put(async (c) => {
		const id = c.req.param("id");
		const body = await c.req.json<Partial<Product>>();
		const index = products.findIndex((p) => p.id === id);
		if (index === -1) {
			return c.json({ message: "Product not found" }, 404);
		}
		products[index] = { ...products[index], ...body };
		return c.json(products[index]);
	})
	.delete(async (c) => {
		const id = c.req.param("id");
		const index = products.findIndex((p) => p.id === id);
		if (index === -1) {
			return c.json({ message: "Product not found" }, 404);
		}
		products.splice(index, 1);
		return c.json({ message: "Product deleted" });
	});

export default app;
