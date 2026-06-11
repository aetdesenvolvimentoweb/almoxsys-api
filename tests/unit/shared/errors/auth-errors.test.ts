import { describe, expect, it } from "bun:test";
import { ForbiddenError, UnauthorizedError } from "@shared/errors";

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
