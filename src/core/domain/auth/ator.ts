import type { Perfil } from "@core/domain/militar.entity";

/**
 * Representa o usuário autenticado que executa uma ação no sistema.
 *
 * Extraído do access token pelo middleware e repassado aos use cases,
 * onde a autorização (RBAC) é efetivamente aplicada.
 */
export interface Ator {
  id: string;
  perfil: Perfil;
}
