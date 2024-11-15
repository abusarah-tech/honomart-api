import { Hono } from "hono";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { cors } from "hono/cors";
import products_api from "@/modules/products";
import cart_api from "@/modules/carts";
import orders_api from "@/modules/orders";

const app = new Hono();

app.use("*", logger());
app.use("*", prettyJSON());
app.use("*", cors());

app.onError((err, c) => {
  console.error(`[ERROR] ${err.message}`);
  return c.json(
    {
      success: false,
      message: err.message,
    },
    500,
  );
});

app.get("/", (c) => {
  return c.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

app.route("/products", products_api);
app.route("/cart", cart_api);
app.route("/orders", orders_api);

export default app;
