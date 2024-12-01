import { Hono } from "hono";
import { SpanKind, SpanStatusCode, trace } from "@opentelemetry/api";

import type { Product, Variables } from "@/types";

const tracer = trace.getTracer("honomart");

const app = new Hono<{ Variables: Variables }>()
  .get("/", async (c) => {
    const log = c.get("logger");
    const parentSpan = c.get("span");
    const db = c.get("db");

    return tracer.startActiveSpan(
      "products.list",
      {
        kind: SpanKind.SERVER,
        attributes: {
          "products.operation": "list",
        },
      },
      async (span) => {
        // Add link to parent span with additional attributes about the relationship
        span.addLink({
          context: parentSpan.spanContext(),
          attributes: {
            relationship: "parent-child",
            "operation.type": "list-products",
          },
        });
        log.debug({ msg: "Fetching all products" });
        try {
          span.addEvent("Fetching products from store");
          const products = await db.product.findMany();

          span.setAttributes({
            "products.count": products.length,
          });

          log.info({
            msg: "Successfully retrieved all products",
            count: products.length,
          });

          span.setStatus({ code: SpanStatusCode.OK });
          return c.json(products);
        } catch (error) {
          log.error({ msg: "Failed to fetch products", error });
          span.recordException(error as Error);
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: "Failed to fetch products",
          });
          return c.json({ message: "Internal server error" }, 500);
        } finally {
          span.end();
        }
      },
    );
  })

  .post(async (c) => {
    const log = c.get("logger");
    const parentSpan = c.get("span");
    const db = c.get("db");

    return tracer.startActiveSpan(
      "products.create",
      {
        kind: SpanKind.SERVER,
        attributes: {
          "products.operation": "create",
        },
      },
      async (span) => {
        // Add link to parent span with additional attributes about the relationship
        span.addLink({
          context: parentSpan.spanContext(),
          attributes: {
            relationship: "parent-child",
            "operation.type": "list-products",
          },
        });
        try {
          span.addEvent("Parsing request body");
          const body = await c.req.json<Omit<Product, "id">>();

          span.setAttributes({
            "product.name": body.name,
          });

          log.debug({ msg: "Creating new product", body });
          span.addEvent("Generating product ID");

          const newProduct = await db.product.create({ data: body });

          span.setAttributes({
            "product.id": newProduct.id,
          });

          log.info({
            msg: "Product created successfully",
            productId: newProduct.id,
          });

          span.setStatus({ code: SpanStatusCode.OK });
          return c.json(newProduct, 201);
        } catch (error) {
          log.error({ msg: "Failed to create product", error });
          span.recordException(error as Error);
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: "Failed to create product",
          });
          return c.json({ message: "Invalid request body" }, 400);
        } finally {
          span.end();
        }
      },
    );
  })

  .get("/:id", (c) => {
    const log = c.get("logger");
    const parentSpan = c.get("span");
    const id = c.req.param("id");
    const db = c.get("db");

    return tracer.startActiveSpan(
      "products.get",
      {
        kind: SpanKind.SERVER,
        attributes: {
          "products.operation": "get",
          "product.id": id,
        },
      },
      async (span) => {
        // Add link to parent span with additional attributes about the relationship
        span.addLink({
          context: parentSpan.spanContext(),
          attributes: {
            relationship: "parent-child",
            "operation.type": "list-products",
          },
        });
        log.debug({ msg: "Fetching product by id", productId: id });
        span.addEvent("Searching for product");

        const product = await db.product.findFirst({ where: { id } });
        if (!product) {
          span.setAttributes({
            "products.found": false,
          });
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: "Product not found",
          });
          log.warn({ msg: "Product not found", productId: id });
          return c.json({ message: "Product not found" }, 404);
        }

        span.setAttributes({
          "products.found": true,
          "product.name": product.name,
        });

        log.info({ msg: "Product retrieved successfully", productId: id });
        span.setStatus({ code: SpanStatusCode.OK });
        return c.json(product);
      },
    );
  })

  .put(async (c) => {
    const log = c.get("logger");
    const parentSpan = c.get("span");
    const id = c.req.param("id");
    const db = c.get("db");

    return tracer.startActiveSpan(
      "products.update",
      {
        kind: SpanKind.SERVER,
        attributes: {
          "products.operation": "update",
          "product.id": id,
        },
      },
      async (span) => {
        // Add link to parent span with additional attributes about the relationship
        span.addLink({
          context: parentSpan.spanContext(),
          attributes: {
            relationship: "parent-child",
            "operation.type": "list-products",
          },
        });
        try {
          log.debug({ msg: "Updating product", productId: id });
          span.addEvent("Parsing update payload");
          const body = await c.req.json<Partial<Omit<Product, "id">>>();
          try {
            const updatedProduct = await db.product.update({
              where: { id },
              data: body,
            });
            span.setAttributes({
              "products.found": true,
              "product.updates": JSON.stringify(Object.keys(body)),
            });

            log.info({
              msg: "Product updated successfully",
              productId: id,
              updates: Object.keys(body),
            });

            span.setStatus({ code: SpanStatusCode.OK });
            return c.json(updatedProduct);
          } catch (e) {
            span.setAttributes({
              "products.found": false,
            });
            span.setStatus({
              code: SpanStatusCode.ERROR,
              message: "Product not found",
            });
            log.warn({ msg: "Product not found for update", productId: id });
            return c.json({ message: "Product not found" }, 404);
          }
        } catch (error) {
          log.error({ msg: "Failed to update product", productId: id, error });
          span.recordException(error as Error);
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: "Failed to update product",
          });
          return c.json({ message: "Invalid request body" }, 400);
        } finally {
          span.end();
        }
      },
    );
  })

  .delete(async (c) => {
    const log = c.get("logger");
    const parentSpan = c.get("span");
    const id = c.req.param("id");
    const db = c.get("db");

    return tracer.startActiveSpan(
      "products.delete",
      {
        kind: SpanKind.SERVER,
        attributes: {
          "products.operation": "delete",
          "product.id": id,
        },
      },
      async (span) => {
        // Add link to parent span with additional attributes about the relationship
        span.addLink({
          context: parentSpan.spanContext(),
          attributes: {
            relationship: "parent-child",
            "operation.type": "list-products",
          },
        });
        log.debug({ msg: "Deleting product", productId: id });
        try {
          span.addEvent("Removing product");
          await db.product.delete({ where: { id } });

          span.setAttributes({
            "products.found": true,
          });

          log.info({ msg: "Product deleted successfully", productId: id });
          span.setStatus({ code: SpanStatusCode.OK });
          return c.json({ message: "Product deleted" });
        } catch (e) {
          span.setAttributes({
            "products.found": false,
          });
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: "Product not found",
          });
          log.warn({ msg: "Product not found for deletion", productId: id });
          return c.json({ message: "Product not found" }, 404);
        } finally {
          span.end();
        }
      },
    );
  });
export default app;
