import type { Ator } from "@core/domain/auth/ator";
import { assertPodeGerenciarMilitar } from "@core/domain/auth/militar.policy";
import type { IMilitarRepository } from "@core/ports/militar.repository";

export interface ExcluirMilitarInput {
  ator: Ator;
  id: string;
}

export class ExcluirMilitarCommand {
  constructor(private repository: IMilitarRepository) {}

  async execute(input: ExcluirMilitarInput): Promise<void> {
    const militar = await this.repository.buscarPorId(input.id);
    assertPodeGerenciarMilitar(input.ator, militar.perfil);
    await this.repository.excluir(input.id);
  }
}
