import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { Resource } from "@opentelemetry/resources";
import {
	ATTR_SERVICE_NAME,
	ATTR_SERVICE_VERSION,
	SEMRESATTRS_DEPLOYMENT_ENVIRONMENT,
} from "@opentelemetry/semantic-conventions";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base";
const otlpExporter = new OTLPTraceExporter({
	url: "http://localhost:4318/v1/traces", // OTLP HTTP endpoint
});

// Initialize OpenTelemetry SDK
export const sdk = new NodeSDK({
	resource: new Resource({
		[ATTR_SERVICE_NAME]: "honomart",
		[ATTR_SERVICE_VERSION]: "1.0.0",
		[SEMRESATTRS_DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || "development",
	}),
	spanProcessor: new BatchSpanProcessor(otlpExporter),
});

// Handle shutdown gracefully
process
	.on("SIGTERM", () => {
		sdk
			.shutdown()
			.then(() => console.log("SDK shut down successfully"))
			.catch((error) => console.log("Error shutting down SDK", error))
			.finally(() => process.exit(0));
	})
	.on("SIGINT", () => {
		sdk
			.shutdown()
			.then(() =>
				console.log("Process was interrupted. SDK shut down successfully"),
			)
			.catch((error) =>
				console.log("Process was interrupted. Error shutting down SDK", error),
			)
			.finally(() => process.exit(0));
	});

// Start the SDK
sdk.start();
