import { beforeEach, describe, expect, it } from "bun:test";
import { CriarMilitarCommand } from "@core/application/commands/criar-militar.command";
import { CriarPostoGraduacaoCommand } from "@core/application/commands/criar-posto-graduacao.command";
import { ListarMilitaresQuery } from "@core/application/queries/listar-militares.query";
import { Perfil } from "@core/domain/militar.entity";
import type { IHasher } from "@core/ports/hasher.port";
import { MilitarInMemoryRepository } from "@infra/adapters/militar-in-memory.repository";
import { PostoGraduacaoInMemoryRepository } from "@infra/adapters/posto-graduacao-in-memory.repository";

const mockHasher: IHasher = {
  hash: async (plain) => `hashed:${plain}`,
  verify: async (plain, hash) => hash === `hashed:${plain}`,
};

describe("ListarMilitaresQuery", () => {
  let militarRepository: MilitarInMemoryRepository;
  let postoGraduacaoRepository: PostoGraduacaoInMemoryRepository;
  let query: ListarMilitaresQuery;
  let createCommand: CriarMilitarCommand;
  let postoId: string;

  beforeEach(async () => {
    militarRepository = new MilitarInMemoryRepository();
    postoGraduacaoRepository = new PostoGraduacaoInMemoryRepository();
    query = new ListarMilitaresQuery(militarRepository);
    createCommand = new CriarMilitarCommand(
      militarRepository,
      postoGraduacaoRepository,
      mockHasher
    );

    const criarPosto = new CriarPostoGraduacaoCommand(postoGraduacaoRepository);
    postoId = (await criarPosto.execute({ abreviatura: "Cel", ordem: 1 })).id;
  });

  it("retorna lista vazia quando nenhum militar existe", async () => {
    const result = await query.execute();
    expect(result).toEqual([]);
  });

  it("retorna lista com um militar", async () => {
    await createCommand.execute({
      rg: 10,
      nome: "João Silva",
      perfil: Perfil.ACA,
      postoGraduacaoId: postoId,
      senha: "Senha@123",
    });

    const result = await query.execute();

    expect(result).toHaveLength(1);
    expect(result.at(0)?.rg).toBe(10);
    expect(result.at(0)?.nome).toBe("João Silva");
  });

  it("não expõe a senha em nenhum item da lista", async () => {
    await createCommand.execute({
      rg: 10,
      nome: "João Silva",
      perfil: Perfil.ACA,
      postoGraduacaoId: postoId,
      senha: "Senha@123",
    });

    const result = await query.execute();

    expect(result.at(0)).not.toHaveProperty("senha");
  });

  it("retorna lista ordenada por RG ascendente", async () => {
    await createCommand.execute({
      rg: 50,
      nome: "Carlos Lima",
      perfil: Perfil.ACA,
      postoGraduacaoId: postoId,
      senha: "Senha@123",
    });
    await createCommand.execute({
      rg: 10,
      nome: "Ana Costa",
      perfil: Perfil.Almoxarife,
      postoGraduacaoId: postoId,
      senha: "Senha@123",
    });
    await createCommand.execute({
      rg: 30,
      nome: "Bruno Souza",
      perfil: Perfil.Chefe,
      postoGraduacaoId: postoId,
      senha: "Senha@123",
    });

    const result = await query.execute();

    expect(result).toHaveLength(3);
    expect(result.at(0)?.rg).toBe(10);
    expect(result.at(1)?.rg).toBe(30);
    expect(result.at(2)?.rg).toBe(50);
  });

  it("retorna ordenação correta mesmo inserindo fora de ordem", async () => {
    await createCommand.execute({
      rg: 99999,
      nome: "Zé Pereira",
      perfil: Perfil.ACA,
      postoGraduacaoId: postoId,
      senha: "Senha@123",
    });
    await createCommand.execute({
      rg: 1,
      nome: "Abel Ramos",
      perfil: Perfil.Administrador,
      postoGraduacaoId: postoId,
      senha: "Senha@123",
    });

    const result = await query.execute();

    expect(result.at(0)?.nome).toBe("Abel Ramos");
    expect(result.at(1)?.nome).toBe("Zé Pereira");
  });
});
