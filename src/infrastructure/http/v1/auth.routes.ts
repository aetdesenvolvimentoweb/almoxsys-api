import { AutenticarMilitarCommand } from "@core/application/commands/autenticar-militar.command";
import { RenovarTokenCommand } from "@core/application/commands/renovar-token.command";
import { RevogarTokenCommand } from "@core/application/commands/revogar-token.command";
import type { IHasher } from "@core/ports/hasher.port";
import type { ILogger } from "@core/ports/logger.port";
import type { IMilitarRepository } from "@core/ports/militar.repository";
import type { IRefreshTokenRepository } from "@core/ports/refresh-token.repository";
import type { ITokenService } from "@core/ports/token.port";
import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { z } from "zod";

const LoginSchema = z.object({
  rg: z.number().int().min(1).max(99999),
  senha: z.string().min(1).max(100),
});

const RefreshSchema = z.object({
  refreshToken: z.string().min(1),
});

const TokenPairSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});

export interface AuthRoutesDeps {
  militarRepository: IMilitarRepository;
  refreshTokenRepository: IRefreshTokenRepository;
  hasher: IHasher;
  tokenService: ITokenService;
  refreshTtlSeconds: number;
  logger: ILogger;
}

export function createAuthRoutes(deps: AuthRoutesDeps) {
  const {
    militarRepository,
    refreshTokenRepository,
    hasher,
    tokenService,
    refreshTtlSeconds,
    logger,
  } = deps;
  const router = new OpenAPIHono();

  const loginRoute = createRoute({
    method: "post",
    path: "/auth/login",
    tags: ["Auth"],
    summary: "Autentica um militar e emite access + refresh token",
    request: {
      body: { content: { "application/json": { schema: LoginSchema } } },
    },
    responses: {
      200: {
        description: "Autenticado com sucesso",
        content: { "application/json": { schema: TokenPairSchema } },
      },
      401: {
        description: "Credenciais inválidas",
        content: { "application/json": { schema: z.object({ message: z.string() }) } },
      },
    },
  });

  router.openapi(loginRoute, async (c) => {
    const body = c.req.valid("json");

    const command = new AutenticarMilitarCommand(
      militarRepository,
      hasher,
      tokenService,
      refreshTokenRepository,
      refreshTtlSeconds
    );
    const result = await command.execute(body);
    logger.info("auth.login", { rg: body.rg });
    return c.json(result, 200);
  });

  const refreshRoute = createRoute({
    method: "post",
    path: "/auth/refresh",
    tags: ["Auth"],
    summary: "Renova o par de tokens a partir de um refresh token válido",
    request: {
      body: { content: { "application/json": { schema: RefreshSchema } } },
    },
    responses: {
      200: {
        description: "Tokens renovados com sucesso",
        content: { "application/json": { schema: TokenPairSchema } },
      },
      401: {
        description: "Refresh token inválido ou expirado",
        content: { "application/json": { schema: z.object({ message: z.string() }) } },
      },
    },
  });

  router.openapi(refreshRoute, async (c) => {
    const body = c.req.valid("json");

    const command = new RenovarTokenCommand(
      refreshTokenRepository,
      militarRepository,
      tokenService,
      refreshTtlSeconds
    );
    const result = await command.execute(body);
    return c.json(result, 200);
  });

  const logoutRoute = createRoute({
    method: "post",
    path: "/auth/logout",
    tags: ["Auth"],
    summary: "Revoga um refresh token (logout)",
    request: {
      body: { content: { "application/json": { schema: RefreshSchema } } },
    },
    responses: {
      204: { description: "Logout efetuado" },
    },
  });

  router.openapi(logoutRoute, async (c) => {
    const body = c.req.valid("json");

    const command = new RevogarTokenCommand(refreshTokenRepository);
    await command.execute(body);
    return c.body(null, 204);
  });

  return router;
}
