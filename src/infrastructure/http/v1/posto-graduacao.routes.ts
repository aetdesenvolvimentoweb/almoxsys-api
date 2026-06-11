import { AtualizarPostoGraduacaoCommand } from "@core/application/commands/atualizar-posto-graduacao.command";
import { CriarPostoGraduacaoCommand } from "@core/application/commands/criar-posto-graduacao.command";
import { ExcluirPostoGraduacaoCommand } from "@core/application/commands/excluir-posto-graduacao.command";
import { BuscarPostoGraduacaoPorIdQuery } from "@core/application/queries/buscar-posto-graduacao-por-id.query";
import { ListarPostosGraduacaoQuery } from "@core/application/queries/listar-postos-graduacao.query";
import type { IPostoGraduacaoRepository } from "@core/ports/posto-graduacao.repository";
import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { z } from "zod";

const PostoGraduacaoSchema = z.object({
  id: z.string().uuid(),
  abreviatura: z.string(),
  ordem: z.number().int().positive(),
});

const CriarPostoGraduacaoSchema = z.object({
  abreviatura: z.string().min(1).max(10),
  ordem: z.number().int().positive(),
});

const AtualizarPostoGraduacaoSchema = z.object({
  abreviatura: z.string().min(1).max(10).optional(),
  ordem: z.number().int().positive().optional(),
});

const IdParamSchema = z.object({
  id: z.string().uuid(),
});

export function createPostoGraduacaoRoutes(repository: IPostoGraduacaoRepository) {
  const router = new OpenAPIHono();

  const criarRoute = createRoute({
    method: "post",
    path: "/postos-graduacao",
    tags: ["Posto/Graduação"],
    summary: "Cria um novo posto/graduação",
    description: "Apenas Administradores podem criar postos/graduações",
    request: {
      body: {
        content: {
          "application/json": {
            schema: CriarPostoGraduacaoSchema,
          },
        },
      },
    },
    responses: {
      201: {
        description: "Posto/graduação criado com sucesso",
        content: {
          "application/json": {
            schema: z.object({ id: z.string().uuid() }),
          },
        },
      },
      409: {
        description: "Abreviatura ou ordem já existem no sistema (conflito de unicidade)",
        content: {
          "application/json": {
            schema: z.object({ message: z.string() }),
          },
        },
      },
    },
  });

  router.openapi(criarRoute, async (c) => {
    // TODO: autenticação + autorização Admin
    const body = c.req.valid("json");

    const command = new CriarPostoGraduacaoCommand(repository);
    const result = await command.execute(body);
    return c.json(result, 201);
  });

  const listarRoute = createRoute({
    method: "get",
    path: "/postos-graduacao",
    tags: ["Posto/Graduação"],
    summary: "Lista todos os postos/graduações",
    description: "Retorna lista ordenada pela ordem (hierarquia ascendente)",
    responses: {
      200: {
        description: "Lista de postos/graduações",
        content: {
          "application/json": {
            schema: z.array(PostoGraduacaoSchema),
          },
        },
      },
    },
  });

  router.openapi(listarRoute, async (c) => {
    // TODO: autenticação + autorização
    const query = new ListarPostosGraduacaoQuery(repository);
    const result = await query.execute();
    return c.json(result, 200);
  });

  const buscarPorIdRoute = createRoute({
    method: "get",
    path: "/postos-graduacao/:id",
    tags: ["Posto/Graduação"],
    summary: "Busca um posto/graduação pelo ID",
    request: {
      params: IdParamSchema,
    },
    responses: {
      200: {
        description: "Posto/graduação encontrado",
        content: {
          "application/json": {
            schema: PostoGraduacaoSchema,
          },
        },
      },
      404: {
        description: "Posto/graduação não encontrado",
        content: {
          "application/json": {
            schema: z.object({ message: z.string() }),
          },
        },
      },
    },
  });

  router.openapi(buscarPorIdRoute, async (c) => {
    // TODO: autenticação + autorização
    const { id } = c.req.valid("param");

    const query = new BuscarPostoGraduacaoPorIdQuery(repository);
    const result = await query.execute({ id });
    return c.json(result, 200);
  });

  const atualizarRoute = createRoute({
    method: "put",
    path: "/postos-graduacao/:id",
    tags: ["Posto/Graduação"],
    summary: "Atualiza um posto/graduação",
    description: "Apenas Administradores podem atualizar",
    request: {
      params: IdParamSchema,
      body: {
        content: {
          "application/json": {
            schema: AtualizarPostoGraduacaoSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: "Posto/graduação atualizado com sucesso",
        content: {
          "application/json": {
            schema: z.object({ message: z.string() }),
          },
        },
      },
      404: {
        description: "Posto/graduação não encontrado",
        content: {
          "application/json": {
            schema: z.object({ message: z.string() }),
          },
        },
      },
      409: {
        description: "Abreviatura ou ordem já existem em outro posto (conflito de unicidade)",
        content: {
          "application/json": {
            schema: z.object({ message: z.string() }),
          },
        },
      },
    },
  });

  router.openapi(atualizarRoute, async (c) => {
    // TODO: autenticação + autorização Admin
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");

    const command = new AtualizarPostoGraduacaoCommand(repository);
    await command.execute({ id, ...body });
    return c.json({ message: "Posto/graduação atualizado com sucesso" }, 200);
  });

  const excluirRoute = createRoute({
    method: "delete",
    path: "/postos-graduacao/:id",
    tags: ["Posto/Graduação"],
    summary: "Exclui um posto/graduação",
    description: "Apenas Administradores podem excluir",
    request: {
      params: IdParamSchema,
    },
    responses: {
      204: {
        description: "Posto/graduação excluído com sucesso",
      },
      404: {
        description: "Posto/graduação não encontrado",
        content: {
          "application/json": {
            schema: z.object({ message: z.string() }),
          },
        },
      },
    },
  });

  router.openapi(excluirRoute, async (c) => {
    // TODO: autenticação + autorização Admin
    const { id } = c.req.valid("param");

    const command = new ExcluirPostoGraduacaoCommand(repository);
    await command.execute({ id });
    return c.body(null, 204);
  });

  return router;
}
