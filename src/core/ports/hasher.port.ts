/**
 * Port para hashing e verificação de senhas.
 *
 * Implementações concretas ficam na camada de infrastructure.
 * O core nunca depende de algoritmo específico.
 */
export interface IHasher {
  /**
   * Produz o hash de um texto puro. Sal é gerado e embutido automaticamente.
   */
  hash(plain: string): Promise<string>;

  /**
   * Verifica se o texto puro corresponde ao hash armazenado.
   */
  verify(plain: string, hash: string): Promise<boolean>;
}
