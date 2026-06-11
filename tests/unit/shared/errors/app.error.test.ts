import { describe, it, expect } from "bun:test";
import { AppError, ValidationError, DuplicateKeyError, NotFoundError } from "@shared/errors";

describe("AppError", () => {
  it("serializa erro com code e message", () => {
    const error = new ValidationError("Validação falhou");
    const json = error.toJSON();

    expect(json.code).toBe("VALIDATION_ERROR");
    expect(json.message).toBe("Validação falhou");
  });

  it("inclui details em desenvolvimento", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    const error = new DuplicateKeyError("email", "test@example.com");
    const json = error.toJSON();

    expect(json.details).toBeDefined();

    process.env.NODE_ENV = originalEnv;
  });

  it("exclui details em produção", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    const error = new NotFoundError("Usuario", "123");
    const json = error.toJSON();

    expect(json.details).toBeUndefined();

    process.env.NODE_ENV = originalEnv;
  });

  it("ValidationError tem statusCode 400", () => {
    const error = new ValidationError("Campo inválido");
    expect(error.statusCode).toBe(400);
  });

  it("DuplicateKeyError tem statusCode 409", () => {
    const error = new DuplicateKeyError("cpf", "123.456.789-00");
    expect(error.statusCode).toBe(409);
  });

  it("NotFoundError tem statusCode 404", () => {
    const error = new NotFoundError("Produto", "abc-123");
    expect(error.statusCode).toBe(404);
  });
});
