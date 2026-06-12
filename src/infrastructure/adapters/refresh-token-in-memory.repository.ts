import type { RefreshToken } from "@core/domain/auth/refresh-token.entity";
import type { IRefreshTokenRepository } from "@core/ports/refresh-token.repository";

export class RefreshTokenInMemoryRepository implements IRefreshTokenRepository {
  private store: Map<string, RefreshToken> = new Map();

  async salvar(token: RefreshToken): Promise<void> {
    this.store.set(token.tokenHash, token);
  }

  async buscarPorHash(tokenHash: string): Promise<RefreshToken | null> {
    return this.store.get(tokenHash) ?? null;
  }

  async revogar(tokenHash: string): Promise<void> {
    this.store.delete(tokenHash);
  }
}
