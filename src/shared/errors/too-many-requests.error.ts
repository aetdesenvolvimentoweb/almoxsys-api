import { AppError } from "./app.error";

/**
 * Erro lançado quando o cliente excede o limite de requisições permitido.
 * Usado pelo rate limiting das rotas de autenticação (anti brute-force).
 */
export class TooManyRequestsError extends AppError {
  readonly statusCode = 429 as const;
  readonly code = "TOO_MANY_REQUESTS";

  constructor(message: string = "Muitas requisições. Tente novamente mais tarde.") {
    super(message);
  }
}
