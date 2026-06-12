import type { AuthPayload, ITokenService } from "@core/ports/token.port";
import { UnauthorizedError } from "@shared/errors";
import { sign, verify } from "hono/jwt";

/**
 * Implementação de ITokenService usando o JWT nativo do Hono (HS256).
 */
export class HonoJwtTokenService implements ITokenService {
  constructor(
    private readonly secret: string,
    private readonly ttlSeconds: number
  ) {}

  async sign(payload: AuthPayload): Promise<string> {
    const exp = Math.floor(Date.now() / 1000) + this.ttlSeconds;
    return sign({ sub: payload.sub, perfil: payload.perfil, exp }, this.secret, "HS256");
  }

  async verify(token: string): Promise<AuthPayload> {
    try {
      const decoded = await verify(token, this.secret, "HS256");
      return { sub: decoded["sub"] as string, perfil: decoded["perfil"] as AuthPayload["perfil"] };
    } catch {
      throw new UnauthorizedError("Token inválido ou expirado");
    }
  }
}
