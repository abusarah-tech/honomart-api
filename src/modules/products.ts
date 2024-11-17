import { products } from "@/config/constants";
import type { Product, Variables } from "@/types";
import { Hono } from "hono";

const app = new Hono<{ Variables: Variables }>()
  .get("/", async (c) => {
    const log = c.get("logger");

    log.debug({ msg: "Fetching all products" });
    try {
      log.info({
        msg: "Successfully retrieved all products",
        count: products.length,
      });
      return c.json(products);
    } catch (error) {
      log.error({ msg: "Failed to fetch products", error });
      return c.json({ message: "Internal server error" }, 500);
    }
  })

  .post(async (c) => {
    const log = c.get("logger");

    try {
      const body = await c.req.json<Omit<Product, "id">>();
      log.debug({ msg: "Creating new product", body });

      const newProduct: Product = {
        id: Math.random().toString(36).substring(2, 9),
        ...body,
      };
      products.push(newProduct);

      log.info({
        msg: "Product created successfully",
        productId: newProduct.id,
      });
      return c.json(newProduct, 201);
    } catch (error) {
      log.error({ msg: "Failed to create product", error });
      return c.json({ message: "Invalid request body" }, 400);
    }
  })

  .get("/:id", (c) => {
    const log = c.get("logger");
    const id = c.req.param("id");

    log.debug({ msg: "Fetching product by id", productId: id });

    const product = products.find((p) => p.id === id);
    if (!product) {
      log.warn({ msg: "Product not found", productId: id });
      return c.json({ message: "Product not found" }, 404);
    }

    log.info({ msg: "Product retrieved successfully", productId: id });
    return c.json(product);
  })

  .put(async (c) => {
    const log = c.get("logger");
    const id = c.req.param("id");

    try {
      log.debug({ msg: "Updating product", productId: id });
      const body = await c.req.json<Partial<Product>>();

      const index = products.findIndex((p) => p.id === id);
      if (index === -1) {
        log.warn({ msg: "Product not found for update", productId: id });
        return c.json({ message: "Product not found" }, 404);
      }

      const updatedProduct = { ...products[index], ...body };
      products[index] = updatedProduct;

      log.info({
        msg: "Product updated successfully",
        productId: id,
        updates: Object.keys(body),
      });
      return c.json(updatedProduct);
    } catch (error) {
      log.error({ msg: "Failed to update product", productId: id, error });
      return c.json({ message: "Invalid request body" }, 400);
    }
  })

  .delete(async (c) => {
    const log = c.get("logger");
    const id = c.req.param("id");

    log.debug({ msg: "Deleting product", productId: id });

    const index = products.findIndex((p) => p.id === id);
    if (index === -1) {
      log.warn({ msg: "Product not found for deletion", productId: id });
      return c.json({ message: "Product not found" }, 404);
    }

    products.splice(index, 1);
    log.info({ msg: "Product deleted successfully", productId: id });
    return c.json({ message: "Product deleted" });
  });

export default app;
