# ALMOXSYS-API — Guia de Desenvolvimento

Sistema de controle de almoxarifado para Organizações Bombeiro Militar.
Stack: **Bun** + **Hono** + **TypeScript**.
Consulte `REQUISITOS.md` para domínios, perfis e regras de negócio.

---

## Arquitetura: Hexagonal (Ports & Adapters)

```
src/
├── core/                        # Domínio puro — sem dependências externas
│   ├── domain/                  # Entidades, Value Objects, erros de domínio
│   ├── application/             # Use Cases separados por CQRS
│   │   ├── commands/            # Operações de escrita
│   │   └── queries/             # Operações de leitura
│   └── ports/                   # Interfaces (repositórios, serviços externos)
├── infrastructure/              # Implementações concretas
│   ├── http/
│   │   └── v1/                  # Rotas Hono — prefixo /api/v1
│   ├── database/                # Repositórios, migrations, seeds
│   └── adapters/                # Implementações das ports
└── shared/                      # DTOs, utils, tipos compartilhados
```

- Dependências sempre apontam para dentro: `infrastructure` → `core`, nunca o contrário
- Use Cases dependem apenas de ports (interfaces), nunca de implementações concretas

## CQRS

- **Commands**: alteram estado — retornam `void` ou o id da entidade criada
- **Queries**: leem estado — sem efeitos colaterais
- Cada use case = um arquivo = uma responsabilidade

## Princípios

- **YAGNI**: não implementar o que não foi solicitado
- **DRY**: extrair duplicações para `shared/` ou `domain/`
- **KISS**: preferir a solução mais simples que funciona
- Sem over-engineering — três linhas similares são melhores que uma abstração prematura

---

## API Versioning

- Prefixo obrigatório: `/api/v1/...`
- Nova versão (`v2`) somente quando há breaking changes na API pública

---

## Segurança (OWASP)

- Validar e sanitizar todos os inputs na borda HTTP — nunca confiar em dados externos
- Nunca expor stack traces ou mensagens internas em respostas de erro
- Autenticação via JWT — verificada em middleware antes dos route handlers
- RBAC implementado nos Use Cases (ports), não nos controllers HTTP
- Rate limiting nas rotas públicas
- Senhas com bcrypt (custo mínimo 12)
- Variáveis sensíveis apenas em `.env` — nunca em código

---

## Testes (TDD)

- Runner: **Bun test** nativo (`bun test`)
- Escrever o teste antes ou junto com a implementação
- Estrutura espelhada ao `src/`:
  - `src/core/application/commands/foo.command.ts` → `tests/unit/commands/foo.command.test.ts`

| Tipo | O que cobre | I/O real? |
|------|-------------|-----------|
| Unit | Domínio e Use Cases | Não |
| Integration | Repositórios e adapters | Sim (DB de teste) |
| E2E | Rotas HTTP completas | Sim |

---

## Documentação

### Código — TSDoc
- Usar **TSDoc** (não JSDoc puro) em funções públicas, interfaces, entidades e ports
- Documentar o **porquê**, não o **o quê** — o nome já diz o que faz
- Obrigatório em: ports/interfaces, entidades de domínio, erros tipados, DTOs públicos
- Não documentar implementações internas óbvias

```ts
/**
 * Registra a retirada de um material do almoxarifado.
 * Valida disponibilidade de estoque antes de persistir.
 *
 * @throws {EstoqueInsuficienteError} quando a quantidade solicitada excede o disponível
 */
export interface RetirarMaterialPort { ... }
```

### API — OpenAPI via `@hono/zod-openapi`
- Usar `@hono/zod-openapi` para definir rotas — o schema Zod de validação **gera o spec OpenAPI automaticamente** (sem duplicação)
- Swagger UI disponível em `/api/docs` (apenas em ambiente não-produção)
- Cada rota deve ter `summary`, `tags` e schemas de request/response definidos
- O spec OpenAPI serve como contrato formal da API

```ts
// O schema valida o input E documenta a rota ao mesmo tempo
const createAlmoxarifadoRoute = createRoute({
  method: 'post',
  path: '/almoxarifados',
  tags: ['Almoxarifado'],
  summary: 'Cria um novo almoxarifado',
  request: { body: { content: { 'application/json': { schema: CreateAlmoxarifadoSchema } } } },
  responses: { 201: { content: { 'application/json': { schema: AlmoxarifadoSchema } } } },
})
```

---

## Padronização de Código

- **Biome** para lint e format (não ESLint/Prettier)
- TypeScript `strict: true` — sem `any` implícito
- Exports nomeados — sem `default export`
- Erros de domínio como classes tipadas, nunca strings soltas
- Sem comentários que apenas repetem o que o código já diz

---

## Conventional Commits

Formato: `<type>(<scope>): <descrição em português>`

| Type | Quando usar |
|------|-------------|
| `feat` | Nova funcionalidade |
| `fix` | Correção de bug |
| `refactor` | Refatoração sem mudar comportamento |
| `test` | Adição ou ajuste de testes |
| `docs` | Documentação |
| `chore` | Build, configs, dependências |
| `perf` | Melhoria de performance |
| `ci` | Pipelines de CI/CD |

Scope: nome do módulo/domínio (ex: `almoxarifado`, `auth`, `material`, `patrimonio`)

Exemplos:
```
feat(almoxarifado): adiciona criação de almoxarifado
test(material): adiciona testes unitários do use case de retirada
fix(auth): corrige validação de token expirado
chore(deps): adiciona biome e configura lint
```
