import type { Militar } from "@core/domain/militar.entity";
import type { IMilitarRepository } from "@core/ports/militar.repository";

export class ListarMilitaresQuery {
  constructor(private repository: IMilitarRepository) {}

  async execute(): Promise<Militar[]> {
    const militares = await this.repository.listar();
    return militares.sort((a, b) => a.rg - b.rg);
  }
}
