import { beforeEach, describe, expect, it } from "bun:test";
import { CriarMilitarCommand } from "@core/application/commands/criar-militar.command";
import { CriarPostoGraduacaoCommand } from "@core/application/commands/criar-posto-graduacao.command";
import { ExcluirMilitarCommand } from "@core/application/commands/excluir-militar.command";
import type { Ator } from "@core/domain/auth/ator";
import { MilitarNaoEncontradoError } from "@core/domain/errors/militar.errors";
import { Perfil } from "@core/domain/militar.entity";
import type { IHasher } from "@core/ports/hasher.port";
import { MilitarInMemoryRepository } from "@infra/adapters/militar-in-memory.repository";
import { PostoGraduacaoInMemoryRepository } from "@infra/adapters/posto-graduacao-in-memory.repository";
import { ForbiddenError } from "@shared/errors";

const mockHasher: IHasher = {
  hash: async (plain) => `hashed:${plain}`,
  verify: async (plain, hash) => hash === `hashed:${plain}`,
};

const admin: Ator = { id: "admin-id", perfil: Perfil.Administrador };

describe("ExcluirMilitarCommand", () => {
  let militarRepository: MilitarInMemoryRepository;
  let postoGraduacaoRepository: PostoGraduacaoInMemoryRepository;
  let deleteCommand: ExcluirMilitarCommand;
  let createCommand: CriarMilitarCommand;
  let postoId: string;

  beforeEach(async () => {
    militarRepository = new MilitarInMemoryRepository();
    postoGraduacaoRepository = new PostoGraduacaoInMemoryRepository();
    deleteCommand = new ExcluirMilitarCommand(militarRepository);
    createCommand = new CriarMilitarCommand(
      militarRepository,
      postoGraduacaoRepository,
      mockHasher
    );

    const criarPosto = new CriarPostoGraduacaoCommand(postoGraduacaoRepository);
    postoId = (await criarPosto.execute({ abreviatura: "Cel", ordem: 1 })).id;
  });

  it("exclui um militar com sucesso", async () => {
    const result = await createCommand.execute({
      ator: admin,
      rg: 1,
      nome: "José Oliveira",
      perfil: Perfil.ACA,
      postoGraduacaoId: postoId,
      senha: "Senha@123",
    });

    await deleteCommand.execute({ ator: admin, id: result.id });

    expect(militarRepository.buscarPorId(result.id)).rejects.toThrow(MilitarNaoEncontradoError);
  });

  it("rejeita exclusão de ID inexistente", () => {
    expect(
      deleteCommand.execute({ ator: admin, id: "00000000-0000-0000-0000-000000000000" })
    ).rejects.toThrow(MilitarNaoEncontradoError);
  });

  it("Chefe não pode excluir um Administrador", async () => {
    const alvo = await createCommand.execute({
      ator: admin,
      rg: 5,
      nome: "Admin Alvo",
      perfil: Perfil.Administrador,
      postoGraduacaoId: postoId,
      senha: "Senha@123",
    });

    const chefe: Ator = { id: "chefe-id", perfil: Perfil.Chefe };
    expect(deleteCommand.execute({ ator: chefe, id: alvo.id })).rejects.toThrow(ForbiddenError);
  });

  it("permite reusar RG após exclusão", async () => {
    const result = await createCommand.execute({
      ator: admin,
      rg: 50,
      nome: "Carlos Lima",
      perfil: Perfil.Almoxarife,
      postoGraduacaoId: postoId,
      senha: "Senha@123",
    });

    await deleteCommand.execute({ ator: admin, id: result.id });

    const novoResult = await createCommand.execute({
      ator: admin,
      rg: 50,
      nome: "Carlos Lima",
      perfil: Perfil.Almoxarife,
      postoGraduacaoId: postoId,
      senha: "Senha@123",
    });

    expect(novoResult.id).not.toBe(result.id);
  });

  it("exclui militares independentemente", async () => {
    const id1 = (
      await createCommand.execute({
        ator: admin,
        rg: 1,
        nome: "Ana Souza",
        perfil: Perfil.Chefe,
        postoGraduacaoId: postoId,
        senha: "Senha@123",
      })
    ).id;
    const id2 = (
      await createCommand.execute({
        ator: admin,
        rg: 2,
        nome: "Bruno Costa",
        perfil: Perfil.ACA,
        postoGraduacaoId: postoId,
        senha: "Senha@123",
      })
    ).id;

    await deleteCommand.execute({ ator: admin, id: id1 });

    const remaining = await militarRepository.listar();
    expect(remaining).toHaveLength(1);
    expect(remaining.at(0)?.id).toBe(id2);
  });
});
