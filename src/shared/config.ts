/**
 * Obtém a porta do servidor a partir de variável de ambiente ou padrão.
 */
export function getServerPort(): number {
  const portEnv = process.env["PORT"];
  return portEnv ? parseInt(portEnv, 10) : 3000;
}

/**
 * Segredo usado para assinar os access tokens JWT.
 *
 * @throws {Error} se JWT_SECRET não estiver definido — falha rápido no startup
 * para nunca rodar com autenticação insegura.
 */
export function getJwtSecret(): string {
  const secret = process.env["JWT_SECRET"];
  if (!secret) {
    throw new Error("JWT_SECRET não definido. Configure-o no .env antes de iniciar a aplicação.");
  }
  return secret;
}

/**
 * Tempo de expiração do access token, em segundos (padrão: 15 minutos).
 */
export function getAccessTokenTtl(): number {
  const ttl = process.env["JWT_ACCESS_TTL"];
  return ttl ? parseInt(ttl, 10) : 15 * 60;
}

/**
 * Tempo de expiração do refresh token, em segundos (padrão: 7 dias).
 */
export function getRefreshTokenTtl(): number {
  const ttl = process.env["JWT_REFRESH_TTL"];
  return ttl ? parseInt(ttl, 10) : 7 * 24 * 60 * 60;
}
