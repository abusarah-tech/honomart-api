import { makeRequest } from "@/utils";
import { describe, expect, test } from "bun:test";

describe("Products API", () => {
	const testProduct = {
		name: "Test Product",
		description: "Test Description",
		price: 99.99,
		stock: 10,
	};

	test("should list products", async () => {
		const res = await makeRequest("/products");
		expect(res.status).toBe(200);

		const products = await res.json();
		expect(Array.isArray(products)).toBe(true);
	});

	test("should create a new product", async () => {
		const res = await makeRequest("/products", {
			method: "POST",
			body: JSON.stringify(testProduct),
		});
		expect(res.status).toBe(201);

		const product = await res.json();
		expect(product.id).toBeDefined();
		expect(product.name).toBe(testProduct.name);
		expect(product.price).toBe(testProduct.price);
	});

	test("should get product by ID", async () => {
		// First create a product
		const createRes = await makeRequest("/products", {
			method: "POST",
			body: JSON.stringify(testProduct),
		});
		const newProduct = await createRes.json();

		// Then fetch it by ID
		const res = await makeRequest(`/products/${newProduct.id}`);
		expect(res.status).toBe(200);

		const product = await res.json();
		expect(product.id).toBe(newProduct.id);
		expect(product.name).toBe(testProduct.name);
	});

	test("should update product", async () => {
		// First create a product
		const createRes = await makeRequest("/products", {
			method: "POST",
			body: JSON.stringify(testProduct),
		});
		const newProduct = await createRes.json();

		// Then update it
		const updatedData = { price: 199.99 };
		const res = await makeRequest(`/products/${newProduct.id}`, {
			method: "PUT",
			body: JSON.stringify(updatedData),
		});
		expect(res.status).toBe(200);

		const product = await res.json();
		expect(product.price).toBe(updatedData.price);
		expect(product.name).toBe(testProduct.name); // Other fields should remain unchanged
	});

	test("should delete product", async () => {
		// First create a product
		const createRes = await makeRequest("/products", {
			method: "POST",
			body: JSON.stringify(testProduct),
		});
		const newProduct = await createRes.json();

		// Then delete it
		const res = await makeRequest(`/products/${newProduct.id}`, {
			method: "DELETE",
		});
		expect(res.status).toBe(200);

		// Verify it's deleted
		const getRes = await makeRequest(`/products/${newProduct.id}`);
		expect(getRes.status).toBe(404);
	});
});
