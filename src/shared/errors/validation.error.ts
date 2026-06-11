import { AppError } from "./app.error";

/**
 * Erro lançado quando dados de entrada não passam na validação.
 */
export class ValidationError extends AppError {
  readonly statusCode = 400;
  readonly code = "VALIDATION_ERROR";

  constructor(message: string, details?: Record<string, unknown>) {
    super(message, details);
  }
}
