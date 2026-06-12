import { swaggerUI } from "@hono/swagger-ui";
import { OpenAPIHono } from "@hono/zod-openapi";
import { BunPasswordHasher } from "@infra/adapters/bun-password-hasher.adapter";
import { HonoJwtTokenService } from "@infra/adapters/hono-jwt-token.service";
import { MilitarInMemoryRepository } from "@infra/adapters/militar-in-memory.repository";
import { logger } from "@infra/adapters/pino-logger.adapter";
import { PostoGraduacaoInMemoryRepository } from "@infra/adapters/posto-graduacao-in-memory.repository";
import { RefreshTokenInMemoryRepository } from "@infra/adapters/refresh-token-in-memory.repository";
import { errorHandler } from "@infra/http/error-handler.middleware";
import { createAuthRoutes } from "@infra/http/v1/auth.routes";
import { createMilitarRoutes } from "@infra/http/v1/militar.routes";
import { createPostoGraduacaoRoutes } from "@infra/http/v1/posto-graduacao.routes";
import { bootstrapAdmin } from "@infra/seed/bootstrap-admin";
import {
  getAccessTokenTtl,
  getBootstrapAdmin,
  getJwtSecret,
  getRefreshTokenTtl,
  getServerPort,
} from "@shared/config";

const app = new OpenAPIHono();

app.onError(errorHandler);

app.doc("/api/docs/spec", {
  openapi: "3.0.0",
  info: {
    version: "1.0.0",
    title: "ALMOXSYS-API",
    description: "Sistema de controle de almoxarifado para Organizações Bombeiro Militar",
  },
});

if (process.env.NODE_ENV !== "production") {
  app.get("/api/docs", swaggerUI({ url: "/api/docs/spec" }));
}

const postoGraduacaoRepository = new PostoGraduacaoInMemoryRepository();
const militarRepository = new MilitarInMemoryRepository();
const refreshTokenRepository = new RefreshTokenInMemoryRepository();
const hasher = new BunPasswordHasher();
const tokenService = new HonoJwtTokenService(getJwtSecret(), getAccessTokenTtl());

const authRoutes = createAuthRoutes({
  militarRepository,
  refreshTokenRepository,
  hasher,
  tokenService,
  refreshTtlSeconds: getRefreshTokenTtl(),
  logger,
});
const postoGraduacaoRoutes = createPostoGraduacaoRoutes(postoGraduacaoRepository, logger);
const militarRoutes = createMilitarRoutes(
  militarRepository,
  postoGraduacaoRepository,
  logger,
  hasher,
  tokenService
);

app.route("/api/v1", authRoutes);
app.route("/api/v1", postoGraduacaoRoutes);
app.route("/api/v1", militarRoutes);

await bootstrapAdmin(
  { militarRepository, postoGraduacaoRepository, hasher, logger },
  getBootstrapAdmin()
);

export { app };

export default {
  port: getServerPort(),
  fetch: app.fetch,
};
