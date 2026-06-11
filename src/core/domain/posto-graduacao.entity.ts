import { randomUUID } from "crypto";

/**
 * Representa um posto ou graduação militar no sistema.
 *
 * @property id - Identificador único gerado pelo sistema (UUID).
 * @property abreviatura - Sigla do posto (ex: "Cel", "TC", "Maj"). Deve ser única.
 * @property ordem - Número de ordem para classificação hierárquica. Deve ser único.
 */
export interface PostoGraduacao {
  id: string;
  abreviatura: string;
  ordem: number;
}

export interface CriarPostoGraduacaoInput {
  abreviatura: string;
  ordem: number;
}

/**
 * Cria uma nova entidade PostoGraduacao com validações de domínio.
 *
 * @throws Error se abreviatura estiver vazia ou ordem for negativa/zero
 */
export function criarPostoGraduacao(
  input: CriarPostoGraduacaoInput,
): PostoGraduacao {
  const { abreviatura, ordem } = input;

  if (!abreviatura || abreviatura.trim().length === 0) {
    throw new Error("Abreviatura não pode estar vazia");
  }

  if (!Number.isInteger(ordem) || ordem <= 0) {
    throw new Error("Ordem deve ser um inteiro positivo");
  }

  return {
    id: randomUUID(),
    abreviatura: abreviatura.trim(),
    ordem,
  };
}
