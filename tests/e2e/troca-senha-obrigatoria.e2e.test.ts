import { beforeEach, describe, expect, it } from "bun:test";
import { CriarPostoGraduacaoCommand } from "@core/application/commands/criar-posto-graduacao.command";
import { criarMilitar, Perfil } from "@core/domain/militar.entity";
import type { IHasher } from "@core/ports/hasher.port";
import type { ILogger } from "@core/ports/logger.port";
import { OpenAPIHono } from "@hono/zod-openapi";
import { HonoJwtTokenService } from "@infra/adapters/hono-jwt-token.service";
import { MilitarInMemoryRepository } from "@infra/adapters/militar-in-memory.repository";
import { PostoGraduacaoInMemoryRepository } from "@infra/adapters/posto-graduacao-in-memory.repository";
import { RefreshTokenInMemoryRepository } from "@infra/adapters/refresh-token-in-memory.repository";
import { errorHandler } from "@infra/http/error-handler.middleware";
import { createAuthRoutes } from "@infra/http/v1/auth.routes";
import { createMilitarRoutes } from "@infra/http/v1/militar.routes";

const BASE = "http://localhost/api/v1";

// Hasher determinístico: evita o custo do Argon2 e mantém o e2e focado no fluxo HTTP.
const hasher: IHasher = {
  hash: async (plain) => `hashed:${plain}`,
  verify: async (plain, hash) => hash === `hashed:${plain}`,
};

const noopLogger: ILogger = {
  debug() {},
  info() {},
  warn() {},
  error() {},
};

const ADMIN = { rg: 1, senha: "Admin@123" };
const MILITAR = { rg: 100, senha: "Senha@123" };
const NOVA_SENHA = "NovaSenha@456";

async function buildApp() {
  const militarRepository = new MilitarInMemoryRepository();
  const postoGraduacaoRepository = new PostoGraduacaoInMemoryRepository();
  const refreshTokenRepository = new RefreshTokenInMemoryRepository();
  const tokenService = new HonoJwtTokenService("test-secret-0123456789-abcdefghij", 3600);

  const postoId = (
    await new CriarPostoGraduacaoCommand(postoGraduacaoRepository).execute({
      abreviatura: "Cmt",
      ordem: 1,
    })
  ).id;

  // Admin já com senha definitiva — pode operar sem o bloqueio de troca.
  await militarRepository.criar({
    ...criarMilitar({
      rg: ADMIN.rg,
      nome: "Admin Geral",
      email: "admin@cbm.br",
      perfil: Perfil.Administrador,
      postoGraduacaoId: postoId,
      senha: await hasher.hash(ADMIN.senha),
    }),
    deveTrocarSenha: false,
  });

  const app = new OpenAPIHono();
  app.onError(errorHandler);
  app.route(
    "/api/v1",
    createAuthRoutes({
      militarRepository,
      refreshTokenRepository,
      hasher,
      tokenService,
      refreshTtlSeconds: 3600,
      logger: noopLogger,
    })
  );
  app.route(
    "/api/v1",
    createMilitarRoutes(
      militarRepository,
      postoGraduacaoRepository,
      noopLogger,
      hasher,
      tokenService
    )
  );

  return { app, postoId };
}

interface TokenPairResponse {
  accessToken: string;
  refreshToken: string;
}

function login(app: OpenAPIHono, rg: number, senha: string) {
  return app.request(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ rg, senha }),
  });
}

async function loginTokens(
  app: OpenAPIHono,
  rg: number,
  senha: string
): Promise<TokenPairResponse> {
  return (await login(app, rg, senha)).json() as Promise<TokenPairResponse>;
}

describe("Troca de senha obrigatória no primeiro acesso (e2e)", () => {
  let app: OpenAPIHono;
  let postoId: string;

  beforeEach(async () => {
    ({ app, postoId } = await buildApp());
  });

  async function criarMilitarComoAdmin() {
    const adminToken = (await loginTokens(app, ADMIN.rg, ADMIN.senha)).accessToken;
    const res = await app.request(`${BASE}/militares`, {
      method: "POST",
      headers: { "content-type": "application/json", Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        rg: MILITAR.rg,
        nome: "Recruta Novo",
        email: "recruta@cbm.br",
        perfil: Perfil.Almoxarife,
        postoGraduacaoId: postoId,
        senha: MILITAR.senha,
      }),
    });
    expect(res.status).toBe(201);
  }

  it("militar recém-criado nasce com deveTrocarSenha true", async () => {
    await criarMilitarComoAdmin();
    const adminToken = (await loginTokens(app, ADMIN.rg, ADMIN.senha)).accessToken;

    const lista = (await (
      await app.request(`${BASE}/militares`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      })
    ).json()) as Array<{ rg: number; deveTrocarSenha: boolean }>;

    const recruta = lista.find((m) => m.rg === MILITAR.rg);
    expect(recruta?.deveTrocarSenha).toBe(true);
  });

  it("bloqueia rota protegida até a troca e libera depois", async () => {
    await criarMilitarComoAdmin();

    const loginRes = await login(app, MILITAR.rg, MILITAR.senha);
    expect(loginRes.status).toBe(200);
    const { accessToken, refreshToken } = (await loginRes.json()) as TokenPairResponse;

    // Bloqueado: senha ainda provisória.
    const bloqueado = await app.request(`${BASE}/militares`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(bloqueado.status).toBe(403);

    // Troca a senha com a senha atual.
    const troca = await app.request(`${BASE}/auth/trocar-senha`, {
      method: "POST",
      headers: { "content-type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ senhaAtual: MILITAR.senha, novaSenha: NOVA_SENHA }),
    });
    expect(troca.status).toBe(204);

    // Mesmo token agora passa (guard lê o flag ao vivo).
    const liberado = await app.request(`${BASE}/militares`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(liberado.status).toBe(200);

    // Sessão antiga revogada: refresh não renova mais.
    const refresh = await app.request(`${BASE}/auth/refresh`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    expect(refresh.status).toBe(401);

    // Novo login com a nova senha funciona.
    expect((await login(app, MILITAR.rg, NOVA_SENHA)).status).toBe(200);
  });

  it("rejeita troca com senha atual incorreta (401)", async () => {
    await criarMilitarComoAdmin();
    const { accessToken } = await loginTokens(app, MILITAR.rg, MILITAR.senha);

    const res = await app.request(`${BASE}/auth/trocar-senha`, {
      method: "POST",
      headers: { "content-type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ senhaAtual: "Errada@999", novaSenha: NOVA_SENHA }),
    });
    expect(res.status).toBe(401);
  });

  it("rejeita troca com nova senha fraca (400)", async () => {
    await criarMilitarComoAdmin();
    const { accessToken } = await loginTokens(app, MILITAR.rg, MILITAR.senha);

    const res = await app.request(`${BASE}/auth/trocar-senha`, {
      method: "POST",
      headers: { "content-type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ senhaAtual: MILITAR.senha, novaSenha: "fraca" }),
    });
    expect(res.status).toBe(400);
  });
});
