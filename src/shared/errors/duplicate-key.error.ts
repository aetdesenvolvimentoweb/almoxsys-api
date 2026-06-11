import { AppError } from "./app.error";

/**
 * Erro lançado quando tenta-se criar ou atualizar uma entidade com
 * um valor único que já existe (ex: email duplicado, abreviatura duplicada).
 */
export class DuplicateKeyError extends AppError {
  readonly statusCode = 409 as const;
  readonly code = "DUPLICATE_KEY";

  constructor(field: string, value: string) {
    const message = `${field} '${value}' já existe no sistema`;
    super(message, { field, value });
  }
}
