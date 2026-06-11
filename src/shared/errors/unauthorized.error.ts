import { AppError } from "./app.error";

/**
 * Erro lançado quando uma requisição não está autenticada ou token é inválido.
 */
export class UnauthorizedError extends AppError {
  readonly statusCode = 401 as const;
  readonly code = "UNAUTHORIZED";

  constructor(message: string = "Autenticação requerida") {
    super(message);
  }
}
