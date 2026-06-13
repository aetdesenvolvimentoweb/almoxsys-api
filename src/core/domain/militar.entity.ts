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

/**
 * Validação pragmática de e-mail: parte local, "@", domínio e TLD, sem espaços.
 * Suficiente para um sistema interno — a validação definitiva é a entrega real
 * no fluxo de recuperação de senha (e-mail só é útil se for alcançável).
 */
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const PERFIS_VALIDOS = Object.values(Perfil) as string[];

/**
 * Normaliza um e-mail para armazenamento e comparação: remove espaços nas bordas
 * e aplica minúsculas (e-mails são tratados como case-insensitive aqui).
 */
export function normalizarEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Conjunto de caracteres especiais aceitos na senha. Restrito a símbolos
 * "não comprometedores" — evita aspas, barras e sinais de markup que poderiam
 * complicar escaping em camadas externas.
 */
export const SENHA_ESPECIAIS = "!@#$%^&*()-_=+.,;:?";

/**
 * Política de senha (OWASP A07): 8 a 100 caracteres com ao menos uma letra
 * maiúscula, uma minúscula, um número e um caractere especial do conjunto
 * {@link SENHA_ESPECIAIS}. Fonte única usada pelo domínio e pelos schemas HTTP.
 */
export const SENHA_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()\-_=+.,;:?]).{8,100}$/;

/**
 * Valida uma senha em texto puro contra a política. Nunca inclui o valor da
 * senha em detalhes de erro — apenas o campo.
 *
 * @throws {ValidationError} se a senha não atender à política.
 */
export function validarSenha(senha: string): void {
  if (!SENHA_REGEX.test(senha ?? "")) {
    throw new ValidationError(
      "Senha fraca: use 8 a 100 caracteres com ao menos uma maiúscula, uma minúscula, um número e um caractere especial",
      { field: "senha" }
    );
  }
}

/**
 * Representa um militar usuário do sistema.
 *
 * @property id - Identificador único gerado pelo sistema (UUID).
 * @property rg - Número de registro do militar. Único, inteiro entre 1 e 99999.
 * @property nome - Nome completo. Permite acentuação, espaços internos e hifens.
 * @property email - E-mail único, canal seguro para recuperação de senha.
 * @property perfil - Nível de acesso ao sistema conforme matriz de permissões.
 * @property postoGraduacaoId - Referência ao posto/graduação hierárquico do militar.
 * @property senha - Hash Argon2id da senha. Nunca exposto nas respostas da API.
 */
export interface Militar {
  id: string;
  rg: number;
  nome: string;
  email: string;
  perfil: Perfil;
  postoGraduacaoId: string;
  senha: string;
}

export interface CriarMilitarInput {
  rg: number;
  nome: string;
  email: string;
  perfil: Perfil;
  postoGraduacaoId: string;
  senha: string;
}

/**
 * Projeção de leitura de Militar, sem dados sensíveis.
 *
 * O hash da senha jamais cruza a fronteira da aplicação: as queries retornam
 * esta projeção, tornando o vazamento impossível por construção (e não por
 * disciplina de sanitização na camada HTTP).
 */
export type MilitarView = Omit<Militar, "senha">;

/**
 * Converte uma entidade Militar em sua projeção de leitura, removendo a senha.
 */
export function toMilitarView({ senha: _senha, ...rest }: Militar): MilitarView {
  return rest;
}

/**
 * Cria uma nova entidade Militar com validações de domínio.
 *
 * @throws {ValidationError} se rg estiver fora do intervalo 1–99999
 * @throws {ValidationError} se nome contiver caracteres inválidos ou estiver vazio
 * @throws {ValidationError} se email tiver formato inválido
 * @throws {ValidationError} se perfil não pertencer ao conjunto definido
 */
export function criarMilitar(input: CriarMilitarInput): Militar {
  const { rg, nome, email, perfil, postoGraduacaoId } = input;

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

  const emailNormalizado = normalizarEmail(email ?? "");
  if (!EMAIL_REGEX.test(emailNormalizado)) {
    throw new ValidationError("E-mail inválido", { field: "email", value: email });
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
    email: emailNormalizado,
    perfil,
    postoGraduacaoId,
    senha: input.senha,
  };
}
