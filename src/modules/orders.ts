import { Hono } from "hono";
import { carts, orders, products } from "@/config/constants";
import type { Order } from "@/types";

const app = new Hono()
  .get("/", async (c) => {
    const userId = c.req.header("X-User-ID");
    if (!userId) {
      return c.json({ message: "User ID required" }, 400);
    }
    return c.json(orders.filter((order) => order.userId === userId));
  })
  .post(async (c) => {
    const userId = c.req.header("X-User-ID");
    if (!userId) {
      return c.json({ message: "User ID required" }, 400);
    }

    const userCart = carts.get(userId);
    if (!userCart || userCart.length === 0) {
      return c.json({ message: "Cart is empty" }, 400);
    }

    // Calculate total amount
    let totalAmount = 0;
    for (const item of userCart) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) {
        return c.json({ message: `Product ${item.productId} not found` }, 404);
      }
      totalAmount += product.price * item.quantity;
    }

    const newOrder: Order = {
      id: Math.random().toString(36).substring(2, 9),
      userId,
      items: [...userCart],
      totalAmount,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    orders.push(newOrder);
    carts.delete(userId); // Clear cart after order
    return c.json(newOrder, 201);
  });

app.get("/:id", async (c) => {
  const userId = c.req.header("X-User-ID");
  const orderId = c.req.param("id");

  if (!userId) {
    return c.json({ message: "User ID required" }, 400);
  }

  const order = orders.find((o) => o.id === orderId && o.userId === userId);
  if (!order) {
    return c.json({ message: "Order not found" }, 404);
  }

  return c.json(order);
});

// Update order status
app.patch("/:id/status", async (c) => {
  const userId = c.req.header("X-User-ID");
  const orderId = c.req.param("id");

  if (!userId) {
    return c.json({ message: "User ID required" }, 400);
  }

  const body = await c.req.json<{ status: Order["status"] }>();
  const order = orders.find((o) => o.id === orderId && o.userId === userId);

  if (!order) {
    return c.json({ message: "Order not found" }, 404);
  }

  order.status = body.status;
  return c.json(order);
});

export default app;
