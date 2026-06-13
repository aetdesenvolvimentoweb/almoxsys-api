import type { RefreshToken } from "@core/domain/auth/refresh-token.entity";

/**
 * Port para persistência e revogação de refresh tokens.
 *
 * Implementações: in-memory (dev), Drizzle+Postgres (prod).
 */
export interface IRefreshTokenRepository {
  /**
   * Persiste um novo refresh token.
   */
  salvar(token: RefreshToken): Promise<void>;

  /**
   * Busca um refresh token pelo seu hash.
   *
   * @returns null se não encontrado
   */
  buscarPorHash(tokenHash: string): Promise<RefreshToken | null>;

  /**
   * Revoga (remove) um refresh token pelo hash. Idempotente.
   */
  revogar(tokenHash: string): Promise<void>;

  /**
   * Revoga todas as sessões de um militar. Usado quando a senha muda, para
   * invalidar sessões abertas com a credencial anterior. Idempotente.
   */
  revogarPorMilitar(militarId: string): Promise<void>;
}
