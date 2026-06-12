import { RgJaExisteError } from "@core/domain/errors/militar.errors";
import { type Perfil, criarMilitar } from "@core/domain/militar.entity";
import type { IHasher } from "@core/ports/hasher.port";
import type { IMilitarRepository } from "@core/ports/militar.repository";
import type { IPostoGraduacaoRepository } from "@core/ports/posto-graduacao.repository";

export interface CriarMilitarCommandInput {
  rg: number;
  nome: string;
  perfil: Perfil;
  postoGraduacaoId: string;
  senha: string;
}

export interface CriarMilitarOutput {
  id: string;
}

export class CriarMilitarCommand {
  constructor(
    private militarRepository: IMilitarRepository,
    private postoGraduacaoRepository: IPostoGraduacaoRepository,
    private hasher: IHasher
  ) {}

  async execute(input: CriarMilitarCommandInput): Promise<CriarMilitarOutput> {
    await this.postoGraduacaoRepository.buscarPorId(input.postoGraduacaoId);

    const existeRg = await this.militarRepository.buscarPorRg(input.rg);
    if (existeRg) {
      throw new RgJaExisteError(input.rg);
    }

    const senhaHash = await this.hasher.hash(input.senha);
    const militar = criarMilitar({ ...input, senha: senhaHash });
    await this.militarRepository.criar(militar);

    return { id: militar.id };
  }
}
