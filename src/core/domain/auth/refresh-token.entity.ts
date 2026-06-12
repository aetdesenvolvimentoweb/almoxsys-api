import { randomUUID } from "node:crypto";

/**
 * Refresh token persistido. Guarda apenas o hash do token (nunca o valor cru),
 * permitindo revogação e rotação de sessões.
 */
export interface RefreshToken {
  id: string;
  militarId: string;
  tokenHash: string;
  expiraEm: Date;
  criadoEm: Date;
}

export interface CriarRefreshTokenInput {
  militarId: string;
  tokenHash: string;
  ttlSeconds: number;
}

/**
 * Cria um refresh token com expiração calculada a partir do TTL informado.
 */
export function criarRefreshToken(input: CriarRefreshTokenInput): RefreshToken {
  const agora = new Date();
  return {
    id: randomUUID(),
    militarId: input.militarId,
    tokenHash: input.tokenHash,
    expiraEm: new Date(agora.getTime() + input.ttlSeconds * 1000),
    criadoEm: agora,
  };
}
