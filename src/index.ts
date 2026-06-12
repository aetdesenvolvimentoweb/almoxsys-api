import { swaggerUI } from "@hono/swagger-ui";
import { OpenAPIHono } from "@hono/zod-openapi";
import { PostoGraduacaoInMemoryRepository } from "@infra/adapters/posto-graduacao-in-memory.repository";
import { logger } from "@infra/adapters/pino-logger.adapter";
import { errorHandlerMiddleware } from "@infra/http/error-handler.middleware";
import { createPostoGraduacaoRoutes } from "@infra/http/v1/posto-graduacao.routes";
import { getServerPort } from "@shared/config";

const app = new OpenAPIHono();

app.use(errorHandlerMiddleware);

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
const postoGraduacaoRoutes = createPostoGraduacaoRoutes(postoGraduacaoRepository, logger);

app.route("/api/v1", postoGraduacaoRoutes);

export default {
  port: getServerPort(),
  fetch: app.fetch,
};
