import { AutenticarMilitarCommand } from "@core/application/commands/autenticar-militar.command";
import type { IHasher } from "@core/ports/hasher.port";
import type { ILogger } from "@core/ports/logger.port";
import type { IMilitarRepository } from "@core/ports/militar.repository";
import type { ITokenService } from "@core/ports/token.port";
import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { z } from "zod";

const LoginSchema = z.object({
  rg: z.number().int().min(1).max(99999),
  senha: z.string().min(1).max(100),
});

const TokenSchema = z.object({
  accessToken: z.string(),
});

export function createAuthRoutes(
  militarRepository: IMilitarRepository,
  hasher: IHasher,
  tokenService: ITokenService,
  logger: ILogger
) {
  const router = new OpenAPIHono();

  const loginRoute = createRoute({
    method: "post",
    path: "/auth/login",
    tags: ["Auth"],
    summary: "Autentica um militar e emite um access token",
    request: {
      body: { content: { "application/json": { schema: LoginSchema } } },
    },
    responses: {
      200: {
        description: "Autenticado com sucesso",
        content: { "application/json": { schema: TokenSchema } },
      },
      401: {
        description: "Credenciais inválidas",
        content: { "application/json": { schema: z.object({ message: z.string() }) } },
      },
    },
  });

  router.openapi(loginRoute, async (c) => {
    const body = c.req.valid("json");

    const command = new AutenticarMilitarCommand(militarRepository, hasher, tokenService);
    const result = await command.execute(body);
    logger.info("auth.login", { rg: body.rg });
    return c.json(result, 200);
  });

  return router;
}
