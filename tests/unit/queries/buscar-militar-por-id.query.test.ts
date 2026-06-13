import { beforeEach, describe, expect, it } from "bun:test";
import { CriarMilitarCommand } from "@core/application/commands/criar-militar.command";
import { CriarPostoGraduacaoCommand } from "@core/application/commands/criar-posto-graduacao.command";
import { BuscarMilitarPorIdQuery } from "@core/application/queries/buscar-militar-por-id.query";
import type { Ator } from "@core/domain/auth/ator";
import { MilitarNaoEncontradoError } from "@core/domain/errors/militar.errors";
import { Perfil } from "@core/domain/militar.entity";
import type { IHasher } from "@core/ports/hasher.port";
import { MilitarInMemoryRepository } from "@infra/adapters/militar-in-memory.repository";
import { PostoGraduacaoInMemoryRepository } from "@infra/adapters/posto-graduacao-in-memory.repository";

const mockHasher: IHasher = {
  hash: async (plain) => `hashed:${plain}`,
  verify: async (plain, hash) => hash === `hashed:${plain}`,
};

const admin: Ator = { id: "admin-id", perfil: Perfil.Administrador };

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
    createCommand = new CriarMilitarCommand(
      militarRepository,
      postoGraduacaoRepository,
      mockHasher
    );

    const criarPosto = new CriarPostoGraduacaoCommand(postoGraduacaoRepository);
    postoId = (await criarPosto.execute({ abreviatura: "Cel", ordem: 1 })).id;
  });

  it("encontra um militar pelo ID", async () => {
    const created = await createCommand.execute({
      ator: admin,
      rg: 42,
      nome: "Pedro Alves",
      email: "pedro.alves@cbm.br",
      perfil: Perfil.Chefe,
      postoGraduacaoId: postoId,
      senha: "Senha@123",
    });

    const result = await query.execute({ id: created.id });

    expect(result.id).toBe(created.id);
    expect(result.rg).toBe(42);
    expect(result.nome).toBe("Pedro Alves");
    expect(result.email).toBe("pedro.alves@cbm.br");
    expect(result.perfil).toBe(Perfil.Chefe);
  });

  it("não expõe a senha na projeção de leitura", async () => {
    const created = await createCommand.execute({
      ator: admin,
      rg: 7,
      nome: "Ivo Mendes",
      email: "ivo.mendes@cbm.br",
      perfil: Perfil.ACA,
      postoGraduacaoId: postoId,
      senha: "Senha@123",
    });

    const result = await query.execute({ id: created.id });

    expect(result).not.toHaveProperty("senha");
  });

  it("rejeita ID inexistente", () => {
    expect(query.execute({ id: "00000000-0000-0000-0000-000000000000" })).rejects.toThrow(
      MilitarNaoEncontradoError
    );
  });

  it("encontra corretamente entre múltiplos militares", async () => {
    await createCommand.execute({
      ator: admin,
      rg: 1,
      nome: "Ana Lima",
      email: "ana.lima@cbm.br",
      perfil: Perfil.ACA,
      postoGraduacaoId: postoId,
      senha: "Senha@123",
    });
    const id2 = (
      await createCommand.execute({
        ator: admin,
        rg: 2,
        nome: "Bruno Melo",
        email: "bruno.melo@cbm.br",
        perfil: Perfil.Almoxarife,
        postoGraduacaoId: postoId,
        senha: "Senha@123",
      })
    ).id;
    await createCommand.execute({
      ator: admin,
      rg: 3,
      nome: "Carla Nunes",
      email: "carla.nunes@cbm.br",
      perfil: Perfil.Chefe,
      postoGraduacaoId: postoId,
      senha: "Senha@123",
    });

    const result = await query.execute({ id: id2 });

    expect(result.id).toBe(id2);
    expect(result.nome).toBe("Bruno Melo");
  });
});
