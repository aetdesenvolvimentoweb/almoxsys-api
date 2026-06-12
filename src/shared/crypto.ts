import { createHash, randomBytes } from "node:crypto";

/**
 * Gera um token opaco de alta entropia (256 bits) para uso como refresh token.
 * O valor cru é entregue ao cliente; no servidor armazenamos apenas seu hash.
 */
export function gerarTokenOpaco(): string {
  return randomBytes(32).toString("base64url");
}

/**
 * Hash determinístico (SHA-256) para armazenar e buscar refresh tokens.
 *
 * SHA-256 é adequado aqui (e não Argon2id) porque o token já é aleatório de alta
 * entropia e a busca exige um hash determinístico, sem sal.
 */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
