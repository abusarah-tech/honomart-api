import { carts } from "@/config/constants";
import type { CartItem, Variables } from "@/types";
import { Hono } from "hono";

const app = new Hono<{ Variables: Variables }>()
  .get("/", async (c) => {
    const log = c.get("logger");
    const userId = c.req.header("X-User-ID");

    log.debug({
      msg: "Fetching user cart",
      userId,
    });

    if (!userId) {
      log.warn({
        msg: "Missing user ID in cart fetch request",
      });
      return c.json({ message: "User ID required" }, 400);
    }

    const cart = carts.get(userId) || [];
    log.info({
      msg: "Cart retrieved successfully",
      userId,
      itemCount: cart.length,
      totalItems: cart.reduce((sum, item) => sum + item.quantity, 0),
    });

    return c.json(cart);
  })

  .post(async (c) => {
    const log = c.get("logger");
    const userId = c.req.header("X-User-ID");
    const db = c.get("db");

    log.debug({
      msg: "Adding item to cart",
      userId,
    });

    if (!userId) {
      log.warn({
        msg: "Missing user ID in add to cart request",
      });
      return c.json({ message: "User ID required" }, 400);
    }

    try {
      const body = await c.req.json<CartItem>();

      log.debug({
        msg: "Validating product for cart addition",
        userId,
        productId: body.productId,
        quantity: body.quantity,
      });

      const product = await db.product.findFirst({
        where: { id: body.productId },
      });
      if (!product) {
        log.warn({
          msg: "Attempt to add non-existent product to cart",
          userId,
          productId: body.productId,
        });
        return c.json({ message: "Product not found" }, 404);
      }

      const userCart = carts.get(userId) || [];
      const existingItem = userCart.find(
        (item) => item.productId === body.productId,
      );

      if (existingItem) {
        log.debug({
          msg: "Updating quantity of existing cart item",
          userId,
          productId: body.productId,
          oldQuantity: existingItem.quantity,
          addedQuantity: body.quantity,
          newQuantity: existingItem.quantity + body.quantity,
        });
        existingItem.quantity += body.quantity;
      } else {
        log.debug({
          msg: "Adding new item to cart",
          userId,
          productId: body.productId,
          quantity: body.quantity,
        });
        userCart.push(body);
      }

      carts.set(userId, userCart);

      log.info({
        msg: "Cart updated successfully",
        userId,
        itemCount: userCart.length,
        totalItems: userCart.reduce((sum, item) => sum + item.quantity, 0),
      });

      return c.json(userCart);
    } catch (error) {
      log.error({
        msg: "Failed to process cart addition",
        userId,
        error,
      });
      return c.json({ message: "Invalid request body" }, 400);
    }
  })

  .delete((c) => {
    const log = c.get("logger");
    const userId = c.req.header("X-User-ID");

    log.debug({
      msg: "Attempting to clear cart",
      userId,
    });

    if (!userId) {
      log.warn({
        msg: "Missing user ID in clear cart request",
      });
      return c.json({ message: "User ID required" }, 400);
    }

    const existingCart = carts.get(userId);
    if (existingCart) {
      log.info({
        msg: "Clearing non-empty cart",
        userId,
        itemCount: existingCart.length,
        totalItems: existingCart.reduce((sum, item) => sum + item.quantity, 0),
      });
    } else {
      log.info({
        msg: "Clearing already empty cart",
        userId,
      });
    }

    carts.delete(userId);

    log.info({
      msg: "Cart cleared successfully",
      userId,
    });

    return c.json({ message: "Cart cleared" });
  });

export default app;
