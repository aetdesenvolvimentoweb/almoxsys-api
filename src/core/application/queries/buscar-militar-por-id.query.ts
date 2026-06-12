import { type MilitarView, toMilitarView } from "@core/domain/militar.entity";
import type { IMilitarRepository } from "@core/ports/militar.repository";

export interface BuscarMilitarPorIdInput {
  id: string;
}

export class BuscarMilitarPorIdQuery {
  constructor(private repository: IMilitarRepository) {}

  async execute(input: BuscarMilitarPorIdInput): Promise<MilitarView> {
    const militar = await this.repository.buscarPorId(input.id);
    return toMilitarView(militar);
  }
}
