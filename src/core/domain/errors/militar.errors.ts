import { DuplicateKeyError, NotFoundError } from "@shared/errors";

/**
 * Erro lançado quando um militar não é encontrado no repositório.
 */
export class MilitarNaoEncontradoError extends NotFoundError {
  constructor(id: string) {
    super("Militar", id);
  }
}

/**
 * Erro lançado quando tenta-se registrar um RG que já existe no sistema.
 */
export class RgJaExisteError extends DuplicateKeyError {
  constructor(rg: number) {
    super("RG", rg.toString());
  }
}

/**
 * Erro lançado quando tenta-se registrar um e-mail que já existe no sistema.
 */
export class EmailJaExisteError extends DuplicateKeyError {
  constructor(email: string) {
    super("E-mail", email);
  }
}
