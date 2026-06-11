import type { IPostoGraduacaoRepository } from "@core/ports/posto-graduacao.repository";

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

    const updates = {
      ...posto,
      ...(abreviatura !== undefined && { abreviatura }),
      ...(ordem !== undefined && { ordem }),
    };

    await this.repository.atualizar(id, updates);
  }
}
