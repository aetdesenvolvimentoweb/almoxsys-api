import { beforeEach, describe, expect, it } from "bun:test";
import { RevogarTokenCommand } from "@core/application/commands/revogar-token.command";
import { criarRefreshToken } from "@core/domain/auth/refresh-token.entity";
import { RefreshTokenInMemoryRepository } from "@infra/adapters/refresh-token-in-memory.repository";
import { hashToken } from "@shared/crypto";

describe("RevogarTokenCommand", () => {
  let refreshTokenRepository: RefreshTokenInMemoryRepository;
  let command: RevogarTokenCommand;

  beforeEach(() => {
    refreshTokenRepository = new RefreshTokenInMemoryRepository();
    command = new RevogarTokenCommand(refreshTokenRepository);
  });

  it("revoga um refresh token existente", async () => {
    await refreshTokenRepository.salvar(
      criarRefreshToken({ militarId: "m1", tokenHash: hashToken("meu-refresh"), ttlSeconds: 3600 })
    );

    await command.execute({ refreshToken: "meu-refresh" });

    expect(await refreshTokenRepository.buscarPorHash(hashToken("meu-refresh"))).toBeNull();
  });

  it("é idempotente para token inexistente (não lança)", async () => {
    await command.execute({ refreshToken: "nunca-existiu" });
    expect(await refreshTokenRepository.buscarPorHash(hashToken("nunca-existiu"))).toBeNull();
  });
});
