import { swaggerUI } from "@hono/swagger-ui";
import { OpenAPIHono } from "@hono/zod-openapi";

const app = new OpenAPIHono();

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

export default {
  port: process.env.PORT ?? 3000,
  fetch: app.fetch,
};
