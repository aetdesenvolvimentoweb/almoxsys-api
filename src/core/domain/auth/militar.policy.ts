import { Perfil } from "@core/domain/militar.entity";
import { ForbiddenError } from "@shared/errors";
import type { Ator } from "./ator";

/**
 * Política de autorização para o gerenciamento de militares (criar, atualizar,
 * excluir), conforme a matriz de permissões em REQUISITOS.md.
 *
 * Regra por perfil do militar-alvo:
 * - Administrador / Chefe → somente um Administrador pode gerenciar.
 * - Almoxarife / ACA → Administrador ou Chefe podem gerenciar.
 *
 * @throws {ForbiddenError} quando o ator não tem permissão sobre o perfil-alvo
 */
export function assertPodeGerenciarMilitar(ator: Ator, perfilAlvo: Perfil): void {
  const alvoEhPrivilegiado = perfilAlvo === Perfil.Administrador || perfilAlvo === Perfil.Chefe;

  if (alvoEhPrivilegiado) {
    if (ator.perfil !== Perfil.Administrador) {
      throw new ForbiddenError("Apenas Administradores podem gerenciar Administradores e Chefes");
    }
    return;
  }

  const podeGerenciar = ator.perfil === Perfil.Administrador || ator.perfil === Perfil.Chefe;
  if (!podeGerenciar) {
    throw new ForbiddenError("Você não tem permissão para gerenciar militares");
  }
}
