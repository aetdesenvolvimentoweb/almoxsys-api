import { RgJaExisteError } from "@core/domain/errors/militar.errors";
import { type CriarMilitarInput, criarMilitar } from "@core/domain/militar.entity";
import type { IMilitarRepository } from "@core/ports/militar.repository";
import type { IPostoGraduacaoRepository } from "@core/ports/posto-graduacao.repository";

export interface CriarMilitarOutput {
  id: string;
}

export class CriarMilitarCommand {
  constructor(
    private militarRepository: IMilitarRepository,
    private postoGraduacaoRepository: IPostoGraduacaoRepository
  ) {}

  async execute(input: CriarMilitarInput): Promise<CriarMilitarOutput> {
    await this.postoGraduacaoRepository.buscarPorId(input.postoGraduacaoId);

    const existeRg = await this.militarRepository.buscarPorRg(input.rg);
    if (existeRg) {
      throw new RgJaExisteError(input.rg);
    }

    const militar = criarMilitar(input);
    await this.militarRepository.criar(militar);

    return { id: militar.id };
  }
}
