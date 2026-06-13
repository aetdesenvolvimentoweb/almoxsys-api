import type { Ator } from "@core/domain/auth/ator";
import type { IMilitarRepository } from "@core/ports/militar.repository";
import type { ITokenService } from "@core/ports/token.port";
import { ForbiddenError, UnauthorizedError } from "@shared/errors";
import type { Context, Next } from "hono";

/**
 * Variáveis injetadas no contexto Hono pelo middleware de autenticação.
 */
export interface AuthVariables {
  ator: Ator;
}

/**
 * Cria o middleware de autenticação JWT.
 *
 * Valida o header `Authorization: Bearer <token>` e injeta o `ator` no contexto
 * para que os handlers repassem aos use cases (onde o RBAC é aplicado).
 *
 * @throws {UnauthorizedError} se o token estiver ausente ou for inválido
 */
export function createAuthMiddleware(tokenService: ITokenService) {
  return async (c: Context<{ Variables: AuthVariables }>, next: Next) => {
    const header = c.req.header("Authorization");
    if (!header?.startsWith("Bearer ")) {
      throw new UnauthorizedError("Autenticação requerida");
    }

    const token = header.slice("Bearer ".length).trim();
    const payload = await tokenService.verify(token);

    c.set("ator", { id: payload.sub, perfil: payload.perfil });
    await next();
  };
}

/**
 * Bloqueia o acesso enquanto o militar tiver senha provisória.
 *
 * Lê o estado atual do repositório (não do token) a cada requisição, de modo que
 * o desbloqueio é imediato após a troca, sem depender da expiração do access
 * token. Deve ser aplicado após {@link createAuthMiddleware} e em todas as rotas
 * protegidas, exceto a própria troca de senha.
 *
 * @throws {ForbiddenError} se o militar ainda precisa definir sua senha
 */
export function exigirSenhaDefinitiva(militarRepository: IMilitarRepository) {
  return async (c: Context<{ Variables: AuthVariables }>, next: Next) => {
    const ator = c.get("ator");
    const militar = await militarRepository.buscarPorId(ator.id);
    if (militar.deveTrocarSenha) {
      throw new ForbiddenError("Troca de senha obrigatória antes de prosseguir");
    }
    await next();
  };
}
