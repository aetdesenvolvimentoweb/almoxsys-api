import { emitirParDeTokens, type TokenPair } from "@core/application/auth/emitir-tokens";
import type { IHasher } from "@core/ports/hasher.port";
import type { IMilitarRepository } from "@core/ports/militar.repository";
import type { IRefreshTokenRepository } from "@core/ports/refresh-token.repository";
import type { ITokenService } from "@core/ports/token.port";
import { UnauthorizedError } from "@shared/errors";

export interface AutenticarMilitarInput {
  rg: number;
  senha: string;
}

export type AutenticarMilitarOutput = TokenPair;

/**
 * Autentica um militar por RG + senha e emite um par access + refresh token.
 *
 * Por segurança (OWASP A07), RG inexistente e senha incorreta produzem a mesma
 * resposta genérica, evitando enumeração de usuários.
 */
export class AutenticarMilitarCommand {
  constructor(
    private militarRepository: IMilitarRepository,
    private hasher: IHasher,
    private tokenService: ITokenService,
    private refreshTokenRepository: IRefreshTokenRepository,
    private refreshTtlSeconds: number
  ) {}

  async execute(input: AutenticarMilitarInput): Promise<AutenticarMilitarOutput> {
    const militar = await this.militarRepository.buscarPorRg(input.rg);
    if (!militar) {
      throw new UnauthorizedError("Credenciais inválidas");
    }

    const senhaConfere = await this.hasher.verify(input.senha, militar.senha);
    if (!senhaConfere) {
      throw new UnauthorizedError("Credenciais inválidas");
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
