import { describe, it, expect, beforeEach } from "bun:test";
import { ExcluirPostoGraduacaoCommand } from "@core/application/commands/excluir-posto-graduacao.command";
import { CriarPostoGraduacaoCommand } from "@core/application/commands/criar-posto-graduacao.command";
import { PostoGraduacaoInMemoryRepository } from "@infra/adapters/posto-graduacao-in-memory.repository";
import { PostoGraduacaoNaoEncontradoError } from "@core/domain/errors/posto-graduacao.errors";

describe("ExcluirPostoGraduacaoCommand", () => {
  let repository: PostoGraduacaoInMemoryRepository;
  let deleteCommand: ExcluirPostoGraduacaoCommand;
  let createCommand: CriarPostoGraduacaoCommand;

  beforeEach(() => {
    repository = new PostoGraduacaoInMemoryRepository();
    deleteCommand = new ExcluirPostoGraduacaoCommand(repository);
    createCommand = new CriarPostoGraduacaoCommand(repository);
  });

  it("exclui um posto com sucesso", async () => {
    const result = await createCommand.execute({
      abreviatura: "Cel",
      ordem: 1,
    });

    await deleteCommand.execute({ id: result.id });

    expect(
      repository.buscarPorId(result.id),
    ).rejects.toThrow(PostoGraduacaoNaoEncontradoError);
  });

  it("rejeita exclusão de ID inexistente", async () => {
    expect(
      deleteCommand.execute({
        id: "00000000-0000-0000-0000-000000000000",
      }),
    ).rejects.toThrow(PostoGraduacaoNaoEncontradoError);
  });

  it("permite reusar abreviatura e ordem após exclusão", async () => {
    const result = await createCommand.execute({
      abreviatura: "Cel",
      ordem: 1,
    });

    await deleteCommand.execute({ id: result.id });

    const novoResult = await createCommand.execute({
      abreviatura: "Cel",
      ordem: 1,
    });

    expect(novoResult.id).not.toBe(result.id);

    const novo = await repository.buscarPorId(novoResult.id);
    expect(novo.abreviatura).toBe("Cel");
    expect(novo.ordem).toBe(1);
  });

  it("exclui múltiplos postos independentemente", async () => {
    const id1 = (
      await createCommand.execute({ abreviatura: "Cel", ordem: 1 })
    ).id;
    const id2 = (
      await createCommand.execute({ abreviatura: "TC", ordem: 2 })
    ).id;

    await deleteCommand.execute({ id: id1 });

    const remaining = await repository.listar();
    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).toBe(id2);
  });
});
