import { Hono } from "hono";
import { carts, orders, products } from "@/config/constants";
import type { Order, Variables } from "@/types";

const app = new Hono<{ Variables: Variables }>()
  .get("/", async (c) => {
    const log = c.get("logger");
    const userId = c.req.header("X-User-ID");

    log.debug({ msg: "Fetching user orders", userId });

    if (!userId) {
      log.warn({ msg: "Missing user ID in request" });
      return c.json({ message: "User ID required" }, 400);
    }

    const userOrders = orders.filter((order) => order.userId === userId);
    log.info({
      msg: "Retrieved user orders",
      userId,
      orderCount: userOrders.length,
    });

    return c.json(userOrders);
  })

  .post(async (c) => {
    const log = c.get("logger");
    const userId = c.req.header("X-User-ID");

    log.debug({ msg: "Creating new order", userId });

    if (!userId) {
      log.warn({ msg: "Missing user ID in request" });
      return c.json({ message: "User ID required" }, 400);
    }

    const userCart = carts.get(userId);
    if (!userCart || userCart.length === 0) {
      log.warn({
        msg: "Attempt to create order with empty cart",
        userId,
      });
      return c.json({ message: "Cart is empty" }, 400);
    }

    log.debug({
      msg: "Processing cart items",
      userId,
      cartItemCount: userCart.length,
    });

    // Calculate total amount
    let totalAmount = 0;
    try {
      for (const item of userCart) {
        const product = products.find((p) => p.id === item.productId);
        if (!product) {
          log.error({
            msg: "Product not found during order creation",
            userId,
            productId: item.productId,
          });
          return c.json(
            { message: `Product ${item.productId} not found` },
            404,
          );
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

      log.info({
        msg: "Order created successfully",
        userId,
        orderId: newOrder.id,
        itemCount: userCart.length,
        totalAmount,
      });

      return c.json(newOrder, 201);
    } catch (error) {
      log.error({
        msg: "Failed to create order",
        userId,
        error,
      });
      return c.json({ message: "Failed to create order" }, 500);
    }
  });

app.get("/:id", async (c) => {
  const log = c.get("logger");
  const userId = c.req.header("X-User-ID");
  const orderId = c.req.param("id");

  log.debug({
    msg: "Fetching specific order",
    userId,
    orderId,
  });

  if (!userId) {
    log.warn({ msg: "Missing user ID in request", orderId });
    return c.json({ message: "User ID required" }, 400);
  }

  const order = orders.find((o) => o.id === orderId && o.userId === userId);
  if (!order) {
    log.warn({
      msg: "Order not found",
      userId,
      orderId,
    });
    return c.json({ message: "Order not found" }, 404);
  }

  log.info({
    msg: "Order retrieved successfully",
    userId,
    orderId,
  });

  return c.json(order);
});

// Update order status
app.patch("/:id/status", async (c) => {
  const log = c.get("logger");
  const userId = c.req.header("X-User-ID");
  const orderId = c.req.param("id");

  log.debug({
    msg: "Updating order status",
    userId,
    orderId,
  });

  if (!userId) {
    log.warn({ msg: "Missing user ID in request", orderId });
    return c.json({ message: "User ID required" }, 400);
  }

  try {
    const body = await c.req.json<{ status: Order["status"] }>();
    const order = orders.find((o) => o.id === orderId && o.userId === userId);

    if (!order) {
      log.warn({
        msg: "Order not found for status update",
        userId,
        orderId,
      });
      return c.json({ message: "Order not found" }, 404);
    }

    const oldStatus = order.status;
    order.status = body.status;

    log.info({
      msg: "Order status updated successfully",
      userId,
      orderId,
      oldStatus,
      newStatus: body.status,
    });

    return c.json(order);
  } catch (error) {
    log.error({
      msg: "Failed to update order status",
      userId,
      orderId,
      error,
    });
    return c.json({ message: "Invalid request body" }, 400);
  }
});

export default app;
