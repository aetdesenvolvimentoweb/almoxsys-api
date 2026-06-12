import type { Perfil } from "@core/domain/militar.entity";

/**
 * Conteúdo do access token emitido após autenticação.
 *
 * @property sub - id do militar autenticado (subject).
 * @property perfil - perfil de acesso, usado para autorização (RBAC).
 */
export interface AuthPayload {
  sub: string;
  perfil: Perfil;
}

/**
 * Port para emissão e verificação de access tokens (JWT).
 *
 * Implementação: hono/jwt (HS256).
 */
export interface ITokenService {
  /**
   * Assina um access token com prazo de expiração configurado.
   */
  sign(payload: AuthPayload): Promise<string>;

  /**
   * Verifica assinatura e expiração de um token.
   *
   * @throws {UnauthorizedError} se o token for inválido ou expirado
   */
  verify(token: string): Promise<AuthPayload>;
}
