import { PostoGraduacaoNaoEncontradoError } from "@core/domain/errors/posto-graduacao.errors";
import type { PostoGraduacao } from "@core/domain/posto-graduacao.entity";
import type { IPostoGraduacaoRepository } from "@core/ports/posto-graduacao.repository";

export class PostoGraduacaoInMemoryRepository implements IPostoGraduacaoRepository {
  private store: Map<string, PostoGraduacao> = new Map();

  async criar(posto: PostoGraduacao): Promise<void> {
    this.store.set(posto.id, posto);
  }

  async atualizar(posto: PostoGraduacao): Promise<void> {
    if (!this.store.has(posto.id)) {
      throw new PostoGraduacaoNaoEncontradoError(posto.id);
    }

    this.store.set(posto.id, posto);
  }

  async excluir(id: string): Promise<void> {
    if (!this.store.has(id)) {
      throw new PostoGraduacaoNaoEncontradoError(id);
    }

    this.store.delete(id);
  }

  async buscarPorId(id: string): Promise<PostoGraduacao> {
    const posto = this.store.get(id);
    if (!posto) {
      throw new PostoGraduacaoNaoEncontradoError(id);
    }

    return posto;
  }

  async buscarPorAbreviatura(abreviatura: string): Promise<PostoGraduacao | null> {
    const postos = Array.from(this.store.values());
    return postos.find((p) => p.abreviatura === abreviatura) ?? null;
  }

  async buscarPorOrdem(ordem: number): Promise<PostoGraduacao | null> {
    const postos = Array.from(this.store.values());
    return postos.find((p) => p.ordem === ordem) ?? null;
  }

  async listar(): Promise<PostoGraduacao[]> {
    return Array.from(this.store.values());
  }
}
