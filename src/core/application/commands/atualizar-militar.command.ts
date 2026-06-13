import type { Ator } from "@core/domain/auth/ator";
import { assertPodeGerenciarMilitar } from "@core/domain/auth/militar.policy";
import { EmailJaExisteError, RgJaExisteError } from "@core/domain/errors/militar.errors";
import {
  EMAIL_REGEX,
  NOME_REGEX,
  normalizarEmail,
  type Perfil,
  Perfil as PerfilEnum,
} from "@core/domain/militar.entity";
import type { IMilitarRepository } from "@core/ports/militar.repository";
import type { IPostoGraduacaoRepository } from "@core/ports/posto-graduacao.repository";
import { ValidationError } from "@shared/errors";

export interface AtualizarMilitarInput {
  ator: Ator;
  id: string;
  rg?: number;
  nome?: string;
  email?: string;
  perfil?: Perfil;
  postoGraduacaoId?: string;
}

export class AtualizarMilitarCommand {
  constructor(
    private militarRepository: IMilitarRepository,
    private postoGraduacaoRepository: IPostoGraduacaoRepository
  ) {}

  async execute(input: AtualizarMilitarInput): Promise<void> {
    const { ator, id, rg, nome, email, perfil, postoGraduacaoId } = input;

    const militar = await this.militarRepository.buscarPorId(id);

    assertPodeGerenciarMilitar(ator, militar.perfil);
    if (perfil !== undefined && perfil !== militar.perfil) {
      assertPodeGerenciarMilitar(ator, perfil);
    }

    if (rg !== undefined) {
      if (!Number.isInteger(rg) || rg < 1 || rg > 99999) {
        throw new ValidationError("RG deve ser um inteiro entre 1 e 99999", {
          field: "rg",
          value: rg,
        });
      }
      const outro = await this.militarRepository.buscarPorRg(rg);
      if (outro && outro.id !== id) {
        throw new RgJaExisteError(rg);
      }
    }

    if (nome !== undefined) {
      const nomeTrimado = nome.trim();
      if (!NOME_REGEX.test(nomeTrimado)) {
        throw new ValidationError(
          "Nome inválido. Use apenas letras, acentos, espaços, hifens ou apóstrofos",
          { field: "nome", value: nome }
        );
      }
    }

    if (email !== undefined) {
      const emailNormalizado = normalizarEmail(email);
      if (!EMAIL_REGEX.test(emailNormalizado)) {
        throw new ValidationError("E-mail inválido", { field: "email", value: email });
      }
      const outro = await this.militarRepository.buscarPorEmail(emailNormalizado);
      if (outro && outro.id !== id) {
        throw new EmailJaExisteError(emailNormalizado);
      }
    }

    if (perfil !== undefined) {
      const perfisValidos = Object.values(PerfilEnum) as string[];
      if (!perfisValidos.includes(perfil)) {
        throw new ValidationError(`Perfil inválido: "${perfil}"`, {
          field: "perfil",
          value: perfil,
        });
      }
    }

    if (postoGraduacaoId !== undefined) {
      await this.postoGraduacaoRepository.buscarPorId(postoGraduacaoId);
    }

    const atualizado = {
      ...militar,
      ...(rg !== undefined && { rg }),
      ...(nome !== undefined && { nome: nome.trim() }),
      ...(email !== undefined && { email: normalizarEmail(email) }),
      ...(perfil !== undefined && { perfil }),
      ...(postoGraduacaoId !== undefined && { postoGraduacaoId }),
    };

    await this.militarRepository.atualizar(atualizado);
  }
}
