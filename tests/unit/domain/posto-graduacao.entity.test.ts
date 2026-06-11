import { describe, it, expect } from "bun:test";
import { criarPostoGraduacao } from "@core/domain/posto-graduacao.entity";
import { ValidationError } from "@shared/errors";

describe("PostoGraduacao Entity", () => {
  it("cria um posto válido com UUID gerado", () => {
    const input = { abreviatura: "Cel", ordem: 1 };
    const posto = criarPostoGraduacao(input);

    expect(posto.abreviatura).toBe("Cel");
    expect(posto.ordem).toBe(1);
    expect(posto.id).toBeTruthy();
    expect(posto.id.length).toBe(36);
  });

  it("valida e trimma a abreviatura", () => {
    const input = { abreviatura: "  TC  ", ordem: 2 };
    const posto = criarPostoGraduacao(input);

    expect(posto.abreviatura).toBe("TC");
  });

  it("rejeita abreviatura vazia com ValidationError", () => {
    const input = { abreviatura: "", ordem: 1 };
    expect(() => criarPostoGraduacao(input)).toThrow(ValidationError);
  });

  it("rejeita abreviatura com apenas espaços", () => {
    const input = { abreviatura: "   ", ordem: 1 };
    expect(() => criarPostoGraduacao(input)).toThrow(ValidationError);
  });

  it("rejeita ordem zero com ValidationError", () => {
    const input = { abreviatura: "Cel", ordem: 0 };
    expect(() => criarPostoGraduacao(input)).toThrow(ValidationError);
  });

  it("rejeita ordem negativa com ValidationError", () => {
    const input = { abreviatura: "Cel", ordem: -5 };
    expect(() => criarPostoGraduacao(input)).toThrow(ValidationError);
  });

  it("rejeita ordem com decimais com ValidationError", () => {
    const input = { abreviatura: "Cel", ordem: 1.5 };
    expect(() => criarPostoGraduacao(input)).toThrow(ValidationError);
  });
});
