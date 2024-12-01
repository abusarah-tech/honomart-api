import type { Span } from "@opentelemetry/api";
import type pino from "pino";
import type { PrismaClient } from "@prisma/client";

export type Product = {
	id: string;
	createdAt: string;
	name: string;
	description: string;
	category: string;
	price: number;
	stock: number;
};

export type CartItem = {
	productId: string;
	quantity: number;
};

export type Order = {
	id: string;
	userId: string;
	items: CartItem[];
	totalAmount: number;
	status: "pending" | "confirmed" | "shipped" | "delivered";
	createdAt: string;
};

export type Variables = {
	logger: pino.Logger;
	span: Span;
	db: PrismaClient;
};
