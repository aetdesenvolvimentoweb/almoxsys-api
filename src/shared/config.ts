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

/**
 * Origens permitidas pelo CORS, a partir de `CORS_ORIGINS` (lista separada por
 * vírgula). Em produção é obrigatório defini-la — falha rápido para nunca subir
 * com uma política permissiva. Em desenvolvimento, libera localhost por padrão.
 *
 * @throws {Error} se `CORS_ORIGINS` não estiver definida em produção.
 */
export function getCorsOrigins(): string[] {
  const raw = process.env["CORS_ORIGINS"];
  if (raw) {
    return raw
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean);
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("CORS_ORIGINS não definido. Configure as origens permitidas em produção.");
  }

  return ["http://localhost:3000", "http://localhost:5173"];
}

/**
 * Limite de requisições das rotas de autenticação (anti brute-force).
 * Configurável via `RATE_LIMIT_AUTH_MAX` e `RATE_LIMIT_AUTH_WINDOW` (segundos).
 * Padrão: 5 requisições por 60 segundos.
 */
export function getAuthRateLimit(): { max: number; windowMs: number } {
  const max = process.env["RATE_LIMIT_AUTH_MAX"];
  const windowSeconds = process.env["RATE_LIMIT_AUTH_WINDOW"];
  return {
    max: max ? parseInt(max, 10) : 5,
    windowMs: (windowSeconds ? parseInt(windowSeconds, 10) : 60) * 1000,
  };
}

export interface BootstrapAdminConfig {
  rg: number;
  nome: string;
  email: string;
  senha: string;
}

/**
 * Dados do Administrador inicial, criados no startup quando ainda não há
 * nenhum militar. Retorna null se as variáveis ADMIN_* não estiverem completas.
 */
export function getBootstrapAdmin(): BootstrapAdminConfig | null {
  const rg = process.env["ADMIN_RG"];
  const nome = process.env["ADMIN_NOME"];
  const email = process.env["ADMIN_EMAIL"];
  const senha = process.env["ADMIN_SENHA"];

  if (!rg || !nome || !email || !senha) {
    return null;
  }

  return { rg: parseInt(rg, 10), nome, email, senha };
}
