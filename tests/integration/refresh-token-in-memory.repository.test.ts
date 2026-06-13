import { beforeEach, describe, expect, it } from "bun:test";
import { criarRefreshToken } from "@core/domain/auth/refresh-token.entity";
import { RefreshTokenInMemoryRepository } from "@infra/adapters/refresh-token-in-memory.repository";

describe("RefreshTokenInMemoryRepository", () => {
  let repository: RefreshTokenInMemoryRepository;

  beforeEach(() => {
    repository = new RefreshTokenInMemoryRepository();
  });

  it("salva e busca pelo hash", async () => {
    const token = criarRefreshToken({ militarId: "m1", tokenHash: "hash-1", ttlSeconds: 3600 });
    await repository.salvar(token);

    const encontrado = await repository.buscarPorHash("hash-1");
    expect(encontrado?.id).toBe(token.id);
    expect(encontrado?.militarId).toBe("m1");
  });

  it("retorna null para hash inexistente", async () => {
    expect(await repository.buscarPorHash("nao-existe")).toBeNull();
  });

  it("revoga um token pelo hash", async () => {
    await repository.salvar(
      criarRefreshToken({ militarId: "m1", tokenHash: "hash-1", ttlSeconds: 3600 })
    );

    await repository.revogar("hash-1");

    expect(await repository.buscarPorHash("hash-1")).toBeNull();
  });

  it("revogar é idempotente para hash inexistente", async () => {
    await repository.revogar("nao-existe");
    expect(await repository.buscarPorHash("nao-existe")).toBeNull();
  });

  it("revoga todas as sessões de um militar, preservando as dos demais", async () => {
    await repository.salvar(
      criarRefreshToken({ militarId: "m1", tokenHash: "hash-a", ttlSeconds: 3600 })
    );
    await repository.salvar(
      criarRefreshToken({ militarId: "m1", tokenHash: "hash-b", ttlSeconds: 3600 })
    );
    await repository.salvar(
      criarRefreshToken({ militarId: "m2", tokenHash: "hash-c", ttlSeconds: 3600 })
    );

    await repository.revogarPorMilitar("m1");

    expect(await repository.buscarPorHash("hash-a")).toBeNull();
    expect(await repository.buscarPorHash("hash-b")).toBeNull();
    expect(await repository.buscarPorHash("hash-c")).not.toBeNull();
  });

  it("revogarPorMilitar é idempotente para militar sem sessões", async () => {
    await repository.revogarPorMilitar("inexistente");
    expect(await repository.buscarPorHash("qualquer")).toBeNull();
  });
});
