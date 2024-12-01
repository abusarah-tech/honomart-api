import pino from "pino";
import { SonicBoom } from "sonic-boom";

const logger = pino(
	{
		level: process.env.LOG_LEVEL || "info",
		formatters: {
			level: (label) => ({ level: label }),
		},
	},
	pino.multistream([
		{
			stream: new SonicBoom({
				dest: "./logs/app.log",
				sync: false,
				mkdir: true,
				append: false,
			}),
			level: "debug",
		},
	]),
);

export default logger;
