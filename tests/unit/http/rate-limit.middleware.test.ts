import { describe, expect, it } from "bun:test";
import { createRateLimit } from "@infra/http/rate-limit.middleware";
import { Hono } from "hono";

function makeApp(max: number, windowMs: number) {
  const app = new Hono();
  app.use("*", createRateLimit({ max, windowMs }));
  app.get("/", (c) => c.text("ok"));
  return app;
}

const from = (ip: string) => ({ headers: { "x-forwarded-for": ip } });

describe("createRateLimit", () => {
  it("permite requisições até o limite e bloqueia a seguinte com 429", async () => {
    const app = makeApp(3, 60_000);

    for (let i = 0; i < 3; i++) {
      const res = await app.request("/", from("10.0.0.1"));
      expect(res.status).toBe(200);
    }

    const blocked = await app.request("/", from("10.0.0.1"));
    expect(blocked.status).toBe(429);
    const body = (await blocked.json()) as { code: string };
    expect(body.code).toBe("TOO_MANY_REQUESTS");
  });

  it("inclui header Retry-After na resposta bloqueada", async () => {
    const app = makeApp(1, 60_000);

    await app.request("/", from("10.0.0.2"));
    const blocked = await app.request("/", from("10.0.0.2"));

    expect(blocked.status).toBe(429);
    const retryAfter = Number(blocked.headers.get("retry-after"));
    expect(retryAfter).toBeGreaterThan(0);
    expect(retryAfter).toBeLessThanOrEqual(60);
  });

  it("isola o contador por IP", async () => {
    const app = makeApp(1, 60_000);

    expect((await app.request("/", from("10.0.0.3"))).status).toBe(200);
    expect((await app.request("/", from("10.0.0.3"))).status).toBe(429);
    // IP diferente tem contador próprio
    expect((await app.request("/", from("10.0.0.4"))).status).toBe(200);
  });

  it("zera o contador após a janela expirar", async () => {
    const app = makeApp(1, 30);

    expect((await app.request("/", from("10.0.0.5"))).status).toBe(200);
    expect((await app.request("/", from("10.0.0.5"))).status).toBe(429);

    await new Promise((resolve) => setTimeout(resolve, 40));

    expect((await app.request("/", from("10.0.0.5"))).status).toBe(200);
  });
});
