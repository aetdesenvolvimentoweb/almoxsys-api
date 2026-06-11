import { criarPostoGraduacao } from "@core/domain/posto-graduacao.entity";
import type { IPostoGraduacaoRepository } from "@core/ports/posto-graduacao.repository";

export interface CriarPostoGraduacaoInput {
  abreviatura: string;
  ordem: number;
}

export interface CriarPostoGraduacaoOutput {
  id: string;
}

export class CriarPostoGraduacaoCommand {
  constructor(private repository: IPostoGraduacaoRepository) {}

  async execute(input: CriarPostoGraduacaoInput): Promise<CriarPostoGraduacaoOutput> {
    const posto = criarPostoGraduacao(input);

    await this.repository.criar(posto);

    return { id: posto.id };
  }
}
