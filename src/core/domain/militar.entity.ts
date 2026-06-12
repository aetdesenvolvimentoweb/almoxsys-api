import { randomUUID } from "node:crypto";
import { ValidationError } from "@shared/errors";

export const Perfil = {
  Administrador: "Administrador",
  Chefe: "Chefe",
  Almoxarife: "Almoxarife",
  ACA: "ACA",
} as const;

export type Perfil = (typeof Perfil)[keyof typeof Perfil];

/**
 * Expressão regular para validação de nomes com acentuação portuguesa.
 * Permite letras, espaços internos, hifens e apóstrofos (ex: "Maria Dos Santos", "João-Paulo").
 */
export const NOME_REGEX = /^[A-Za-zÀ-ÿ]+([ '-][A-Za-zÀ-ÿ]+)*$/;

const PERFIS_VALIDOS = Object.values(Perfil) as string[];

/**
 * Representa um militar usuário do sistema.
 *
 * @property id - Identificador único gerado pelo sistema (UUID).
 * @property rg - Número de registro do militar. Único, inteiro entre 1 e 99999.
 * @property nome - Nome completo. Permite acentuação, espaços internos e hifens.
 * @property perfil - Nível de acesso ao sistema conforme matriz de permissões.
 * @property postoGraduacaoId - Referência ao posto/graduação hierárquico do militar.
 * @property senha - Hash Argon2id da senha. Nunca exposto nas respostas da API.
 */
export interface Militar {
  id: string;
  rg: number;
  nome: string;
  perfil: Perfil;
  postoGraduacaoId: string;
  senha: string;
}

export interface CriarMilitarInput {
  rg: number;
  nome: string;
  perfil: Perfil;
  postoGraduacaoId: string;
  senha: string;
}

/**
 * Cria uma nova entidade Militar com validações de domínio.
 *
 * @throws {ValidationError} se rg estiver fora do intervalo 1–99999
 * @throws {ValidationError} se nome contiver caracteres inválidos ou estiver vazio
 * @throws {ValidationError} se perfil não pertencer ao conjunto definido
 */
export function criarMilitar(input: CriarMilitarInput): Militar {
  const { rg, nome, perfil, postoGraduacaoId } = input;

  if (!Number.isInteger(rg) || rg < 1 || rg > 99999) {
    throw new ValidationError("RG deve ser um inteiro entre 1 e 99999", {
      field: "rg",
      value: rg,
    });
  }

  const nomeTrimado = nome?.trim() ?? "";
  if (!NOME_REGEX.test(nomeTrimado)) {
    throw new ValidationError(
      "Nome inválido. Use apenas letras, acentos, espaços, hifens ou apóstrofos",
      { field: "nome", value: nome }
    );
  }

  if (!PERFIS_VALIDOS.includes(perfil)) {
    throw new ValidationError(`Perfil inválido: "${perfil}"`, {
      field: "perfil",
      value: perfil,
    });
  }

  return {
    id: randomUUID(),
    rg,
    nome: nomeTrimado,
    perfil,
    postoGraduacaoId,
    senha: input.senha,
  };
}
