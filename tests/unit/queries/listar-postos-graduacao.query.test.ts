import { describe, it, expect, beforeEach } from "bun:test";
import { ListarPostosGraduacaoQuery } from "@core/application/queries/listar-postos-graduacao.query";
import { CriarPostoGraduacaoCommand } from "@core/application/commands/criar-posto-graduacao.command";
import { PostoGraduacaoInMemoryRepository } from "@infra/adapters/posto-graduacao-in-memory.repository";

describe("ListarPostosGraduacaoQuery", () => {
  let repository: PostoGraduacaoInMemoryRepository;
  let query: ListarPostosGraduacaoQuery;
  let createCommand: CriarPostoGraduacaoCommand;

  beforeEach(() => {
    repository = new PostoGraduacaoInMemoryRepository();
    query = new ListarPostosGraduacaoQuery(repository);
    createCommand = new CriarPostoGraduacaoCommand(repository);
  });

  it("retorna lista vazia quando nenhum posto existe", async () => {
    const result = await query.execute();

    expect(result).toEqual([]);
  });

  it("retorna lista com um posto", async () => {
    await createCommand.execute({ abreviatura: "Cel", ordem: 1 });

    const result = await query.execute();

    expect(result).toHaveLength(1);
    expect(result[0].abreviatura).toBe("Cel");
    expect(result[0].ordem).toBe(1);
  });

  it("retorna lista ordenada por ordem ascendente", async () => {
    await createCommand.execute({ abreviatura: "Cel", ordem: 5 });
    await createCommand.execute({ abreviatura: "TC", ordem: 2 });
    await createCommand.execute({ abreviatura: "Maj", ordem: 3 });
    await createCommand.execute({ abreviatura: "Cap", ordem: 1 });

    const result = await query.execute();

    expect(result).toHaveLength(4);
    expect(result[0].ordem).toBe(1);
    expect(result[1].ordem).toBe(2);
    expect(result[2].ordem).toBe(3);
    expect(result[3].ordem).toBe(5);
  });

  it("retorna lista correta mesmo quando inseridos fora de ordem", async () => {
    await createCommand.execute({ abreviatura: "Maj", ordem: 10 });
    await createCommand.execute({ abreviatura: "Cap", ordem: 1 });
    await createCommand.execute({ abreviatura: "Cel", ordem: 5 });

    const result = await query.execute();

    expect(result[0].abreviatura).toBe("Cap");
    expect(result[1].abreviatura).toBe("Cel");
    expect(result[2].abreviatura).toBe("Maj");
  });
});
