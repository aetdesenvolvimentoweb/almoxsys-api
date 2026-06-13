import { beforeEach, describe, expect, it } from "bun:test";
import { RenovarTokenCommand } from "@core/application/commands/renovar-token.command";
import { criarRefreshToken } from "@core/domain/auth/refresh-token.entity";
import { Perfil } from "@core/domain/militar.entity";
import type { ITokenService } from "@core/ports/token.port";
import { MilitarInMemoryRepository } from "@infra/adapters/militar-in-memory.repository";
import { RefreshTokenInMemoryRepository } from "@infra/adapters/refresh-token-in-memory.repository";
import { hashToken } from "@shared/crypto";
import { UnauthorizedError } from "@shared/errors";

const mockTokenService: ITokenService = {
  sign: async (payload) => `token:${payload.sub}:${payload.perfil}`,
  verify: async () => ({ sub: "x", perfil: Perfil.Administrador }),
};

describe("RenovarTokenCommand", () => {
  let militarRepository: MilitarInMemoryRepository;
  let refreshTokenRepository: RefreshTokenInMemoryRepository;
  let command: RenovarTokenCommand;

  const militar = {
    id: "militar-1",
    rg: 100,
    nome: "João",
    email: "joao@cbm.br",
    perfil: Perfil.Chefe,
    postoGraduacaoId: "posto-1",
    senha: "hash",
  };

  beforeEach(async () => {
    militarRepository = new MilitarInMemoryRepository();
    refreshTokenRepository = new RefreshTokenInMemoryRepository();
    command = new RenovarTokenCommand(
      refreshTokenRepository,
      militarRepository,
      mockTokenService,
      3600
    );
    await militarRepository.criar(militar);
  });

  async function salvarRefresh(raw: string, ttlSeconds: number) {
    await refreshTokenRepository.salvar(
      criarRefreshToken({ militarId: militar.id, tokenHash: hashToken(raw), ttlSeconds })
    );
  }

  it("troca um refresh válido por um novo par de tokens", async () => {
    await salvarRefresh("refresh-valido", 3600);

    const result = await command.execute({ refreshToken: "refresh-valido" });

    expect(result.accessToken).toBe(`token:${militar.id}:${Perfil.Chefe}`);
    expect(result.refreshToken).toBeTruthy();
    expect(result.refreshToken).not.toBe("refresh-valido");
  });

  it("rotaciona: o refresh usado é revogado", async () => {
    await salvarRefresh("refresh-valido", 3600);

    await command.execute({ refreshToken: "refresh-valido" });

    const antigo = await refreshTokenRepository.buscarPorHash(hashToken("refresh-valido"));
    expect(antigo).toBeNull();
  });

  it("rejeita refresh token inexistente", () => {
    expect(command.execute({ refreshToken: "nao-existe" })).rejects.toThrow(UnauthorizedError);
  });

  it("rejeita e revoga refresh token expirado", async () => {
    await salvarRefresh("refresh-expirado", -1);

    expect(command.execute({ refreshToken: "refresh-expirado" })).rejects.toThrow(
      UnauthorizedError
    );
    const armazenado = await refreshTokenRepository.buscarPorHash(hashToken("refresh-expirado"));
    expect(armazenado).toBeNull();
  });

  it("rejeita refresh de militar removido", async () => {
    await salvarRefresh("refresh-orfao", 3600);
    await militarRepository.excluir(militar.id);

    expect(command.execute({ refreshToken: "refresh-orfao" })).rejects.toThrow(UnauthorizedError);
  });
});
