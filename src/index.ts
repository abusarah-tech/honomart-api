import { Hono } from "hono";
import baseLogger from "@/logger";
import { prettyJSON } from "hono/pretty-json";
import { cors } from "hono/cors";
import products_api from "@/modules/products";
import cart_api from "@/modules/carts";
import orders_api from "@/modules/orders";
import type { Variables } from "@/types";

const app = new Hono<{ Variables: Variables }>();

app.use("*", async (c, next) => {
	// Create a child logger with request-specific context
	const requestLogger = baseLogger.child({
		requestId: crypto.randomUUID(),
		method: c.req.method,
		path: c.req.path,
		userAgent: c.req.header("user-agent"),
	});

	// Add logger to context
	c.set("logger", requestLogger);

	// Log the incoming request
	requestLogger.info({
		msg: "Incoming request",
		query: c.req.query(),
	});

	try {
		await next();
	} catch (err) {
		const error = err as Error;
		requestLogger.error({
			msg: "Unhandled error occurred",
			error: error.message,
			stack: error.stack,
		});
		return c.json({ error: error.message }, 500);
	}

	// Log the response
	requestLogger.info({
		msg: "Request completed",
		status: c.res.status,
	});
});
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
