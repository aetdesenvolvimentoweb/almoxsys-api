/**
 * Erro lançado quando um posto/graduação não é encontrado no repositório.
 */
export class PostoGraduacaoNaoEncontradoError extends Error {
  constructor(id: string) {
    super(`PostoGraduacao com id '${id}' não encontrado`);
    this.name = "PostoGraduacaoNaoEncontradoError";
  }
}

/**
 * Erro lançado quando tenta-se criar ou atualizar um posto com uma abreviatura
 * que já existe no sistema.
 */
export class AbreviaturaJaExisteError extends Error {
  constructor(abreviatura: string) {
    super(
      `PostoGraduacao com abreviatura '${abreviatura}' já existe no sistema`,
    );
    this.name = "AbreviaturaJaExisteError";
  }
}

/**
 * Erro lançado quando tenta-se criar ou atualizar um posto com uma ordem
 * que já existe no sistema.
 */
export class OrdemJaExisteError extends Error {
  constructor(ordem: number) {
    super(`PostoGraduacao com ordem '${ordem}' já existe no sistema`);
    this.name = "OrdemJaExisteError";
  }
}
