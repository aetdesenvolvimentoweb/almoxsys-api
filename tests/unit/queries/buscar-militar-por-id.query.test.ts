import { beforeEach, describe, expect, it } from "bun:test";
import { CriarMilitarCommand } from "@core/application/commands/criar-militar.command";
import { CriarPostoGraduacaoCommand } from "@core/application/commands/criar-posto-graduacao.command";
import { BuscarMilitarPorIdQuery } from "@core/application/queries/buscar-militar-por-id.query";
import { MilitarNaoEncontradoError } from "@core/domain/errors/militar.errors";
import { Perfil } from "@core/domain/militar.entity";
import { MilitarInMemoryRepository } from "@infra/adapters/militar-in-memory.repository";
import { PostoGraduacaoInMemoryRepository } from "@infra/adapters/posto-graduacao-in-memory.repository";

describe("BuscarMilitarPorIdQuery", () => {
  let militarRepository: MilitarInMemoryRepository;
  let postoGraduacaoRepository: PostoGraduacaoInMemoryRepository;
  let query: BuscarMilitarPorIdQuery;
  let createCommand: CriarMilitarCommand;
  let postoId: string;

  beforeEach(async () => {
    militarRepository = new MilitarInMemoryRepository();
    postoGraduacaoRepository = new PostoGraduacaoInMemoryRepository();
    query = new BuscarMilitarPorIdQuery(militarRepository);
    createCommand = new CriarMilitarCommand(militarRepository, postoGraduacaoRepository);

    const criarPosto = new CriarPostoGraduacaoCommand(postoGraduacaoRepository);
    postoId = (await criarPosto.execute({ abreviatura: "Cel", ordem: 1 })).id;
  });

  it("encontra um militar pelo ID", async () => {
    const created = await createCommand.execute({
      rg: 42,
      nome: "Pedro Alves",
      perfil: Perfil.Chefe,
      postoGraduacaoId: postoId,
    });

    const result = await query.execute({ id: created.id });

    expect(result.id).toBe(created.id);
    expect(result.rg).toBe(42);
    expect(result.nome).toBe("Pedro Alves");
    expect(result.perfil).toBe(Perfil.Chefe);
  });

  it("rejeita ID inexistente", async () => {
    expect(query.execute({ id: "00000000-0000-0000-0000-000000000000" })).rejects.toThrow(
      MilitarNaoEncontradoError
    );
  });

  it("encontra corretamente entre múltiplos militares", async () => {
    await createCommand.execute({
      rg: 1,
      nome: "Ana Lima",
      perfil: Perfil.ACA,
      postoGraduacaoId: postoId,
    });
    const id2 = (
      await createCommand.execute({
        rg: 2,
        nome: "Bruno Melo",
        perfil: Perfil.Almoxarife,
        postoGraduacaoId: postoId,
      })
    ).id;
    await createCommand.execute({
      rg: 3,
      nome: "Carla Nunes",
      perfil: Perfil.Chefe,
      postoGraduacaoId: postoId,
    });

    const result = await query.execute({ id: id2 });

    expect(result.id).toBe(id2);
    expect(result.nome).toBe("Bruno Melo");
  });
});
