import { NotFoundError, DuplicateKeyError } from "@shared/errors";

/**
 * Erro lançado quando um posto/graduação não é encontrado no repositório.
 */
export class PostoGraduacaoNaoEncontradoError extends NotFoundError {
  constructor(id: string) {
    super("PostoGraduacao", id);
  }
}

/**
 * Erro lançado quando tenta-se criar ou atualizar um posto com uma abreviatura
 * que já existe no sistema.
 */
export class AbreviaturaJaExisteError extends DuplicateKeyError {
  constructor(abreviatura: string) {
    super("Abreviatura", abreviatura);
  }
}

/**
 * Erro lançado quando tenta-se criar ou atualizar um posto com uma ordem
 * que já existe no sistema.
 */
export class OrdemJaExisteError extends DuplicateKeyError {
  constructor(ordem: number) {
    super("Ordem", ordem.toString());
  }
}
