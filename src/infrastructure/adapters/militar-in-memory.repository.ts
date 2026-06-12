import { MilitarNaoEncontradoError } from "@core/domain/errors/militar.errors";
import type { Militar } from "@core/domain/militar.entity";
import type { IMilitarRepository } from "@core/ports/militar.repository";

export class MilitarInMemoryRepository implements IMilitarRepository {
  private store: Map<string, Militar> = new Map();

  async criar(militar: Militar): Promise<void> {
    this.store.set(militar.id, militar);
  }

  async atualizar(militar: Militar): Promise<void> {
    if (!this.store.has(militar.id)) {
      throw new MilitarNaoEncontradoError(militar.id);
    }
    this.store.set(militar.id, militar);
  }

  async excluir(id: string): Promise<void> {
    if (!this.store.has(id)) {
      throw new MilitarNaoEncontradoError(id);
    }
    this.store.delete(id);
  }

  async buscarPorId(id: string): Promise<Militar> {
    const militar = this.store.get(id);
    if (!militar) {
      throw new MilitarNaoEncontradoError(id);
    }
    return militar;
  }

  async buscarPorRg(rg: number): Promise<Militar | null> {
    const militares = Array.from(this.store.values());
    return militares.find((m) => m.rg === rg) ?? null;
  }

  async listar(): Promise<Militar[]> {
    return Array.from(this.store.values());
  }
}
