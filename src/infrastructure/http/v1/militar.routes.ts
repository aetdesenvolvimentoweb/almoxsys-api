import { AtualizarMilitarCommand } from "@core/application/commands/atualizar-militar.command";
import { CriarMilitarCommand } from "@core/application/commands/criar-militar.command";
import { ExcluirMilitarCommand } from "@core/application/commands/excluir-militar.command";
import { BuscarMilitarPorIdQuery } from "@core/application/queries/buscar-militar-por-id.query";
import { ListarMilitaresQuery } from "@core/application/queries/listar-militares.query";
import { Perfil } from "@core/domain/militar.entity";
import type { IHasher } from "@core/ports/hasher.port";
import type { ILogger } from "@core/ports/logger.port";
import type { IMilitarRepository } from "@core/ports/militar.repository";
import type { IPostoGraduacaoRepository } from "@core/ports/posto-graduacao.repository";
import type { ITokenService } from "@core/ports/token.port";
import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { type AuthVariables, createAuthMiddleware } from "@infra/http/auth.middleware";
import { z } from "zod";

const PerfilSchema = z.enum([Perfil.Administrador, Perfil.Chefe, Perfil.Almoxarife, Perfil.ACA]);

const MilitarSchema = z.object({
  id: z.string().uuid(),
  rg: z.number().int().min(1).max(99999),
  nome: z.string(),
  email: z.string().email(),
  perfil: PerfilSchema,
  postoGraduacaoId: z.string().uuid(),
});

const CriarMilitarSchema = z.object({
  rg: z.number().int().min(1).max(99999),
  nome: z.string().min(2).max(100),
  email: z.string().email().max(254),
  perfil: PerfilSchema,
  postoGraduacaoId: z.string().uuid(),
  senha: z.string().min(8).max(100),
});

const AtualizarMilitarSchema = z
  .object({
    rg: z.number().int().min(1).max(99999).optional(),
    nome: z.string().min(2).max(100).optional(),
    email: z.string().email().max(254).optional(),
    perfil: PerfilSchema.optional(),
    postoGraduacaoId: z.string().uuid().optional(),
    senha: z.string().min(8).max(100).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Pelo menos um campo deve ser informado para atualização",
  });

const IdParamSchema = z.object({
  id: z.string().uuid(),
});

export function createMilitarRoutes(
  militarRepository: IMilitarRepository,
  postoGraduacaoRepository: IPostoGraduacaoRepository,
  logger: ILogger,
  hasher: IHasher,
  tokenService: ITokenService
) {
  const router = new OpenAPIHono<{ Variables: AuthVariables }>();

  router.use(createAuthMiddleware(tokenService));

  const criarRoute = createRoute({
    method: "post",
    path: "/militares",
    tags: ["Militar"],
    summary: "Registra um novo militar no sistema",
    description: "Apenas Administradores e Chefes podem registrar militares",
    request: {
      body: {
        content: { "application/json": { schema: CriarMilitarSchema } },
      },
    },
    responses: {
      201: {
        description: "Militar registrado com sucesso",
        content: { "application/json": { schema: z.object({ id: z.string().uuid() }) } },
      },
      404: {
        description: "PostoGraduacao não encontrado",
        content: { "application/json": { schema: z.object({ message: z.string() }) } },
      },
      409: {
        description: "RG já existe no sistema",
        content: { "application/json": { schema: z.object({ message: z.string() }) } },
      },
    },
  });

  router.openapi(criarRoute, async (c) => {
    const ator = c.get("ator");
    const body = c.req.valid("json");

    const command = new CriarMilitarCommand(militarRepository, postoGraduacaoRepository, hasher);
    const result = await command.execute({ ator, ...body });
    logger.info("militar.criado", { id: result.id, rg: body.rg, perfil: body.perfil });
    return c.json(result, 201);
  });

  const listarRoute = createRoute({
    method: "get",
    path: "/militares",
    tags: ["Militar"],
    summary: "Lista todos os militares",
    description: "Retorna lista ordenada por RG ascendente",
    responses: {
      200: {
        description: "Lista de militares",
        content: { "application/json": { schema: z.array(MilitarSchema) } },
      },
    },
  });

  router.openapi(listarRoute, async (c) => {
    const query = new ListarMilitaresQuery(militarRepository);
    const result = await query.execute();
    return c.json(result);
  });

  const buscarPorIdRoute = createRoute({
    method: "get",
    path: "/militares/:id",
    tags: ["Militar"],
    summary: "Busca um militar pelo ID",
    request: { params: IdParamSchema },
    responses: {
      200: {
        description: "Militar encontrado",
        content: { "application/json": { schema: MilitarSchema } },
      },
      404: {
        description: "Militar não encontrado",
        content: { "application/json": { schema: z.object({ message: z.string() }) } },
      },
    },
  });

  router.openapi(buscarPorIdRoute, async (c) => {
    const { id } = c.req.valid("param");
    const query = new BuscarMilitarPorIdQuery(militarRepository);
    const result = await query.execute({ id });
    return c.json(result, 200);
  });

  const atualizarRoute = createRoute({
    method: "put",
    path: "/militares/:id",
    tags: ["Militar"],
    summary: "Atualiza dados de um militar",
    description: "Apenas Administradores e Chefes podem atualizar militares",
    request: {
      params: IdParamSchema,
      body: {
        content: { "application/json": { schema: AtualizarMilitarSchema } },
      },
    },
    responses: {
      200: {
        description: "Militar atualizado com sucesso",
        content: { "application/json": { schema: z.object({ message: z.string() }) } },
      },
      404: {
        description: "Militar ou PostoGraduacao não encontrado",
        content: { "application/json": { schema: z.object({ message: z.string() }) } },
      },
      409: {
        description: "RG já existe em outro militar",
        content: { "application/json": { schema: z.object({ message: z.string() }) } },
      },
    },
  });

  router.openapi(atualizarRoute, async (c) => {
    const ator = c.get("ator");
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");

    const command = new AtualizarMilitarCommand(
      militarRepository,
      postoGraduacaoRepository,
      hasher
    );
    await command.execute({ ator, id, ...body });
    logger.info("militar.atualizado", { id, changes: Object.keys(body) });
    return c.json({ message: "Militar atualizado com sucesso" }, 200);
  });

  const excluirRoute = createRoute({
    method: "delete",
    path: "/militares/:id",
    tags: ["Militar"],
    summary: "Remove um militar do sistema",
    description: "Apenas Administradores podem excluir militares",
    request: { params: IdParamSchema },
    responses: {
      204: { description: "Militar excluído com sucesso" },
      404: {
        description: "Militar não encontrado",
        content: { "application/json": { schema: z.object({ message: z.string() }) } },
      },
    },
  });

  router.openapi(excluirRoute, async (c) => {
    const ator = c.get("ator");
    const { id } = c.req.valid("param");

    const command = new ExcluirMilitarCommand(militarRepository);
    await command.execute({ ator, id });
    logger.info("militar.excluido", { id });
    return c.body(null, 204);
  });

  return router;
}
