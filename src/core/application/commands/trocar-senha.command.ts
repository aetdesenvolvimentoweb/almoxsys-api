import { validarSenha } from "@core/domain/militar.entity";
import type { IHasher } from "@core/ports/hasher.port";
import type { IMilitarRepository } from "@core/ports/militar.repository";
import type { IRefreshTokenRepository } from "@core/ports/refresh-token.repository";
import { UnauthorizedError, ValidationError } from "@shared/errors";

export interface TrocarSenhaInput {
  militarId: string;
  senhaAtual: string;
  novaSenha: string;
}

/**
 * Permite que o próprio militar troque sua senha, exigindo a senha atual.
 *
 * É o único caminho para desbloquear uma conta com senha provisória
 * (`deveTrocarSenha`): zera a marca e revoga as sessões abertas com a credencial
 * anterior, fechando a janela em que quem criou a conta conhecia a senha.
 *
 * @throws {UnauthorizedError} se a senha atual não conferir
 * @throws {ValidationError} se a nova senha for fraca ou igual à atual
 */
export class TrocarSenhaCommand {
  constructor(
    private militarRepository: IMilitarRepository,
    private hasher: IHasher,
    private refreshTokenRepository: IRefreshTokenRepository
  ) {}

  async execute(input: TrocarSenhaInput): Promise<void> {
    const militar = await this.militarRepository.buscarPorId(input.militarId);

    const senhaConfere = await this.hasher.verify(input.senhaAtual, militar.senha);
    if (!senhaConfere) {
      throw new UnauthorizedError("Senha atual incorreta");
    }

    validarSenha(input.novaSenha);

    if (input.novaSenha === input.senhaAtual) {
      throw new ValidationError("A nova senha deve ser diferente da atual", { field: "novaSenha" });
    }

    const senhaHash = await this.hasher.hash(input.novaSenha);
    await this.militarRepository.atualizar({
      ...militar,
      senha: senhaHash,
      deveTrocarSenha: false,
    });

    await this.refreshTokenRepository.revogarPorMilitar(militar.id);
  }
}
