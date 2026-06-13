import { beforeEach, describe, expect, it } from "bun:test";
import { Perfil } from "@core/domain/militar.entity";
import type { IHasher } from "@core/ports/hasher.port";
import type { ILogger } from "@core/ports/logger.port";
import { MilitarInMemoryRepository } from "@infra/adapters/militar-in-memory.repository";
import { PostoGraduacaoInMemoryRepository } from "@infra/adapters/posto-graduacao-in-memory.repository";
import { bootstrapAdmin } from "@infra/seed/bootstrap-admin";

const mockHasher: IHasher = {
  hash: async (plain) => `hashed:${plain}`,
  verify: async (plain, hash) => hash === `hashed:${plain}`,
};

const noopLogger: ILogger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
};

describe("bootstrapAdmin", () => {
  let militarRepository: MilitarInMemoryRepository;
  let postoGraduacaoRepository: PostoGraduacaoInMemoryRepository;
  let deps: Parameters<typeof bootstrapAdmin>[0];

  beforeEach(() => {
    militarRepository = new MilitarInMemoryRepository();
    postoGraduacaoRepository = new PostoGraduacaoInMemoryRepository();
    deps = { militarRepository, postoGraduacaoRepository, hasher: mockHasher, logger: noopLogger };
  });

  it("cria o Administrador inicial quando não há militares", async () => {
    await bootstrapAdmin(deps, {
      rg: 1,
      nome: "Admin",
      email: "admin@cbm.br",
      senha: "Segredo@123",
    });

    const militares = await militarRepository.listar();
    expect(militares).toHaveLength(1);
    expect(militares.at(0)?.perfil).toBe(Perfil.Administrador);
    expect(militares.at(0)?.rg).toBe(1);
    expect(militares.at(0)?.senha).toBe("hashed:Segredo@123");
  });

  it("cria um posto/graduação padrão quando não existe nenhum", async () => {
    await bootstrapAdmin(deps, {
      rg: 1,
      nome: "Admin",
      email: "admin@cbm.br",
      senha: "Segredo@123",
    });

    const postos = await postoGraduacaoRepository.listar();
    expect(postos).toHaveLength(1);
  });

  it("não cria nada quando a configuração está ausente", async () => {
    await bootstrapAdmin(deps, null);
    expect(await militarRepository.listar()).toHaveLength(0);
  });

  it("não cria nada quando já existem militares", async () => {
    await militarRepository.criar({
      id: "existente",
      rg: 50,
      nome: "Já Existe",
      email: "ja.existe@cbm.br",
      perfil: Perfil.Chefe,
      postoGraduacaoId: "p1",
      senha: "x",
    });

    await bootstrapAdmin(deps, {
      rg: 1,
      nome: "Admin",
      email: "admin@cbm.br",
      senha: "Segredo@123",
    });

    const militares = await militarRepository.listar();
    expect(militares).toHaveLength(1);
    expect(militares.at(0)?.rg).toBe(50);
  });

  it("reutiliza um posto/graduação existente em vez de criar outro", async () => {
    await bootstrapAdmin(deps, {
      rg: 1,
      nome: "Admin",
      email: "admin@cbm.br",
      senha: "Segredo@123",
    });
    const militar = (await militarRepository.listar()).at(0);
    const posto = (await postoGraduacaoRepository.listar()).at(0);
    expect(militar?.postoGraduacaoId).toBe(posto?.id as string);
  });
});
