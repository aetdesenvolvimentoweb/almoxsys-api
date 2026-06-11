import { describe, it, expect, beforeEach } from "bun:test";
import { BuscarPostoGraduacaoPorIdQuery } from "@core/application/queries/buscar-posto-graduacao-por-id.query";
import { CriarPostoGraduacaoCommand } from "@core/application/commands/criar-posto-graduacao.command";
import { PostoGraduacaoInMemoryRepository } from "@infra/adapters/posto-graduacao-in-memory.repository";
import { PostoGraduacaoNaoEncontradoError } from "@core/domain/errors/posto-graduacao.errors";

describe("BuscarPostoGraduacaoPorIdQuery", () => {
  let repository: PostoGraduacaoInMemoryRepository;
  let query: BuscarPostoGraduacaoPorIdQuery;
  let createCommand: CriarPostoGraduacaoCommand;

  beforeEach(() => {
    repository = new PostoGraduacaoInMemoryRepository();
    query = new BuscarPostoGraduacaoPorIdQuery(repository);
    createCommand = new CriarPostoGraduacaoCommand(repository);
  });

  it("encontra um posto pelo ID", async () => {
    const created = await createCommand.execute({
      abreviatura: "Cel",
      ordem: 1,
    });

    const result = await query.execute({ id: created.id });

    expect(result.id).toBe(created.id);
    expect(result.abreviatura).toBe("Cel");
    expect(result.ordem).toBe(1);
  });

  it("rejeita ID inexistente", async () => {
    expect(
      query.execute({
        id: "00000000-0000-0000-0000-000000000000",
      }),
    ).rejects.toThrow(PostoGraduacaoNaoEncontradoError);
  });

  it("encontra corretamente entre múltiplos postos", async () => {
    const id1 = (
      await createCommand.execute({ abreviatura: "Cel", ordem: 1 })
    ).id;
    const id2 = (
      await createCommand.execute({ abreviatura: "TC", ordem: 2 })
    ).id;
    const id3 = (
      await createCommand.execute({ abreviatura: "Maj", ordem: 3 })
    ).id;

    const result = await query.execute({ id: id2 });

    expect(result.id).toBe(id2);
    expect(result.abreviatura).toBe("TC");
  });
});
