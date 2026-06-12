import { logger } from "@infra/adapters/pino-logger.adapter";
import { AppError } from "@shared/errors";
import type { Context } from "hono";

/**
 * Handler global de erros (registrado via `app.onError`).
 *
 * Usar `onError` em vez de um middleware try/catch é essencial: erros lançados
 * em sub-apps montados com `app.route()` são convertidos internamente em 500
 * pelo próprio sub-app e não propagam para um try/catch do app pai — mas o
 * `onError` do app pai os captura corretamente.
 *
 * Erros AppError são serializados de forma segura; erros desconhecidos são
 * logados e retornam 500 genérico (nunca expõem detalhes em produção).
 */
export function errorHandler(error: Error, c: Context) {
  if (error instanceof AppError) {
    return c.json(error.toJSON(), error.statusCode);
  }

  logger.error("Unhandled error", error);

  return c.json(
    {
      code: "INTERNAL_SERVER_ERROR",
      message: "Erro interno do servidor",
    },
    500
  );
}
