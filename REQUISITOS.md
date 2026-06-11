# ALMOXSYS-API

## Visão Geral

Sistema de controle de almoxarifado, estoque e inventário desenvolvido para Organizações Bombeiro Militar. Permite o gerenciamento centralizado de múltiplos almoxarifados com controle de acesso por perfil de usuário.

---

## Domínios do Sistema

### Almoxarifado
- Entidade raiz do sistema — unidade principal de armazenamento.
- Possui um ou mais Almoxarifes responsáveis.

### Divisão
- Subdivisão física de um almoxarifado (prateleira, armário, seção, etc.).

### Categoria
- Classificação dos materiais e equipamentos.

### Material / Equipamento
- Item de consumo ou permanente cadastrado em um almoxarifado.
- Atributos: nome, categoria, divisão, quantidade, data de validade (quando aplicável).

### Patrimônio
- Subtipo de Material/Equipamento para itens permanentes, identificados por número de patrimônio.

---

## Perfis de Acesso

| Perfil | Descrição |
|--------|-----------|
| **Administrador** | Desenvolvedor do sistema. Acesso irrestrito. Único que pode gerenciar outros Administradores. |
| **Chefe** | Usuário master da organização. Acesso a todas as funcionalidades, exceto gerenciamento de Administradores. |
| **Almoxarife** | Gestor de almoxarifados específicos. Acesso restrito aos almoxarifados em que está cadastrado. Não pode cadastrar Almoxarifes ou ACAs. |
| **ACA** (Auxiliar do Chefe de Área) | Registra retiradas de materiais. Não pode cadastrar/excluir materiais nem acessar gerenciamentos de outros perfis. |

### Matriz de Permissões

| Funcionalidade | Administrador | Chefe | Almoxarife | ACA |
|----------------|:---:|:---:|:---:|:---:|
| Gerenciar Administradores | ✓ | ✗ | ✗ | ✗ |
| Gerenciar Chefes | ✓ | ✗ | ✗ | ✗ |
| Gerenciar Almoxarifados | ✓ | ✓ | Próprios | ✗ |
| Cadastrar Almoxarifes / ACAs | ✓ | ✓ | ✗ | ✗ |
| Gerenciar Divisões | ✓ | ✓ | Próprios | ✗ |
| Gerenciar Categorias | ✓ | ✓ | ✓ | ✗ |
| Cadastrar / Excluir Materiais | ✓ | ✓ | ✓ | ✗ |
| Registrar Retirada de Material | ✓ | ✓ | ✓ | ✓ |
| Consultar Estoque | ✓ | ✓ | Próprios | Próprios |

---

## Funcionalidades Principais

- **Controle de acesso** baseado em perfis (RBAC)
- **Gestão de almoxarifados** — criação e edição
- **Gestão de divisões** — organização física interna do almoxarifado
- **Gestão de categorias** — classificação dos itens
- **Gestão de materiais/equipamentos** — cadastro, atualização e controle de estoque
- **Controle de validade** — gestão de itens com data de vencimento
- **Controle de patrimônio** — itens permanentes identificados por número de patrimônio
- **Registro de movimentações** — entradas e saídas de materiais

---

## Stack Tecnológica

- **Runtime:** Bun
- **Framework HTTP:** Hono
- **Linguagem:** TypeScript
