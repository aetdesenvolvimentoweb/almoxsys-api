import type { IMilitarRepository } from "@core/ports/militar.repository";

export interface ExcluirMilitarInput {
  id: string;
}

export class ExcluirMilitarCommand {
  constructor(private repository: IMilitarRepository) {}

  async execute(input: ExcluirMilitarInput): Promise<void> {
    await this.repository.buscarPorId(input.id);
    await this.repository.excluir(input.id);
  }
}
