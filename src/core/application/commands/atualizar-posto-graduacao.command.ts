import {
  AbreviaturaJaExisteError,
  OrdemJaExisteError,
} from "@core/domain/errors/posto-graduacao.errors";
import type { IPostoGraduacaoRepository } from "@core/ports/posto-graduacao.repository";
import { ValidationError } from "@shared/errors";

export interface AtualizarPostoGraduacaoInput {
  id: string;
  abreviatura?: string;
  ordem?: number;
}

export class AtualizarPostoGraduacaoCommand {
  constructor(private repository: IPostoGraduacaoRepository) {}

  async execute(input: AtualizarPostoGraduacaoInput): Promise<void> {
    const { id, abreviatura, ordem } = input;

    const posto = await this.repository.buscarPorId(id);

    if (abreviatura !== undefined) {
      if (!abreviatura || abreviatura.trim().length === 0) {
        throw new ValidationError("Abreviatura não pode estar vazia", {
          field: "abreviatura",
        });
      }

      const outro = await this.repository.buscarPorAbreviatura(abreviatura);
      if (outro && outro.id !== id) {
        throw new AbreviaturaJaExisteError(abreviatura);
      }
    }

    if (ordem !== undefined) {
      if (!Number.isInteger(ordem) || ordem <= 0) {
        throw new ValidationError("Ordem deve ser um inteiro positivo", {
          field: "ordem",
          value: ordem,
        });
      }

      const outro = await this.repository.buscarPorOrdem(ordem);
      if (outro && outro.id !== id) {
        throw new OrdemJaExisteError(ordem);
      }
    }

    const atualizado = {
      ...posto,
      ...(abreviatura !== undefined && { abreviatura: abreviatura.trim() }),
      ...(ordem !== undefined && { ordem }),
    };

    await this.repository.atualizar(atualizado);
  }
}
