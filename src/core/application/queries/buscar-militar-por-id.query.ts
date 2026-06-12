import type { Militar } from "@core/domain/militar.entity";
import type { IMilitarRepository } from "@core/ports/militar.repository";

export interface BuscarMilitarPorIdInput {
  id: string;
}

export class BuscarMilitarPorIdQuery {
  constructor(private repository: IMilitarRepository) {}

  async execute(input: BuscarMilitarPorIdInput): Promise<Militar> {
    return this.repository.buscarPorId(input.id);
  }
}
