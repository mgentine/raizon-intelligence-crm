# Rodada estrutural 1 — Baseline antes das alterações

**Data:** 27 de agosto de 2026  
**Objetivo da rodada:** eliminar riscos P0 de criação de projeto a partir de proposta aceita, transações, idempotência, concorrência, numeração anual de propostas, constraints críticas e corrupção parcial de dados.  
**Regra de coleta:** nenhum arquivo de código, schema ou migration foi alterado antes deste registro. O único diff local no instante da captura é o acréscimo de itens de controle desta rodada em `todo.md`.

## 1. Identificação do estado inicial

| Item | Estado | Classificação |
|---|---|---|
| Revisão Git | `b5f33dca9223559be1e99f43ec198c8ea8c61339` | **COMPROVADO** por `git rev-parse HEAD`. |
| Alterações locais | `todo.md`: 9 linhas adicionadas; nenhum arquivo de código, schema ou migration modificado. | **COMPROVADO** por `git status --short` e `git diff --stat`. |
| Arquivos não rastreados | Nenhum no momento da coleta. | **COMPROVADO** por `git ls-files --others --exclude-standard`. |
| Tipo do projeto | Aplicação TypeScript com React/Vite no cliente, Express/tRPC no servidor e Drizzle ORM/MySQL/TiDB. | **COMPROVADO** por `package.json`, `server/routers.ts` e `drizzle/schema.ts`. |

## 2. Árvore relevante lida

Foram inspecionados os diretórios e arquivos de produto relevantes, excluindo `node_modules`, `dist`, `.git` e logs gerados. A árvore confirma os seguintes pontos de entrada: `drizzle/schema.ts`, migrations numeradas em `drizzle/`, `server/db.ts`, `server/routers.ts`, `server/scheduled.ts`, regras puras em `shared/`, testes em `server/*.test.ts` e a interface em `client/src/`.

Também foram localizados os artefatos diretamente ligados ao escopo P0: `shared/proposalRules.ts`, `shared/executionRules.ts`, `server/proposal.rules.test.ts`, `server/execution.rules.test.ts`, a tabela `proposal_sequences` e as tabelas `proposals`, `execution_projects`, `project_tasks`, `project_checklist` e `project_evidence`.

## 3. Migrations e schema no baseline

O repositório contém **20 migrations locais**, de `0000_curious_marvex.sql` a `0019_odd_cobalt_man.sql`, todas registradas no journal Drizzle. Os arquivos tiveram checksum SHA-256 capturado durante a coleta, preservando um ponto de comparação para esta rodada.

| Grupo de schema | Estruturas observadas | Constraints/índices presentes |
|---|---|---|
| Numeração de propostas | `proposal_sequences(year PK, nextNumber)` | Chave primária anual. |
| Propostas | `proposals` com `seriesKey`, `version`, `proposalNumber`, snapshots e `investment` obrigatório | Índices em série, oportunidade e status; unicidade em `(proposalNumber, version)`. |
| Execução | `execution_projects` com `proposalId`, `opportunityId`, `companyId` e snapshots | Índices em proposta, empresa e status; **não há unicidade declarada em `proposalId` no schema atual**. |
| Tarefas/checklist/evidências | `project_tasks`, `project_checklist`, `project_evidence` | Índices por projeto; evidências têm índice opcional de tarefa. |
| Idempotência já existente | `activities.automationKey`, `leads(source, sourceRecordKey)`, versões regulatórias e staging | Índices únicos específicos para esses fluxos. |

> **INFERIDO:** a ausência de `uniqueIndex` em `execution_projects.proposalId` permite, em nível de banco, mais de um projeto para a mesma proposta. A confirmação de que isso pode ser explorado por chamadas concorrentes depende da leitura do helper de criação e de teste com banco transacional.

> **NÃO VALIDADO:** a equivalência entre o journal/migrations do repositório e a tabela de controle de migrations do banco ativo ainda não foi consultada. Também não foram verificados os DDLs físicos, chaves estrangeiras ou nível de isolamento efetivo no banco nesta etapa inicial.

## 4. Testes, TypeScript e build antes de alterações

| Comando executado | Resultado | Evidência / aviso |
|---|---|---|
| `pnpm exec tsc --noEmit` | **Passou** | Sem erros TypeScript. O pnpm alertou que configurações sob a chave `pnpm` de `package.json` são ignoradas na versão em uso. |
| `pnpm test` | **Passou** | 15 arquivos de teste; **73 testes aprovados**; duração de 1,77 s. |
| `pnpm build` | **Passou** | Vite transformou 2.645 módulos e Esbuild gerou o bundle do servidor. |

### Warnings de build registrados

1. O pnpm informa que `pnpm.patchedDependencies` e `pnpm.overrides` em `package.json` não são mais lidos nessa configuração. Isso é risco de reprodutibilidade de dependências, não falha funcional comprovada do CRM.
2. O Vite reporta chunk pós-minificação de aproximadamente **1,75 MB** (cerca de **470 kB gzip**) e recomenda code splitting. É risco de desempenho inicial, não P0 de corrupção de dados e está fora do escopo de correção desta rodada.

## 5. Riscos existentes observáveis antes da auditoria de implementação

| Risco | Evidência inicial | Classificação | Prioridade nesta rodada |
|---|---|---|---|
| Projeto duplicado para uma mesma proposta | `execution_projects.proposalId` possui índice simples, sem unicidade declarada. | **INFERIDO** até inspeção de `createExecutionProjectFromProposal`. | P0. |
| Corrupção parcial ao criar projeto, checklist e tarefas | O schema envolve múltiplas tabelas; ainda não foi confirmada transação única no helper de persistência. | **NÃO VALIDADO**. | P0. |
| Concorrência na numeração anual | Há tabela anual `proposal_sequences`, porém o padrão de incremento ainda não foi inspecionado. | **NÃO VALIDADO**. | P0. |
| Garantia de unicidade de número por proposta | O índice atual é `(proposalNumber, version)`, o que permite, em tese, mesmo número em séries diferentes se a regra de aplicação falhar. | **INFERIDO**; a intenção de `seriesKey` ainda será comparada ao código. | P0. |
| Chaves estrangeiras físicas | O schema Drizzle usa campos de ID, mas não declara referências explícitas nas tabelas críticas observadas. | **COMPROVADO** no schema; existência de FKs físicas no banco é **NÃO VALIDADA**. | P0. |

## 6. Próximo passo controlado

A próxima etapa será exclusivamente de leitura: localizar e examinar as funções reais de criação/versionamento de proposta e de criação de projeto, junto com os testes existentes e DDLs de migrations correspondentes. Nenhuma correção será aplicada antes de mapear os pontos de falha parcial, as garantias atuais e a semântica real das tabelas.
