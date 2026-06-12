import { beforeEach, describe, expect, it } from "bun:test";
import { AtualizarMilitarCommand } from "@core/application/commands/atualizar-militar.command";
import { CriarMilitarCommand } from "@core/application/commands/criar-militar.command";
import { CriarPostoGraduacaoCommand } from "@core/application/commands/criar-posto-graduacao.command";
import type { Ator } from "@core/domain/auth/ator";
import { MilitarNaoEncontradoError, RgJaExisteError } from "@core/domain/errors/militar.errors";
import { PostoGraduacaoNaoEncontradoError } from "@core/domain/errors/posto-graduacao.errors";
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

describe("AtualizarMilitarCommand", () => {
  let militarRepository: MilitarInMemoryRepository;
  let postoGraduacaoRepository: PostoGraduacaoInMemoryRepository;
  let updateCommand: AtualizarMilitarCommand;
  let createCommand: CriarMilitarCommand;
  let postoId: string;
  let militarId: string;

  beforeEach(async () => {
    militarRepository = new MilitarInMemoryRepository();
    postoGraduacaoRepository = new PostoGraduacaoInMemoryRepository();
    updateCommand = new AtualizarMilitarCommand(
      militarRepository,
      postoGraduacaoRepository,
      mockHasher
    );
    createCommand = new CriarMilitarCommand(
      militarRepository,
      postoGraduacaoRepository,
      mockHasher
    );

    const criarPosto = new CriarPostoGraduacaoCommand(postoGraduacaoRepository);
    postoId = (await criarPosto.execute({ abreviatura: "Cel", ordem: 1 })).id;

    militarId = (
      await createCommand.execute({
        ator: admin,
        rg: 100,
        nome: "João Silva",
        perfil: Perfil.Almoxarife,
        postoGraduacaoId: postoId,
        senha: "Senha@123",
      })
    ).id;
  });

  it("atualiza nome com sucesso", async () => {
    await updateCommand.execute({ ator: admin, id: militarId, nome: "João Pedro Silva" });

    const atualizado = await militarRepository.buscarPorId(militarId);
    expect(atualizado.nome).toBe("João Pedro Silva");
    expect(atualizado.rg).toBe(100);
  });

  it("atualiza rg com sucesso", async () => {
    await updateCommand.execute({ ator: admin, id: militarId, rg: 200 });

    const atualizado = await militarRepository.buscarPorId(militarId);
    expect(atualizado.rg).toBe(200);
  });

  it("atualiza perfil com sucesso", async () => {
    await updateCommand.execute({ ator: admin, id: militarId, perfil: Perfil.Chefe });

    const atualizado = await militarRepository.buscarPorId(militarId);
    expect(atualizado.perfil).toBe(Perfil.Chefe);
  });

  it("atualiza postoGraduacaoId com sucesso", async () => {
    const criarPosto = new CriarPostoGraduacaoCommand(postoGraduacaoRepository);
    const novoPostoId = (await criarPosto.execute({ abreviatura: "TC", ordem: 2 })).id;

    await updateCommand.execute({ ator: admin, id: militarId, postoGraduacaoId: novoPostoId });

    const atualizado = await militarRepository.buscarPorId(militarId);
    expect(atualizado.postoGraduacaoId).toBe(novoPostoId);
  });

  it("atualiza senha e armazena o hash", async () => {
    await updateCommand.execute({ ator: admin, id: militarId, senha: "NovaSenha@456" });

    const atualizado = await militarRepository.buscarPorId(militarId);
    expect(atualizado.senha).toBe("hashed:NovaSenha@456");
    expect(atualizado.senha).not.toBe("NovaSenha@456");
  });

  it("não altera a senha quando não informada na atualização", async () => {
    const antes = await militarRepository.buscarPorId(militarId);
    await updateCommand.execute({ ator: admin, id: militarId, nome: "João Pedro Silva" });

    const depois = await militarRepository.buscarPorId(militarId);
    expect(depois.senha).toBe(antes.senha);
  });

  it("Chefe não pode promover militar a Administrador", () => {
    const chefe: Ator = { id: "chefe-id", perfil: Perfil.Chefe };
    expect(
      updateCommand.execute({ ator: chefe, id: militarId, perfil: Perfil.Administrador })
    ).rejects.toThrow(ForbiddenError);
  });

  it("ACA não pode atualizar militares", () => {
    const aca: Ator = { id: "aca-id", perfil: Perfil.ACA };
    expect(updateCommand.execute({ ator: aca, id: militarId, nome: "Hack" })).rejects.toThrow(
      ForbiddenError
    );
  });

  it("rejeita atualização de ID inexistente", () => {
    expect(
      updateCommand.execute({
        ator: admin,
        id: "00000000-0000-0000-0000-000000000000",
        nome: "Novo Nome",
      })
    ).rejects.toThrow(MilitarNaoEncontradoError);
  });

  it("rejeita RG duplicado em outro militar", async () => {
    await createCommand.execute({
      ator: admin,
      rg: 999,
      nome: "Maria Santos",
      perfil: Perfil.ACA,
      postoGraduacaoId: postoId,
      senha: "Senha@123",
    });

    expect(updateCommand.execute({ ator: admin, id: militarId, rg: 999 })).rejects.toThrow(
      RgJaExisteError
    );
  });

  it("permite manter o mesmo RG do próprio militar", async () => {
    await updateCommand.execute({ ator: admin, id: militarId, rg: 100 });

    const atualizado = await militarRepository.buscarPorId(militarId);
    expect(atualizado.rg).toBe(100);
  });

  it("rejeita postoGraduacaoId inexistente na atualização", () => {
    expect(
      updateCommand.execute({
        ator: admin,
        id: militarId,
        postoGraduacaoId: "00000000-0000-0000-0000-000000000000",
      })
    ).rejects.toThrow(PostoGraduacaoNaoEncontradoError);
  });
});
