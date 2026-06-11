import type { PostoGraduacao } from "@core/domain/posto-graduacao.entity";
import type { IPostoGraduacaoRepository } from "@core/ports/posto-graduacao.repository";

export class ListarPostosGraduacaoQuery {
  constructor(private repository: IPostoGraduacaoRepository) {}

  async execute(): Promise<PostoGraduacao[]> {
    const postos = await this.repository.listar();
    return postos.sort((a, b) => a.ordem - b.ordem);
  }
}
