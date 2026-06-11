import {
  AbreviaturaJaExisteError,
  OrdemJaExisteError,
} from "@core/domain/errors/posto-graduacao.errors";
import {
  type CriarPostoGraduacaoInput,
  criarPostoGraduacao,
} from "@core/domain/posto-graduacao.entity";
import type { IPostoGraduacaoRepository } from "@core/ports/posto-graduacao.repository";

export interface CriarPostoGraduacaoOutput {
  id: string;
}

export class CriarPostoGraduacaoCommand {
  constructor(private repository: IPostoGraduacaoRepository) {}

  async execute(input: CriarPostoGraduacaoInput): Promise<CriarPostoGraduacaoOutput> {
    const existeAbreviatura = await this.repository.buscarPorAbreviatura(input.abreviatura);
    if (existeAbreviatura) {
      throw new AbreviaturaJaExisteError(input.abreviatura);
    }

    const existeOrdem = await this.repository.buscarPorOrdem(input.ordem);
    if (existeOrdem) {
      throw new OrdemJaExisteError(input.ordem);
    }

    const posto = criarPostoGraduacao(input);
    await this.repository.criar(posto);

    return { id: posto.id };
  }
}
