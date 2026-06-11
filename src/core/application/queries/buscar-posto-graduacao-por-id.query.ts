import type { PostoGraduacao } from "@core/domain/posto-graduacao.entity";
import type { IPostoGraduacaoRepository } from "@core/ports/posto-graduacao.repository";

export interface BuscarPostoGraduacaoPorIdInput {
  id: string;
}

export class BuscarPostoGraduacaoPorIdQuery {
  constructor(private repository: IPostoGraduacaoRepository) {}

  async execute(input: BuscarPostoGraduacaoPorIdInput): Promise<PostoGraduacao> {
    return this.repository.buscarPorId(input.id);
  }
}
