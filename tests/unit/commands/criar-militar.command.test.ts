import { beforeEach, describe, expect, it } from "bun:test";
import { CriarMilitarCommand } from "@core/application/commands/criar-militar.command";
import { CriarPostoGraduacaoCommand } from "@core/application/commands/criar-posto-graduacao.command";
import { RgJaExisteError } from "@core/domain/errors/militar.errors";
import { PostoGraduacaoNaoEncontradoError } from "@core/domain/errors/posto-graduacao.errors";
import { Perfil } from "@core/domain/militar.entity";
import { MilitarInMemoryRepository } from "@infra/adapters/militar-in-memory.repository";
import { PostoGraduacaoInMemoryRepository } from "@infra/adapters/posto-graduacao-in-memory.repository";

describe("CriarMilitarCommand", () => {
  let militarRepository: MilitarInMemoryRepository;
  let postoGraduacaoRepository: PostoGraduacaoInMemoryRepository;
  let command: CriarMilitarCommand;
  let postoId: string;

  beforeEach(async () => {
    militarRepository = new MilitarInMemoryRepository();
    postoGraduacaoRepository = new PostoGraduacaoInMemoryRepository();
    command = new CriarMilitarCommand(militarRepository, postoGraduacaoRepository);

    const criarPosto = new CriarPostoGraduacaoCommand(postoGraduacaoRepository);
    postoId = (await criarPosto.execute({ abreviatura: "Cel", ordem: 1 })).id;
  });

  it("cria um militar com sucesso", async () => {
    const result = await command.execute({
      rg: 12345,
      nome: "João Silva",
      perfil: Perfil.Almoxarife,
      postoGraduacaoId: postoId,
    });

    expect(result.id).toBeTruthy();

    const criado = await militarRepository.buscarPorId(result.id);
    expect(criado.rg).toBe(12345);
    expect(criado.nome).toBe("João Silva");
    expect(criado.perfil).toBe(Perfil.Almoxarife);
    expect(criado.postoGraduacaoId).toBe(postoId);
  });

  it("rejeita postoGraduacaoId inexistente", async () => {
    expect(
      command.execute({
        rg: 1,
        nome: "Carlos Souza",
        perfil: Perfil.ACA,
        postoGraduacaoId: "00000000-0000-0000-0000-000000000000",
      })
    ).rejects.toThrow(PostoGraduacaoNaoEncontradoError);
  });

  it("rejeita RG duplicado", async () => {
    await command.execute({
      rg: 100,
      nome: "Maria Santos",
      perfil: Perfil.Chefe,
      postoGraduacaoId: postoId,
    });

    expect(
      command.execute({
        rg: 100,
        nome: "Pedro Lima",
        perfil: Perfil.ACA,
        postoGraduacaoId: postoId,
      })
    ).rejects.toThrow(RgJaExisteError);
  });

  it("cria múltiplos militares com RGs distintos", async () => {
    const r1 = await command.execute({
      rg: 1,
      nome: "Ana Costa",
      perfil: Perfil.Administrador,
      postoGraduacaoId: postoId,
    });
    const r2 = await command.execute({
      rg: 2,
      nome: "Bruno Ferreira",
      perfil: Perfil.Chefe,
      postoGraduacaoId: postoId,
    });

    expect(r1.id).not.toBe(r2.id);
    expect(await militarRepository.listar()).toHaveLength(2);
  });

  it("remove espaços extras do nome", async () => {
    const result = await command.execute({
      rg: 50,
      nome: "  Rui Barbosa  ",
      perfil: Perfil.Almoxarife,
      postoGraduacaoId: postoId,
    });

    const criado = await militarRepository.buscarPorId(result.id);
    expect(criado.nome).toBe("Rui Barbosa");
  });
});
