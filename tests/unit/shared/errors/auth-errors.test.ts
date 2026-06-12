import { describe, expect, it } from "bun:test";
import { ForbiddenError, TooManyRequestsError, UnauthorizedError } from "@shared/errors";

describe("ForbiddenError", () => {
  it("usa statusCode 403, code FORBIDDEN e mensagem default", () => {
    const error = new ForbiddenError();

    expect(error.statusCode).toBe(403);
    expect(error.code).toBe("FORBIDDEN");
    expect(error.message).toBe("Você não tem permissão para acessar este recurso");
  });

  it("propaga mensagem custom", () => {
    const error = new ForbiddenError("Acesso negado ao almoxarifado");

    expect(error.message).toBe("Acesso negado ao almoxarifado");
  });
});

describe("UnauthorizedError", () => {
  it("usa statusCode 401, code UNAUTHORIZED e mensagem default", () => {
    const error = new UnauthorizedError();

    expect(error.statusCode).toBe(401);
    expect(error.code).toBe("UNAUTHORIZED");
    expect(error.message).toBe("Autenticação requerida");
  });

  it("propaga mensagem custom", () => {
    const error = new UnauthorizedError("Token expirado");

    expect(error.message).toBe("Token expirado");
  });
});

describe("TooManyRequestsError", () => {
  it("usa statusCode 429, code TOO_MANY_REQUESTS e mensagem default", () => {
    const error = new TooManyRequestsError();

    expect(error.statusCode).toBe(429);
    expect(error.code).toBe("TOO_MANY_REQUESTS");
    expect(error.message).toBe("Muitas requisições. Tente novamente mais tarde.");
  });

  it("propaga mensagem custom", () => {
    const error = new TooManyRequestsError("Limite de login excedido");

    expect(error.message).toBe("Limite de login excedido");
  });
});
