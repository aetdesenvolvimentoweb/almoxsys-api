import { describe, expect, it } from "bun:test";
import { validarSenha } from "@core/domain/militar.entity";
import { ValidationError } from "@shared/errors";

describe("validarSenha (política OWASP A07)", () => {
  it("aceita senha com maiúscula, minúscula, número e especial", () => {
    expect(() => validarSenha("Senha@123")).not.toThrow();
  });

  it("rejeita senha curta demais", () => {
    expect(() => validarSenha("Ab@1")).toThrow(ValidationError);
  });

  it("rejeita senha sem maiúscula", () => {
    expect(() => validarSenha("senha@123")).toThrow(ValidationError);
  });

  it("rejeita senha sem minúscula", () => {
    expect(() => validarSenha("SENHA@123")).toThrow(ValidationError);
  });

  it("rejeita senha sem número", () => {
    expect(() => validarSenha("Senha@abc")).toThrow(ValidationError);
  });

  it("rejeita senha sem caractere especial", () => {
    expect(() => validarSenha("Senha1234")).toThrow(ValidationError);
  });

  it("não inclui o valor da senha nos detalhes do erro", () => {
    try {
      validarSenha("fraca");
      throw new Error("deveria ter lançado");
    } catch (e) {
      expect(e).toBeInstanceOf(ValidationError);
      const details = (e as ValidationError).details;
      expect(details).toEqual({ field: "senha" });
      expect(JSON.stringify(details)).not.toContain("fraca");
    }
  });
});
