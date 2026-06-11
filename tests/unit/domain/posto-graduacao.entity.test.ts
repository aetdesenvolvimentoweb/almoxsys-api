import { describe, it, expect } from "bun:test";
import { criarPostoGraduacao } from "@core/domain/posto-graduacao.entity";

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

  it("rejeita abreviatura vazia", () => {
    const input = { abreviatura: "", ordem: 1 };
    expect(() => criarPostoGraduacao(input)).toThrow(
      "Abreviatura não pode estar vazia",
    );
  });

  it("rejeita abreviatura com apenas espaços", () => {
    const input = { abreviatura: "   ", ordem: 1 };
    expect(() => criarPostoGraduacao(input)).toThrow(
      "Abreviatura não pode estar vazia",
    );
  });

  it("rejeita ordem zero", () => {
    const input = { abreviatura: "Cel", ordem: 0 };
    expect(() => criarPostoGraduacao(input)).toThrow(
      "Ordem deve ser um inteiro positivo",
    );
  });

  it("rejeita ordem negativa", () => {
    const input = { abreviatura: "Cel", ordem: -5 };
    expect(() => criarPostoGraduacao(input)).toThrow(
      "Ordem deve ser um inteiro positivo",
    );
  });

  it("rejeita ordem com decimais", () => {
    const input = { abreviatura: "Cel", ordem: 1.5 };
    expect(() => criarPostoGraduacao(input)).toThrow(
      "Ordem deve ser um inteiro positivo",
    );
  });
});
