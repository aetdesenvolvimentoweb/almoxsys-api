import { AppError } from "@shared/errors";
import type { Context, Next } from "hono";

/**
 * Middleware de tratamento de erros para a aplicação Hono.
 *
 * Captura erros AppError e os serializa em resposta HTTP segura.
 * Erros desconhecidos são logados e retornam 500 (nunca expõem detalhes em produção).
 */
export async function errorHandlerMiddleware(c: Context, next: Next) {
  try {
    await next();
  } catch (error) {
    if (error instanceof AppError) {
      return c.json(error.toJSON(), error.statusCode);
    }

    // Erro desconhecido — logar e retornar 500 genérico
    console.error("Unhandled error:", error);

    return c.json(
      {
        code: "INTERNAL_SERVER_ERROR",
        message: "Erro interno do servidor",
      },
      500
    );
  }
}
