import { describe, expect, it } from "bun:test";
import { app } from "../../src/index";

const BASE = "http://localhost/api/v1";

describe("Autenticação e proteção de rotas (e2e)", () => {
  it("login com credenciais inexistentes retorna 401", async () => {
    const res = await app.request(`${BASE}/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ rg: 1, senha: "qualquer" }),
    });
    expect(res.status).toBe(401);
  });

  it("acesso a rota protegida sem token retorna 401", async () => {
    const res = await app.request(`${BASE}/militares`);
    expect(res.status).toBe(401);
  });

  it("acesso a rota protegida com token inválido retorna 401", async () => {
    const res = await app.request(`${BASE}/militares`, {
      headers: { Authorization: "Bearer token-invalido" },
    });
    expect(res.status).toBe(401);
  });

  it("login com corpo inválido retorna 400", async () => {
    const res = await app.request(`${BASE}/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ rg: "abc" }),
    });
    expect(res.status).toBe(400);
  });

  it("refresh com token inválido retorna 401", async () => {
    const res = await app.request(`${BASE}/auth/refresh`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ refreshToken: "invalido" }),
    });
    expect(res.status).toBe(401);
  });

  it("logout é idempotente e retorna 204", async () => {
    const res = await app.request(`${BASE}/auth/logout`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ refreshToken: "qualquer" }),
    });
    expect(res.status).toBe(204);
  });

  it("excesso de tentativas de login retorna 429 (rate limit)", async () => {
    const ip = "203.0.113.10"; // IP exclusivo deste teste, isola o contador
    const login = () =>
      app.request(`${BASE}/auth/login`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-forwarded-for": ip },
        body: JSON.stringify({ rg: 1, senha: "qualquer" }),
      });

    // 5 tentativas dentro do limite padrão (rejeitadas por credenciais, não por rate limit)
    for (let i = 0; i < 5; i++) {
      const res = await login();
      expect(res.status).not.toBe(429);
    }

    const blocked = await login();
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get("retry-after")).not.toBeNull();
  });

  it("aplica secure headers nas respostas", async () => {
    const res = await app.request(`${BASE}/auth/logout`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ refreshToken: "qualquer" }),
    });
    expect(res.headers.get("x-content-type-options")).toBe("nosniff");
  });

  it("reflete a origem permitida no header CORS", async () => {
    const res = await app.request(`${BASE}/auth/logout`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "http://localhost:5173",
      },
      body: JSON.stringify({ refreshToken: "qualquer" }),
    });
    expect(res.headers.get("access-control-allow-origin")).toBe("http://localhost:5173");
  });
});
