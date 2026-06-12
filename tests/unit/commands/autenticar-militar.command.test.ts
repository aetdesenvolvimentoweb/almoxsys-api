import { beforeEach, describe, expect, it } from "bun:test";
import { AutenticarMilitarCommand } from "@core/application/commands/autenticar-militar.command";
import { CriarMilitarCommand } from "@core/application/commands/criar-militar.command";
import { CriarPostoGraduacaoCommand } from "@core/application/commands/criar-posto-graduacao.command";
import { Perfil } from "@core/domain/militar.entity";
import type { IHasher } from "@core/ports/hasher.port";
import type { ITokenService } from "@core/ports/token.port";
import { MilitarInMemoryRepository } from "@infra/adapters/militar-in-memory.repository";
import { PostoGraduacaoInMemoryRepository } from "@infra/adapters/posto-graduacao-in-memory.repository";
import { RefreshTokenInMemoryRepository } from "@infra/adapters/refresh-token-in-memory.repository";
import { UnauthorizedError } from "@shared/errors";

const mockHasher: IHasher = {
  hash: async (plain) => `hashed:${plain}`,
  verify: async (plain, hash) => hash === `hashed:${plain}`,
};

const mockTokenService: ITokenService = {
  sign: async (payload) => `token:${payload.sub}:${payload.perfil}`,
  verify: async () => ({ sub: "x", perfil: Perfil.Administrador }),
};

describe("AutenticarMilitarCommand", () => {
  let militarRepository: MilitarInMemoryRepository;
  let postoGraduacaoRepository: PostoGraduacaoInMemoryRepository;
  let refreshTokenRepository: RefreshTokenInMemoryRepository;
  let command: AutenticarMilitarCommand;
  let militarId: string;

  beforeEach(async () => {
    militarRepository = new MilitarInMemoryRepository();
    postoGraduacaoRepository = new PostoGraduacaoInMemoryRepository();
    refreshTokenRepository = new RefreshTokenInMemoryRepository();
    command = new AutenticarMilitarCommand(
      militarRepository,
      mockHasher,
      mockTokenService,
      refreshTokenRepository,
      3600
    );

    const criarPosto = new CriarPostoGraduacaoCommand(postoGraduacaoRepository);
    const postoId = (await criarPosto.execute({ abreviatura: "Cel", ordem: 1 })).id;

    const criarMilitar = new CriarMilitarCommand(
      militarRepository,
      postoGraduacaoRepository,
      mockHasher
    );
    militarId = (
      await criarMilitar.execute({
        ator: { id: "seed", perfil: Perfil.Administrador },
        rg: 100,
        nome: "João Silva",
        perfil: Perfil.Almoxarife,
        postoGraduacaoId: postoId,
        senha: "Senha@123",
      })
    ).id;
  });

  it("autentica com RG e senha corretos e retorna o par de tokens", async () => {
    const result = await command.execute({ rg: 100, senha: "Senha@123" });
    expect(result.accessToken).toBe(`token:${militarId}:${Perfil.Almoxarife}`);
    expect(result.refreshToken).toBeTruthy();
  });

  it("persiste o refresh token (hasheado) ao autenticar", async () => {
    const result = await command.execute({ rg: 100, senha: "Senha@123" });
    const { hashToken } = await import("@shared/crypto");
    const armazenado = await refreshTokenRepository.buscarPorHash(hashToken(result.refreshToken));
    expect(armazenado?.militarId).toBe(militarId);
  });

  it("rejeita RG inexistente com erro genérico", () => {
    expect(command.execute({ rg: 999, senha: "Senha@123" })).rejects.toThrow(UnauthorizedError);
  });

  it("rejeita senha incorreta com erro genérico", () => {
    expect(command.execute({ rg: 100, senha: "ErroSenha" })).rejects.toThrow(UnauthorizedError);
  });

  it("usa a mesma mensagem para RG inexistente e senha incorreta", async () => {
    const msgRgInexistente = await command.execute({ rg: 999, senha: "x" }).catch((e) => e.message);
    const msgSenhaErrada = await command.execute({ rg: 100, senha: "x" }).catch((e) => e.message);
    expect(msgRgInexistente).toBe(msgSenhaErrada);
  });
});
