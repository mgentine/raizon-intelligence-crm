# Rodada estrutural 1 — Auditoria de integridade antes da correção

**Data:** 27 de agosto de 2026  
**Base analisada:** revisão `b5f33dca9223559be1e99f43ec198c8ea8c61339`  
**Método:** leitura de `drizzle/schema.ts`, migrations `0012` e `0013`, `server/db.ts`, testes existentes e consultas somente leitura no TiDB ativo.

## 1. Ambiente e compatibilidade confirmados

| Verificação | Resultado | Classificação |
|---|---|---|
| Banco ativo | TiDB Serverless `8.0.11-TiDB-v8.5.3`, compatível com MySQL 8.0. | **COMPROVADO**. |
| Modo transacional | `tidb_txn_mode = pessimistic`; isolamento `REPEATABLE-READ`. | **COMPROVADO**. |
| Checks | `tidb_enable_check_constraint = OFF`. | **COMPROVADO**; checks não serão a garantia central desta rodada. |
| FKs | `foreign_key_checks = ON`; TiDB 8.5 suporta FKs efetivas criadas nessa versão. | **COMPROVADO** no ambiente e documentação oficial. [1] |
| Orfandades atuais | Nenhuma relação órfã encontrada entre propostas, projetos, checklist, tarefas, evidências e seus pais diretos. | **COMPROVADO** por consultas agregadas. |
| Duplicidades atuais | Zero propostas duplicadas por `(seriesKey, version)`, zero números duplicados por `(proposalNumber, version)` e zero projetos duplicados por `proposalId`. | **COMPROVADO** por consultas agregadas. |

## 2. Criação de projeto a partir de proposta aceita

### Fluxo real encontrado

A função `createExecutionProjectFromProposal` em `server/db.ts` inicia uma transação, localiza a proposta, exige o status `accepted`, consulta um eventual projeto existente e, se necessário, insere o projeto e depois o checklist na mesma transação. Assim, uma falha no insert do checklist faz rollback do projeto recém-criado.

| Controle atual | Estado | Classificação |
|---|---|---|
| Exigir proposta existente e aceita | Verificado no helper. | **COMPROVADO**. |
| Projeto e checklist no mesmo `db.transaction` | Verificado no helper. | **COMPROVADO**. |
| Retorno idempotente em reexecução sequencial | Retorna o ID existente quando a consulta encontra projeto anterior. | **COMPROVADO** para chamadas sequenciais. |
| Proteção contra duas transações simultâneas | Consulta “verifica e depois insere” sem lock de proposta e sem unicidade de `proposalId`. | **P0 COMPROVADO**: duas chamadas concorrentes podem não enxergar o projeto uma da outra e inserir duplicados. |
| Unicidade física por proposta | `execution_projects.proposalId` possui somente índice não único. | **P0 COMPROVADO**. |

## 3. Propostas, versões e numeração anual

### Criação e versão de proposta

`createProposalFromRefs` lê empresa, oportunidade, serviço e a maior versão da série e insere uma nova linha fora de transação. `createProposalVersion` lê a versão indicada e insere `current.version + 1`, também fora de transação. O schema atual tem unicidade em `(proposalNumber, version)`, mas `proposalNumber` pode ser `NULL`; por semântica SQL, múltiplos valores `NULL` podem coexistir em índice único.

| Risco | Evidência | Classificação |
|---|---|---|
| Versões duplicadas em concorrência | Não há transação/lock na criação e não existe unicidade em `(seriesKey, version)`. | **P0 COMPROVADO**. |
| Duplicação a partir de versão antiga | `createProposalVersion` usa `current.version + 1`, sem consultar a maior versão da série. | **P0 COMPROVADO**: pode colidir quando já existir versão posterior. |
| Número anual repetido | Há unicidade por `(proposalNumber, version)` e sequência anual por chave primária `year`. | **PARCIALMENTE CONTROLADO**. |
| Emissão concorrente da mesma proposta | `issueProposal` é transacional, mas lê proposta sem `FOR UPDATE`. Duas transações podem capturar `approved_internal` e alocar dois números; a última atualização pode sobrescrever a anterior. | **P0 INFERIDO COM ALTA CONFIANÇA** a partir do fluxo e do modo transacional; requer teste concorrente de banco para demonstrar a interleaving exata. |
| Corrupção parcial na emissão | Atualização de sequência e proposta ocorrem na mesma transação. | **COMPROVADO COMO PROTEGIDO** contra rollback parcial comum. |

## 4. Constraints físicas e integridade referencial

Não há chaves estrangeiras físicas em `proposals`, `execution_projects`, `project_checklist`, `project_tasks` ou `project_evidence`; a consulta a `information_schema.key_column_usage` retornou zero FKs nesse conjunto. As relações são representadas por colunas `int`, por validação em código e por índices simples.

| Relação crítica | Estado antes da correção | Risco |
|---|---|---|
| `proposals → companies/opportunities/service_catalog` | Sem FK. | Inserção ou atualização manual pode criar proposta órfã. |
| `execution_projects → proposals/opportunities/companies` | Sem FK e sem `UNIQUE(proposalId)`. | Órfão e projeto duplicado. |
| `project_checklist/project_tasks → execution_projects` | Sem FK. | Itens órfãos em caso de alteração manual. |
| `project_evidence → execution_projects/project_tasks` | Sem FK. | Evidência pode ficar órfã. |
| Evidência e tarefa | `createProjectEvidence` confirma projeto, mas não confirma que `taskId` pertence ao mesmo `projectId`. | **P0 COMPROVADO** de corrupção referencial cruzada possível. |

## 5. Cobertura de testes antes da correção

Os testes de execução cobrem transições, checklist, uploads e progresso como regras puras. Os testes de proposta cobrem preço, transições, perfis e fontes do snapshot. Não existe teste de integração que exercite transação com rollback, duas criações simultâneas de projeto, duas emissões simultâneas ou tentativa de vincular evidência a tarefa de outro projeto.

> **COMPROVADO:** 73 testes estão aprovados, mas eles não demonstram as garantias P0 desta rodada. “Suíte verde” não é evidência de concorrência segura.

## 6. Escopo mínimo recomendado de correção

1. Tornar `execution_projects.proposalId` único e aplicar a migration somente depois de confirmar inexistência de duplicados, já verificada.
2. Tornar `(proposals.seriesKey, proposals.version)` único e serializar criação/versionamento pelo lock da oportunidade dentro da transação.
3. Fazer `issueProposal` bloquear a linha da proposta com `FOR UPDATE`; manter o incremento da sequência e a emissão na mesma transação.
4. Adicionar FKs físicas `RESTRICT` para o agregado crítico de proposta/execução, sem redefinir a semântica comercial nem criar cascatas destrutivas.
5. Validar em código que uma evidência com `taskId` aponta para tarefa do mesmo projeto.
6. Cobrir rollback, idempotência, colisão única e concorrência com testes determinísticos/mocks de transação, sem inserir dados fictícios no banco operacional.

## Referência externa

[1] [TiDB — FOREIGN KEY Constraints](https://docs.pingcap.com/tidb/stable/foreign-key/). A documentação informa suporte efetivo a foreign keys desde TiDB 6.6 e disponibilidade geral na linha 8.5; também alerta para impacto de lock em cenários de alta concorrência.
