import { AppError } from "./app.error";

/**
 * Erro lançado quando um recurso não é encontrado.
 */
export class NotFoundError extends AppError {
  readonly statusCode = 404 as const;
  readonly code = "NOT_FOUND";

  constructor(entity: string, id: string) {
    const message = `${entity} com id '${id}' não encontrado`;
    super(message, { entity, id });
  }
}
