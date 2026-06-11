import type { IPostoGraduacaoRepository } from "@core/ports/posto-graduacao.repository";

export interface ExcluirPostoGraduacaoInput {
  id: string;
}

export class ExcluirPostoGraduacaoCommand {
  constructor(private repository: IPostoGraduacaoRepository) {}

  async execute(input: ExcluirPostoGraduacaoInput): Promise<void> {
    await this.repository.buscarPorId(input.id);
    await this.repository.excluir(input.id);
  }
}
