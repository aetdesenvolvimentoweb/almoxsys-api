import type { ILogger } from "@core/ports/logger.port";
import pino from "pino";

const pinoInstance = pino({
  level: process.env.LOG_LEVEL || "info",
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
      ignore: "pid,hostname",
      translateTime: "SYS:standard",
      singleLine: false,
    },
  },
});

/**
 * Implementação de logging estruturado com Pino.
 */
export class PinoLoggerAdapter implements ILogger {
  debug(message: string, data?: Record<string, unknown>): void {
    pinoInstance.debug(data, message);
  }

  info(message: string, data?: Record<string, unknown>): void {
    pinoInstance.info(data, message);
  }

  warn(message: string, data?: Record<string, unknown>): void {
    pinoInstance.warn(data, message);
  }

  error(message: string, error?: Error | unknown, data?: Record<string, unknown>): void {
    if (error instanceof Error) {
      pinoInstance.error({ err: error, ...data }, message);
    } else {
      pinoInstance.error({ ...data, error }, message);
    }
  }
}

export const logger = new PinoLoggerAdapter();
