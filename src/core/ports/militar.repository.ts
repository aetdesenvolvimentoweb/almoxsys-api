import type { Militar } from "@core/domain/militar.entity";

/**
 * Port que define o contrato para persistência e consulta de Militar.
 *
 * Implementações: in-memory (dev), Drizzle+Postgres (prod).
 */
export interface IMilitarRepository {
  /**
   * Persiste um novo Militar.
   *
   * @throws {RgJaExisteError} se o RG já existe no sistema
   */
  criar(militar: Militar): Promise<void>;

  /**
   * Atualiza um Militar existente.
   *
   * @throws {MilitarNaoEncontradoError} se o id não existe
   */
  atualizar(militar: Militar): Promise<void>;

  /**
   * Exclui um Militar pelo id.
   *
   * @throws {MilitarNaoEncontradoError} se não encontrado
   */
  excluir(id: string): Promise<void>;

  /**
   * Busca um Militar pelo id.
   *
   * @throws {MilitarNaoEncontradoError} se não encontrado
   */
  buscarPorId(id: string): Promise<Militar>;

  /**
   * Busca um Militar pelo número de registro (RG).
   *
   * @returns null se não encontrado
   */
  buscarPorRg(rg: number): Promise<Militar | null>;

  /**
   * Lista todos os militares do sistema.
   */
  listar(): Promise<Militar[]>;
}
