import type { IHasher } from "@core/ports/hasher.port";

/**
 * Implementação de IHasher usando Bun.password.
 * Algoritmo: Argon2id (padrão do Bun) — recomendado pelo OWASP em 2025.
 * Sal é gerado e embutido automaticamente no hash resultante.
 */
export class BunPasswordHasher implements IHasher {
  async hash(plain: string): Promise<string> {
    return Bun.password.hash(plain);
  }

  async verify(plain: string, hash: string): Promise<boolean> {
    return Bun.password.verify(plain, hash);
  }
}
