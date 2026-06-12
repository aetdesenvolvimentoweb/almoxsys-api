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
});
