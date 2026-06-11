import { beforeEach, describe, expect, it } from "bun:test";
import { AtualizarPostoGraduacaoCommand } from "@core/application/commands/atualizar-posto-graduacao.command";
import { CriarPostoGraduacaoCommand } from "@core/application/commands/criar-posto-graduacao.command";
import {
  AbreviaturaJaExisteError,
  OrdemJaExisteError,
  PostoGraduacaoNaoEncontradoError,
} from "@core/domain/errors/posto-graduacao.errors";
import { PostoGraduacaoInMemoryRepository } from "@infra/adapters/posto-graduacao-in-memory.repository";

describe("AtualizarPostoGraduacaoCommand", () => {
  let repository: PostoGraduacaoInMemoryRepository;
  let updateCommand: AtualizarPostoGraduacaoCommand;
  let createCommand: CriarPostoGraduacaoCommand;
  let postoId: string;

  beforeEach(async () => {
    repository = new PostoGraduacaoInMemoryRepository();
    updateCommand = new AtualizarPostoGraduacaoCommand(repository);
    createCommand = new CriarPostoGraduacaoCommand(repository);

    const result = await createCommand.execute({
      abreviatura: "Cel",
      ordem: 1,
    });
    postoId = result.id;
  });

  it("atualiza abreviatura com sucesso", async () => {
    await updateCommand.execute({ id: postoId, abreviatura: "TC" });

    const atualizado = await repository.buscarPorId(postoId);
    expect(atualizado.abreviatura).toBe("TC");
    expect(atualizado.ordem).toBe(1);
  });

  it("atualiza ordem com sucesso", async () => {
    await updateCommand.execute({ id: postoId, ordem: 5 });

    const atualizado = await repository.buscarPorId(postoId);
    expect(atualizado.abreviatura).toBe("Cel");
    expect(atualizado.ordem).toBe(5);
  });

  it("atualiza ambos os campos", async () => {
    await updateCommand.execute({
      id: postoId,
      abreviatura: "Maj",
      ordem: 3,
    });

    const atualizado = await repository.buscarPorId(postoId);
    expect(atualizado.abreviatura).toBe("Maj");
    expect(atualizado.ordem).toBe(3);
  });

  it("rejeita atualização de ID inexistente", async () => {
    expect(
      updateCommand.execute({
        id: "00000000-0000-0000-0000-000000000000",
        abreviatura: "Cap",
      })
    ).rejects.toThrow(PostoGraduacaoNaoEncontradoError);
  });

  it("rejeita abreviatura duplicada em outro posto", async () => {
    await createCommand.execute({ abreviatura: "TC", ordem: 2 });

    expect(updateCommand.execute({ id: postoId, abreviatura: "TC" })).rejects.toThrow(
      AbreviaturaJaExisteError
    );
  });

  it("rejeita ordem duplicada em outro posto", async () => {
    await createCommand.execute({ abreviatura: "TC", ordem: 2 });

    expect(updateCommand.execute({ id: postoId, ordem: 2 })).rejects.toThrow(OrdemJaExisteError);
  });

  it("permite manter mesma abreviatura e ordem do próprio posto", async () => {
    await updateCommand.execute({
      id: postoId,
      abreviatura: "Cel",
      ordem: 1,
    });

    const atualizado = await repository.buscarPorId(postoId);
    expect(atualizado.abreviatura).toBe("Cel");
    expect(atualizado.ordem).toBe(1);
  });
});
