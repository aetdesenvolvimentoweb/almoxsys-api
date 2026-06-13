import { beforeEach, describe, expect, it } from "bun:test";
import { CriarMilitarCommand } from "@core/application/commands/criar-militar.command";
import { CriarPostoGraduacaoCommand } from "@core/application/commands/criar-posto-graduacao.command";
import { TrocarSenhaCommand } from "@core/application/commands/trocar-senha.command";
import { criarRefreshToken } from "@core/domain/auth/refresh-token.entity";
import { Perfil } from "@core/domain/militar.entity";
import type { IHasher } from "@core/ports/hasher.port";
import { MilitarInMemoryRepository } from "@infra/adapters/militar-in-memory.repository";
import { PostoGraduacaoInMemoryRepository } from "@infra/adapters/posto-graduacao-in-memory.repository";
import { RefreshTokenInMemoryRepository } from "@infra/adapters/refresh-token-in-memory.repository";
import { UnauthorizedError, ValidationError } from "@shared/errors";

const mockHasher: IHasher = {
  hash: async (plain) => `hashed:${plain}`,
  verify: async (plain, hash) => hash === `hashed:${plain}`,
};

const SENHA_ATUAL = "Senha@123";
const NOVA_SENHA = "NovaSenha@456";

describe("TrocarSenhaCommand", () => {
  let militarRepository: MilitarInMemoryRepository;
  let refreshTokenRepository: RefreshTokenInMemoryRepository;
  let command: TrocarSenhaCommand;
  let militarId: string;

  beforeEach(async () => {
    militarRepository = new MilitarInMemoryRepository();
    const postoGraduacaoRepository = new PostoGraduacaoInMemoryRepository();
    refreshTokenRepository = new RefreshTokenInMemoryRepository();
    command = new TrocarSenhaCommand(militarRepository, mockHasher, refreshTokenRepository);

    const postoId = (
      await new CriarPostoGraduacaoCommand(postoGraduacaoRepository).execute({
        abreviatura: "Cel",
        ordem: 1,
      })
    ).id;

    militarId = (
      await new CriarMilitarCommand(
        militarRepository,
        postoGraduacaoRepository,
        mockHasher
      ).execute({
        ator: { id: "seed", perfil: Perfil.Administrador },
        rg: 100,
        nome: "João Silva",
        email: "joao.silva@cbm.br",
        perfil: Perfil.Almoxarife,
        postoGraduacaoId: postoId,
        senha: SENHA_ATUAL,
      })
    ).id;
  });

  it("troca a senha e zera deveTrocarSenha quando a senha atual confere", async () => {
    await command.execute({ militarId, senhaAtual: SENHA_ATUAL, novaSenha: NOVA_SENHA });

    const militar = await militarRepository.buscarPorId(militarId);
    expect(militar.senha).toBe(`hashed:${NOVA_SENHA}`);
    expect(militar.deveTrocarSenha).toBe(false);
  });

  it("revoga todas as sessões do militar ao trocar a senha", async () => {
    await refreshTokenRepository.salvar(
      criarRefreshToken({ militarId, tokenHash: "hash-sessao", ttlSeconds: 3600 })
    );

    await command.execute({ militarId, senhaAtual: SENHA_ATUAL, novaSenha: NOVA_SENHA });

    expect(await refreshTokenRepository.buscarPorHash("hash-sessao")).toBeNull();
  });

  it("rejeita quando a senha atual está incorreta", async () => {
    await expect(
      command.execute({ militarId, senhaAtual: "ErradaXyz", novaSenha: NOVA_SENHA })
    ).rejects.toThrow(UnauthorizedError);

    const militar = await militarRepository.buscarPorId(militarId);
    expect(militar.deveTrocarSenha).toBe(true);
  });

  it("rejeita nova senha que não atende à política", async () => {
    await expect(
      command.execute({ militarId, senhaAtual: SENHA_ATUAL, novaSenha: "fraca" })
    ).rejects.toThrow(ValidationError);
  });

  it("rejeita nova senha igual à atual", async () => {
    await expect(
      command.execute({ militarId, senhaAtual: SENHA_ATUAL, novaSenha: SENHA_ATUAL })
    ).rejects.toThrow(ValidationError);
  });
});
