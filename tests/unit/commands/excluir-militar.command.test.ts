import { beforeEach, describe, expect, it } from "bun:test";
import { CriarMilitarCommand } from "@core/application/commands/criar-militar.command";
import { CriarPostoGraduacaoCommand } from "@core/application/commands/criar-posto-graduacao.command";
import { ExcluirMilitarCommand } from "@core/application/commands/excluir-militar.command";
import { MilitarNaoEncontradoError } from "@core/domain/errors/militar.errors";
import { Perfil } from "@core/domain/militar.entity";
import { MilitarInMemoryRepository } from "@infra/adapters/militar-in-memory.repository";
import { PostoGraduacaoInMemoryRepository } from "@infra/adapters/posto-graduacao-in-memory.repository";

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
    createCommand = new CriarMilitarCommand(militarRepository, postoGraduacaoRepository);

    const criarPosto = new CriarPostoGraduacaoCommand(postoGraduacaoRepository);
    postoId = (await criarPosto.execute({ abreviatura: "Cel", ordem: 1 })).id;
  });

  it("exclui um militar com sucesso", async () => {
    const result = await createCommand.execute({
      rg: 1,
      nome: "José Oliveira",
      perfil: Perfil.ACA,
      postoGraduacaoId: postoId,
    });

    await deleteCommand.execute({ id: result.id });

    expect(militarRepository.buscarPorId(result.id)).rejects.toThrow(MilitarNaoEncontradoError);
  });

  it("rejeita exclusão de ID inexistente", async () => {
    expect(deleteCommand.execute({ id: "00000000-0000-0000-0000-000000000000" })).rejects.toThrow(
      MilitarNaoEncontradoError
    );
  });

  it("permite reusar RG após exclusão", async () => {
    const result = await createCommand.execute({
      rg: 50,
      nome: "Carlos Lima",
      perfil: Perfil.Almoxarife,
      postoGraduacaoId: postoId,
    });

    await deleteCommand.execute({ id: result.id });

    const novoResult = await createCommand.execute({
      rg: 50,
      nome: "Carlos Lima",
      perfil: Perfil.Almoxarife,
      postoGraduacaoId: postoId,
    });

    expect(novoResult.id).not.toBe(result.id);
  });

  it("exclui militares independentemente", async () => {
    const id1 = (
      await createCommand.execute({
        rg: 1,
        nome: "Ana Souza",
        perfil: Perfil.Chefe,
        postoGraduacaoId: postoId,
      })
    ).id;
    const id2 = (
      await createCommand.execute({
        rg: 2,
        nome: "Bruno Costa",
        perfil: Perfil.ACA,
        postoGraduacaoId: postoId,
      })
    ).id;

    await deleteCommand.execute({ id: id1 });

    const remaining = await militarRepository.listar();
    expect(remaining).toHaveLength(1);
    expect(remaining.at(0)?.id).toBe(id2);
  });
});
