import { criarRefreshToken } from "@core/domain/auth/refresh-token.entity";
import type { Perfil } from "@core/domain/militar.entity";
import type { IRefreshTokenRepository } from "@core/ports/refresh-token.repository";
import type { ITokenService } from "@core/ports/token.port";
import { gerarTokenOpaco, hashToken } from "@shared/crypto";

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface EmitirTokensDeps {
  tokenService: ITokenService;
  refreshTokenRepository: IRefreshTokenRepository;
  refreshTtlSeconds: number;
}

/**
 * Emite um par access + refresh token para um militar e persiste o refresh
 * (apenas o hash). Compartilhado entre login e renovação para evitar duplicação.
 */
export async function emitirParDeTokens(
  deps: EmitirTokensDeps,
  militar: { id: string; perfil: Perfil }
): Promise<TokenPair> {
  const accessToken = await deps.tokenService.sign({ sub: militar.id, perfil: militar.perfil });

  const refreshToken = gerarTokenOpaco();
  const entity = criarRefreshToken({
    militarId: militar.id,
    tokenHash: hashToken(refreshToken),
    ttlSeconds: deps.refreshTtlSeconds,
  });
  await deps.refreshTokenRepository.salvar(entity);

  return { accessToken, refreshToken };
}
