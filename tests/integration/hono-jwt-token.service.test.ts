import { describe, expect, it } from "bun:test";
import { Perfil } from "@core/domain/militar.entity";
import { HonoJwtTokenService } from "@infra/adapters/hono-jwt-token.service";
import { UnauthorizedError } from "@shared/errors";

const SECRET = "segredo-de-teste";

describe("HonoJwtTokenService", () => {
  it("assina e verifica um token (round-trip)", async () => {
    const service = new HonoJwtTokenService(SECRET, 900);
    const token = await service.sign({ sub: "militar-1", perfil: Perfil.Chefe });

    const payload = await service.verify(token);

    expect(payload.sub).toBe("militar-1");
    expect(payload.perfil).toBe(Perfil.Chefe);
  });

  it("rejeita token com segredo diferente", async () => {
    const emissor = new HonoJwtTokenService(SECRET, 900);
    const token = await emissor.sign({ sub: "militar-1", perfil: Perfil.ACA });

    const outro = new HonoJwtTokenService("outro-segredo", 900);
    expect(outro.verify(token)).rejects.toThrow(UnauthorizedError);
  });

  it("rejeita token malformado", async () => {
    const service = new HonoJwtTokenService(SECRET, 900);
    expect(service.verify("não-é-um-jwt")).rejects.toThrow(UnauthorizedError);
  });

  it("rejeita token expirado", async () => {
    const service = new HonoJwtTokenService(SECRET, -1);
    const token = await service.sign({ sub: "militar-1", perfil: Perfil.Administrador });
    expect(service.verify(token)).rejects.toThrow(UnauthorizedError);
  });
});
