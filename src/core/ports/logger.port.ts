/**
 * Contrato para logging estruturado da aplicação.
 *
 * Implementações concretas (Pino, Winston, etc.) devem seguir esta interface.
 * Logs estruturados facilitam agregação e análise em produção.
 */
export interface ILogger {
  /**
   * Log de depuração (nível DEBUG).
   */
  debug(message: string, data?: Record<string, unknown>): void;

  /**
   * Log informativo (nível INFO).
   */
  info(message: string, data?: Record<string, unknown>): void;

  /**
   * Log de aviso (nível WARN).
   */
  warn(message: string, data?: Record<string, unknown>): void;

  /**
   * Log de erro (nível ERROR).
   * @param message Mensagem de erro
   * @param error Erro ou dados contextuais
   * @param data Dados adicionais estruturados
   */
  error(message: string, error?: Error | unknown, data?: Record<string, unknown>): void;
}
