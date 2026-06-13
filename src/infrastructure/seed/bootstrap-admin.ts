import { CriarPostoGraduacaoCommand } from "@core/application/commands/criar-posto-graduacao.command";
import { criarMilitar, Perfil, validarSenha } from "@core/domain/militar.entity";
import type { IHasher } from "@core/ports/hasher.port";
import type { ILogger } from "@core/ports/logger.port";
import type { IMilitarRepository } from "@core/ports/militar.repository";
import type { IPostoGraduacaoRepository } from "@core/ports/posto-graduacao.repository";
import type { BootstrapAdminConfig } from "@shared/config";

export interface BootstrapAdminDeps {
  militarRepository: IMilitarRepository;
  postoGraduacaoRepository: IPostoGraduacaoRepository;
  hasher: IHasher;
  logger: ILogger;
}

/**
 * Cria o Administrador inicial no startup, resolvendo o problema do ovo-e-galinha:
 * sem nenhum militar, ninguém conseguiria autenticar para criar o primeiro.
 *
 * Só executa quando há configuração ADMIN_* e nenhum militar cadastrado.
 * Por ser bootstrap de sistema, escreve direto no repositório (sem RBAC).
 */
export async function bootstrapAdmin(
  deps: BootstrapAdminDeps,
  config: BootstrapAdminConfig | null
): Promise<void> {
  const { militarRepository, postoGraduacaoRepository, hasher, logger } = deps;

  if (!config) {
    logger.warn("bootstrap.admin.ignorado", { motivo: "variáveis ADMIN_* não definidas" });
    return;
  }

  const militares = await militarRepository.listar();
  if (militares.length > 0) {
    logger.info("bootstrap.admin.ignorado", { motivo: "já existem militares" });
    return;
  }

  const postos = await postoGraduacaoRepository.listar();
  let postoId = postos.at(0)?.id;
  if (!postoId) {
    const criarPosto = new CriarPostoGraduacaoCommand(postoGraduacaoRepository);
    postoId = (await criarPosto.execute({ abreviatura: "Cmt", ordem: 1 })).id;
  }

  validarSenha(config.senha);
  const senhaHash = await hasher.hash(config.senha);
  const militar = criarMilitar({
    rg: config.rg,
    nome: config.nome,
    email: config.email,
    perfil: Perfil.Administrador,
    postoGraduacaoId: postoId,
    senha: senhaHash,
  });
  await militarRepository.criar(militar);

  logger.warn("bootstrap.admin.criado", { rg: config.rg });
}
