import type { IHasher } from "@core/ports/hasher.port";
import type { IMilitarRepository } from "@core/ports/militar.repository";
import type { ITokenService } from "@core/ports/token.port";
import { UnauthorizedError } from "@shared/errors";

export interface AutenticarMilitarInput {
  rg: number;
  senha: string;
}

export interface AutenticarMilitarOutput {
  accessToken: string;
}

/**
 * Autentica um militar por RG + senha e emite um access token.
 *
 * Por segurança (OWASP A07), RG inexistente e senha incorreta produzem a mesma
 * resposta genérica, evitando enumeração de usuários.
 */
export class AutenticarMilitarCommand {
  constructor(
    private militarRepository: IMilitarRepository,
    private hasher: IHasher,
    private tokenService: ITokenService
  ) {}

  async execute(input: AutenticarMilitarInput): Promise<AutenticarMilitarOutput> {
    const militar = await this.militarRepository.buscarPorRg(input.rg);
    if (!militar) {
      throw new UnauthorizedError("Credenciais inválidas");
    }

    const senhaConfere = await this.hasher.verify(input.senha, militar.senha);
    if (!senhaConfere) {
      throw new UnauthorizedError("Credenciais inválidas");
    }

    const accessToken = await this.tokenService.sign({ sub: militar.id, perfil: militar.perfil });
    return { accessToken };
  }
}
