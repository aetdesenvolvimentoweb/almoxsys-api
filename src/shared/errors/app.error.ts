export type HttpStatusCode = 400 | 401 | 403 | 404 | 409 | 500;

/**
 * Erro base da aplicação. Todos os erros personalizados devem estender esta classe.
 *
 * @property statusCode - Código HTTP sugerido para a resposta
 * @property code - Identificador único do erro (ex: ENTITY_NOT_FOUND)
 * @property message - Mensagem de erro legível ao usuário
 * @property details - Dados adicionais úteis para debug (nunca expostos em produção)
 */
export abstract class AppError extends Error {
  abstract readonly statusCode: HttpStatusCode;
  abstract readonly code: string;
  readonly details?: Record<string, unknown>;

  constructor(message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = this.constructor.name;
    this.details = details;
  }

  /**
   * Serializa o erro para uma resposta HTTP segura (nunca expõe stack traces em produção).
   */
  toJSON() {
    return {
      code: this.code,
      message: this.message,
      ...(process.env.NODE_ENV !== "production" && { details: this.details }),
    };
  }
}
