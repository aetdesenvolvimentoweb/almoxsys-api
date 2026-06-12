import { describe, expect, it } from "bun:test";
import type { Ator } from "@core/domain/auth/ator";
import { assertPodeGerenciarMilitar } from "@core/domain/auth/militar.policy";
import { Perfil } from "@core/domain/militar.entity";
import { ForbiddenError } from "@shared/errors";

const ator = (perfil: Perfil): Ator => ({ id: "ator-id", perfil });

describe("assertPodeGerenciarMilitar", () => {
  describe("alvo Administrador ou Chefe — apenas Administrador gerencia", () => {
    it("Administrador pode gerenciar Administrador", () => {
      expect(() =>
        assertPodeGerenciarMilitar(ator(Perfil.Administrador), Perfil.Administrador)
      ).not.toThrow();
    });

    it("Administrador pode gerenciar Chefe", () => {
      expect(() =>
        assertPodeGerenciarMilitar(ator(Perfil.Administrador), Perfil.Chefe)
      ).not.toThrow();
    });

    it("Chefe não pode gerenciar Chefe", () => {
      expect(() => assertPodeGerenciarMilitar(ator(Perfil.Chefe), Perfil.Chefe)).toThrow(
        ForbiddenError
      );
    });

    it("Chefe não pode gerenciar Administrador", () => {
      expect(() => assertPodeGerenciarMilitar(ator(Perfil.Chefe), Perfil.Administrador)).toThrow(
        ForbiddenError
      );
    });
  });

  describe("alvo Almoxarife ou ACA — Administrador ou Chefe gerenciam", () => {
    it("Administrador pode gerenciar Almoxarife", () => {
      expect(() =>
        assertPodeGerenciarMilitar(ator(Perfil.Administrador), Perfil.Almoxarife)
      ).not.toThrow();
    });

    it("Chefe pode gerenciar ACA", () => {
      expect(() => assertPodeGerenciarMilitar(ator(Perfil.Chefe), Perfil.ACA)).not.toThrow();
    });

    it("Almoxarife não pode gerenciar Almoxarife", () => {
      expect(() => assertPodeGerenciarMilitar(ator(Perfil.Almoxarife), Perfil.Almoxarife)).toThrow(
        ForbiddenError
      );
    });

    it("ACA não pode gerenciar ACA", () => {
      expect(() => assertPodeGerenciarMilitar(ator(Perfil.ACA), Perfil.ACA)).toThrow(
        ForbiddenError
      );
    });
  });
});
