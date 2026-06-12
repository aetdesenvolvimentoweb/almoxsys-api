import { emitirParDeTokens, type TokenPair } from "@core/application/auth/emitir-tokens";
import type { IMilitarRepository } from "@core/ports/militar.repository";
import type { IRefreshTokenRepository } from "@core/ports/refresh-token.repository";
import type { ITokenService } from "@core/ports/token.port";
import { hashToken } from "@shared/crypto";
import { UnauthorizedError } from "@shared/errors";

export interface RenovarTokenInput {
  refreshToken: string;
}

export type RenovarTokenOutput = TokenPair;

/**
 * Troca um refresh token válido por um novo par de tokens.
 *
 * Aplica rotação: o refresh token usado é revogado e um novo é emitido. Tokens
 * inexistentes, expirados ou de militar removido resultam em erro genérico.
 */
export class RenovarTokenCommand {
  constructor(
    private refreshTokenRepository: IRefreshTokenRepository,
    private militarRepository: IMilitarRepository,
    private tokenService: ITokenService,
    private refreshTtlSeconds: number
  ) {}

  async execute(input: RenovarTokenInput): Promise<RenovarTokenOutput> {
    const tokenHash = hashToken(input.refreshToken);
    const armazenado = await this.refreshTokenRepository.buscarPorHash(tokenHash);

    if (!armazenado) {
      throw new UnauthorizedError("Sessão inválida");
    }

    if (armazenado.expiraEm.getTime() <= Date.now()) {
      await this.refreshTokenRepository.revogar(tokenHash);
      throw new UnauthorizedError("Sessão inválida");
    }

    await this.refreshTokenRepository.revogar(tokenHash);

    const militar = await this.militarRepository
      .buscarPorId(armazenado.militarId)
      .catch(() => null);
    if (!militar) {
      throw new UnauthorizedError("Sessão inválida");
    }

    return emitirParDeTokens(
      {
        tokenService: this.tokenService,
        refreshTokenRepository: this.refreshTokenRepository,
        refreshTtlSeconds: this.refreshTtlSeconds,
      },
      militar
    );
  }
}
