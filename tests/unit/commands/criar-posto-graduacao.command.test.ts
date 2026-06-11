import { beforeEach, describe, expect, it } from "bun:test";
import { CriarPostoGraduacaoCommand } from "@core/application/commands/criar-posto-graduacao.command";
import {
  AbreviaturaJaExisteError,
  OrdemJaExisteError,
} from "@core/domain/errors/posto-graduacao.errors";
import { PostoGraduacaoInMemoryRepository } from "@infra/adapters/posto-graduacao-in-memory.repository";

describe("CriarPostoGraduacaoCommand", () => {
  let repository: PostoGraduacaoInMemoryRepository;
  let command: CriarPostoGraduacaoCommand;

  beforeEach(() => {
    repository = new PostoGraduacaoInMemoryRepository();
    command = new CriarPostoGraduacaoCommand(repository);
  });

  it("cria um novo posto com sucesso", async () => {
    const result = await command.execute({
      abreviatura: "Cel",
      ordem: 1,
    });

    expect(result.id).toBeTruthy();

    const criado = await repository.buscarPorId(result.id);
    expect(criado.abreviatura).toBe("Cel");
    expect(criado.ordem).toBe(1);
  });

  it("rejeita abreviatura duplicada", async () => {
    await command.execute({ abreviatura: "Cel", ordem: 1 });

    expect(command.execute({ abreviatura: "Cel", ordem: 2 })).rejects.toThrow(
      AbreviaturaJaExisteError
    );
  });

  it("rejeita ordem duplicada", async () => {
    await command.execute({ abreviatura: "Cel", ordem: 1 });

    expect(command.execute({ abreviatura: "TC", ordem: 1 })).rejects.toThrow(OrdemJaExisteError);
  });

  it("cria múltiplos postos com dados diferentes", async () => {
    const result1 = await command.execute({ abreviatura: "Cel", ordem: 1 });
    const result2 = await command.execute({ abreviatura: "TC", ordem: 2 });
    const result3 = await command.execute({ abreviatura: "Maj", ordem: 3 });

    expect(result1.id).not.toBe(result2.id);
    expect(result2.id).not.toBe(result3.id);

    const all = await repository.listar();
    expect(all).toHaveLength(3);
  });
});
