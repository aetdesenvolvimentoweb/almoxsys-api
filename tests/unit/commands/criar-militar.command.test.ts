import { beforeEach, describe, expect, it } from "bun:test";
import { CriarMilitarCommand } from "@core/application/commands/criar-militar.command";
import { CriarPostoGraduacaoCommand } from "@core/application/commands/criar-posto-graduacao.command";
import type { Ator } from "@core/domain/auth/ator";
import { EmailJaExisteError, RgJaExisteError } from "@core/domain/errors/militar.errors";
import { PostoGraduacaoNaoEncontradoError } from "@core/domain/errors/posto-graduacao.errors";
import { Perfil } from "@core/domain/militar.entity";
import type { IHasher } from "@core/ports/hasher.port";
import { MilitarInMemoryRepository } from "@infra/adapters/militar-in-memory.repository";
import { PostoGraduacaoInMemoryRepository } from "@infra/adapters/posto-graduacao-in-memory.repository";
import { ForbiddenError, ValidationError } from "@shared/errors";

const mockHasher: IHasher = {
  hash: async (plain) => `hashed:${plain}`,
  verify: async (plain, hash) => hash === `hashed:${plain}`,
};

const admin: Ator = { id: "admin-id", perfil: Perfil.Administrador };

describe("CriarMilitarCommand", () => {
  let militarRepository: MilitarInMemoryRepository;
  let postoGraduacaoRepository: PostoGraduacaoInMemoryRepository;
  let command: CriarMilitarCommand;
  let postoId: string;

  beforeEach(async () => {
    militarRepository = new MilitarInMemoryRepository();
    postoGraduacaoRepository = new PostoGraduacaoInMemoryRepository();
    command = new CriarMilitarCommand(militarRepository, postoGraduacaoRepository, mockHasher);

    const criarPosto = new CriarPostoGraduacaoCommand(postoGraduacaoRepository);
    postoId = (await criarPosto.execute({ abreviatura: "Cel", ordem: 1 })).id;
  });

  it("cria um militar com sucesso", async () => {
    const result = await command.execute({
      ator: admin,
      rg: 12345,
      nome: "João Silva",
      email: "joao.silva@cbm.br",
      perfil: Perfil.Almoxarife,
      postoGraduacaoId: postoId,
      senha: "Senha@123",
    });

    expect(result.id).toBeTruthy();

    const criado = await militarRepository.buscarPorId(result.id);
    expect(criado.rg).toBe(12345);
    expect(criado.nome).toBe("João Silva");
    expect(criado.email).toBe("joao.silva@cbm.br");
    expect(criado.perfil).toBe(Perfil.Almoxarife);
    expect(criado.postoGraduacaoId).toBe(postoId);
  });

  it("normaliza o e-mail (trim + minúsculas)", async () => {
    const result = await command.execute({
      ator: admin,
      rg: 77,
      nome: "Tereza Lima",
      email: "  Tereza.LIMA@CBM.br  ",
      perfil: Perfil.ACA,
      postoGraduacaoId: postoId,
      senha: "Senha@123",
    });

    const criado = await militarRepository.buscarPorId(result.id);
    expect(criado.email).toBe("tereza.lima@cbm.br");
  });

  it("rejeita e-mail com formato inválido", () => {
    expect(
      command.execute({
        ator: admin,
        rg: 78,
        nome: "Email Ruim",
        email: "nao-eh-email",
        perfil: Perfil.ACA,
        postoGraduacaoId: postoId,
        senha: "Senha@123",
      })
    ).rejects.toThrow(ValidationError);
  });

  it("armazena a senha como hash, não como texto puro", async () => {
    const result = await command.execute({
      ator: admin,
      rg: 1,
      nome: "João Silva",
      email: "joao@cbm.br",
      perfil: Perfil.Almoxarife,
      postoGraduacaoId: postoId,
      senha: "Senha@123",
    });

    const criado = await militarRepository.buscarPorId(result.id);
    expect(criado.senha).toBe("hashed:Senha@123");
    expect(criado.senha).not.toBe("Senha@123");
  });

  it("Chefe não pode criar Administrador", () => {
    const chefe: Ator = { id: "chefe-id", perfil: Perfil.Chefe };
    expect(
      command.execute({
        ator: chefe,
        rg: 2,
        nome: "Novo Admin",
        email: "novo.admin@cbm.br",
        perfil: Perfil.Administrador,
        postoGraduacaoId: postoId,
        senha: "Senha@123",
      })
    ).rejects.toThrow(ForbiddenError);
  });

  it("Almoxarife não pode criar militares", () => {
    const almoxarife: Ator = { id: "almox-id", perfil: Perfil.Almoxarife };
    expect(
      command.execute({
        ator: almoxarife,
        rg: 3,
        nome: "Outro ACA",
        email: "outro.aca@cbm.br",
        perfil: Perfil.ACA,
        postoGraduacaoId: postoId,
        senha: "Senha@123",
      })
    ).rejects.toThrow(ForbiddenError);
  });

  it("rejeita postoGraduacaoId inexistente", () => {
    expect(
      command.execute({
        ator: admin,
        rg: 1,
        nome: "Carlos Souza",
        email: "carlos.souza@cbm.br",
        perfil: Perfil.ACA,
        postoGraduacaoId: "00000000-0000-0000-0000-000000000000",
        senha: "Senha@123",
      })
    ).rejects.toThrow(PostoGraduacaoNaoEncontradoError);
  });

  it("rejeita RG duplicado", async () => {
    await command.execute({
      ator: admin,
      rg: 100,
      nome: "Maria Santos",
      email: "maria.santos@cbm.br",
      perfil: Perfil.Chefe,
      postoGraduacaoId: postoId,
      senha: "Senha@123",
    });

    expect(
      command.execute({
        ator: admin,
        rg: 100,
        nome: "Pedro Lima",
        email: "pedro.lima@cbm.br",
        perfil: Perfil.ACA,
        postoGraduacaoId: postoId,
        senha: "Senha@123",
      })
    ).rejects.toThrow(RgJaExisteError);
  });

  it("rejeita e-mail duplicado (case-insensitive)", async () => {
    await command.execute({
      ator: admin,
      rg: 101,
      nome: "Original",
      email: "duplicado@cbm.br",
      perfil: Perfil.ACA,
      postoGraduacaoId: postoId,
      senha: "Senha@123",
    });

    expect(
      command.execute({
        ator: admin,
        rg: 102,
        nome: "Repetido",
        email: "DUPLICADO@cbm.br",
        perfil: Perfil.ACA,
        postoGraduacaoId: postoId,
        senha: "Senha@123",
      })
    ).rejects.toThrow(EmailJaExisteError);
  });

  it("cria múltiplos militares com RGs distintos", async () => {
    const r1 = await command.execute({
      ator: admin,
      rg: 1,
      nome: "Ana Costa",
      email: "ana.costa@cbm.br",
      perfil: Perfil.Administrador,
      postoGraduacaoId: postoId,
      senha: "Senha@123",
    });
    const r2 = await command.execute({
      ator: admin,
      rg: 2,
      nome: "Bruno Ferreira",
      email: "bruno.ferreira@cbm.br",
      perfil: Perfil.Chefe,
      postoGraduacaoId: postoId,
      senha: "Senha@123",
    });

    expect(r1.id).not.toBe(r2.id);
    expect(await militarRepository.listar()).toHaveLength(2);
  });

  it("remove espaços extras do nome", async () => {
    const result = await command.execute({
      ator: admin,
      rg: 50,
      nome: "  Rui Barbosa  ",
      email: "rui.barbosa@cbm.br",
      perfil: Perfil.Almoxarife,
      postoGraduacaoId: postoId,
      senha: "Senha@123",
    });

    const criado = await militarRepository.buscarPorId(result.id);
    expect(criado.nome).toBe("Rui Barbosa");
  });
});
