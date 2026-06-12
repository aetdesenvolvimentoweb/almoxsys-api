import type { IRefreshTokenRepository } from "@core/ports/refresh-token.repository";
import { hashToken } from "@shared/crypto";

export interface RevogarTokenInput {
  refreshToken: string;
}

/**
 * Revoga um refresh token (logout). Idempotente: tokens inexistentes não geram erro.
 */
export class RevogarTokenCommand {
  constructor(private refreshTokenRepository: IRefreshTokenRepository) {}

  async execute(input: RevogarTokenInput): Promise<void> {
    await this.refreshTokenRepository.revogar(hashToken(input.refreshToken));
  }
}
