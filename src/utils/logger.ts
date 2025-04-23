import pino from "pino";

import type { Logger } from "pino";

declare global {
  var logger: Logger; // runtime
  interface GlobalThis {
    logger: Logger; // type-safe globalThis.logger
  }
}

const logger = pino({
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "SYS:standard",
      ignore: "pid,hostname",
    },
  },
});

global.logger = logger;

export default logger;
