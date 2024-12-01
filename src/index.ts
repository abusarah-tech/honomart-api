import { Hono } from "hono";
import { prettyJSON } from "hono/pretty-json";
import { cors } from "hono/cors";
import { trace, SpanStatusCode } from "@opentelemetry/api";
import { PrismaClient } from "@prisma/client";

import baseLogger from "@/lib/logger";
import products_api from "@/modules/products";
import cart_api from "@/modules/carts";
import orders_api from "@/modules/orders";
import type { Variables } from "@/types";

import "@/lib/instrumentation";

const app = new Hono<{ Variables: Variables }>();

const tracer = trace.getTracer("honomart");
const db = new PrismaClient();

app.use("*", async (c, next) => {
	// Create a span for each request
	return tracer.startActiveSpan(
		`${c.req.method} ${c.req.path}`,
		async (span) => {
			// Create a child logger with request-specific context
			const requestLogger = baseLogger.child({
				requestId: crypto.randomUUID(),
				method: c.req.method,
				path: c.req.path,
				userAgent: c.req.header("user-agent"),
				traceId: span.spanContext().traceId,
			});

			// Add logger and span to context
			c.set("logger", requestLogger);
			c.set("span", span);
			c.set("db", db);

			// Set span attributes
			span.setAttributes({
				"http.method": c.req.method,
				"http.url": c.req.path,
				"http.user_agent": c.req.header("user-agent"),
			});

			// Log the incoming request
			requestLogger.info({
				msg: "Incoming request",
				query: c.req.query(),
			});

			try {
				await next();

				// Set response status on span
				span.setAttributes({
					"http.status_code": c.res.status,
				});
			} catch (err) {
				const error = err as Error;
				requestLogger.error({
					msg: "Unhandled error occurred",
					error: error.message,
					stack: error.stack,
				});

				// Record error in span
				span.recordException(error);
				span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });

				return c.json({ error: error.message }, 500);
			} finally {
				// Log the response
				requestLogger.info({
					msg: "Request completed",
					status: c.res.status,
				});

				// End the span
				span.end();
			}
		},
	);
});
app.use("*", prettyJSON());
app.use("*", cors());

app.onError((err, c) => {
	c.get("logger").error({ status: 500, msg: err.message });
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
app.route("/carts", cart_api);
app.route("/orders", orders_api);

export default app;
