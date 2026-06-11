import type { PostoGraduacao } from "@core/domain/posto-graduacao.entity";

/**
 * Port que define o contrato para persistência e consulta de PostoGraduacao.
 *
 * Implementações: in-memory (dev), Drizzle+Postgres (prod).
 */
export interface IPostoGraduacaoRepository {
  /**
   * Persiste um novo PostoGraduacao.
   *
   * @throws {AbreviaturaJaExisteError} se abreviatura já existe
   * @throws {OrdemJaExisteError} se ordem já existe
   */
  criar(posto: PostoGraduacao): Promise<void>;

  /**
   * Atualiza um PostoGraduacao existente.
   *
   * @throws {PostoGraduacaoNaoEncontradoError} se não encontrado
   * @throws {AbreviaturaJaExisteError} se nova abreviatura já existe em outro posto
   * @throws {OrdemJaExisteError} se nova ordem já existe em outro posto
   */
  atualizar(id: string, updates: Partial<PostoGraduacao>): Promise<void>;

  /**
   * Exclui um PostoGraduacao pelo id.
   *
   * @throws {PostoGraduacaoNaoEncontradoError} se não encontrado
   */
  excluir(id: string): Promise<void>;

  /**
   * Busca um PostoGraduacao pelo id.
   *
   * @throws {PostoGraduacaoNaoEncontradoError} se não encontrado
   */
  buscarPorId(id: string): Promise<PostoGraduacao>;

  /**
   * Busca um PostoGraduacao pela abreviatura.
   *
   * @returns null se não encontrado
   */
  buscarPorAbreviatura(abreviatura: string): Promise<PostoGraduacao | null>;

  /**
   * Busca um PostoGraduacao pela ordem.
   *
   * @returns null se não encontrado
   */
  buscarPorOrdem(ordem: number): Promise<PostoGraduacao | null>;

  /**
   * Lista todos os PostoGraduacao do sistema.
   */
  listar(): Promise<PostoGraduacao[]>;
}
