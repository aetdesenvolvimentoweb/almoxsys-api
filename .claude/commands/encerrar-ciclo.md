---
description: Encerramento de ciclo de módulo — gates técnicos, revisão de consistência (spec, OWASP, arquitetura, docs) e atualização da memória
argument-hint: "[módulo encerrado, ex: militar]"
allowed-tools: Bash, Read, Edit, Write, Grep, Glob
---

Você está encerrando o ciclo de desenvolvimento do módulo: **$ARGUMENTS**
(se vazio, infira o módulo pelos commits recentes em `git log` e diga qual assumiu).

Execute o checklist abaixo **em ordem**. Produza um relatório final conciso com
o status de cada seção (✅ / ⚠️ / ❌) e, ao fim, atualize a memória. Não conserte
nada automaticamente sem antes listar os achados — só corrija o trivial (typo de
doc, import não usado) avisando; o que exigir decisão, **pergunte**.

---

## 1. Gates técnicos (rode de fato; cole a conclusão, não o output inteiro)

- `JWT_SECRET=test-secret bun test` — todos passando? quantos?
- `bun run typecheck` — limpo?
- `bunx biome ci .` — limpo?
- `bun audit` — sem vulnerabilidades?

Se algum falhar, **pare aqui**, reporte a falha com o trecho relevante do output
e pergunte como proceder antes de seguir para a análise.

## 2. Consistência: especificado × desenvolvido

Leia `REQUISITOS.md` e compare com o código:
- Os domínios, perfis e regras de negócio do módulo encerrado estão implementados
  conforme a especificação? (entidades, atributos, matriz de permissões)
- Há divergências entre o que o REQUISITOS pede e o que existe em `src/`?
- O versionamento `/api/v1` foi respeitado nas rotas novas?

## 3. Aderência ao OWASP Top 10

Percorra as 10 categorias e marque cada uma como coberta / n.a. / pendente para o
módulo encerrado. Atenção especial (conforme CLAUDE.md):
- A01 — RBAC nos use cases (não nos controllers); JWT em middleware antes dos handlers.
- A02/A04 — hash de senha nunca retornado em resposta; dados sensíveis fora das views.
- A03 — todo input validado/sanitizado na borda (Zod).
- A05 — secure headers, CORS restrito, rate limiting nas rotas públicas.
- A07 — política de senha; mensagens de auth genéricas (anti-enumeração).
- A09 — logs não vazam segredos/senhas.
Cruze com a memória `seguranca-owasp-pendencias` e aponte regressões ou novos gaps.

## 4. Aderência aos preceitos de arquitetura (CLAUDE.md)

- **Hexagonal**: dependências apontam para dentro (`infrastructure` → `core`, nunca o contrário); use cases dependem só de ports.
- **CQRS**: commands alteram estado (retornam void/id); queries são puras; um use case por arquivo.
- **YAGNI/DRY/KISS**: sem over-engineering nem abstração prematura; duplicação extraída para `shared/`/`domain/` quando faz sentido.
- **Padronização**: exports nomeados (sem `default export`); sem `any` implícito; erros de domínio como classes tipadas; estrutura de testes espelhada a `src/`.

## 5. Consistência da documentação

- **TSDoc** presente e útil (o *porquê*, não o *quê*) em ports, entidades, erros tipados e DTOs públicos.
- **OpenAPI**: toda rota nova tem `summary`, `tags` e schemas de request/response; o schema Zod é a fonte única (sem duplicar validação).
- `CLAUDE.md` e `REQUISITOS.md` continuam coerentes com o que foi construído; `.env.example` reflete novas variáveis.

## 6. Atualização da memória

Edite os arquivos de memória do projeto (use os caminhos que aparecem no índice
`MEMORY.md`):
- **estado-desenvolvimento** — registre o módulo encerrado, o que passou a existir, contagem de testes e quaisquer pegadinhas/decisões não óbvias. Converta datas relativas em absolutas.
- **seguranca-owasp-pendencias** — mova o que foi resolvido para "já resolvido" (com commit) e reordene as pendências.
- **Próximos passos** — atualize/registre o que vem a seguir e suas dependências (se não houver memória dedicada e a lista crescer, crie uma `proximos-passos`; senão, mantenha dentro de estado-desenvolvimento). Adicione o ponteiro em `MEMORY.md` se criar arquivo novo.

Antes de salvar, cheque se já existe memória cobrindo o ponto e **atualize-a** em vez de duplicar.

---

## Relatório final

Resuma em uma tabela: seção → status → 1 linha. Liste explicitamente:
- achados que exigem decisão do André (com sua recomendação);
- o que você corrigiu trivialmente;
- o próximo passo sugerido.
Não faça commit — deixe a cargo do André.
