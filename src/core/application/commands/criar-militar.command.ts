import type { Ator } from "@core/domain/auth/ator";
import { assertPodeGerenciarMilitar } from "@core/domain/auth/militar.policy";
import { RgJaExisteError } from "@core/domain/errors/militar.errors";
import { criarMilitar, type Perfil } from "@core/domain/militar.entity";
import type { IHasher } from "@core/ports/hasher.port";
import type { IMilitarRepository } from "@core/ports/militar.repository";
import type { IPostoGraduacaoRepository } from "@core/ports/posto-graduacao.repository";

export interface CriarMilitarCommandInput {
  ator: Ator;
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
    const { ator, ...dados } = input;
    assertPodeGerenciarMilitar(ator, dados.perfil);

    await this.postoGraduacaoRepository.buscarPorId(dados.postoGraduacaoId);

    const existeRg = await this.militarRepository.buscarPorRg(dados.rg);
    if (existeRg) {
      throw new RgJaExisteError(dados.rg);
    }

    const senhaHash = await this.hasher.hash(dados.senha);
    const militar = criarMilitar({ ...dados, senha: senhaHash });
    await this.militarRepository.criar(militar);

    return { id: militar.id };
  }
}
