import { AppError } from "./app.error";

/**
 * Erro lançado quando um usuário autenticado não tem permissão
 * para acessar um recurso (autorização insuficiente).
 */
export class ForbiddenError extends AppError {
  readonly statusCode = 403 as const;
  readonly code = "FORBIDDEN";

  constructor(message: string = "Você não tem permissão para acessar este recurso") {
    super(message);
  }
}
