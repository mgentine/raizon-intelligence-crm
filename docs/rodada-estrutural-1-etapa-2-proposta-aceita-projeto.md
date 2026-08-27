# Rodada estrutural 1 — Etapa 2: proposta aceita para projeto

**Data:** 27 de agosto de 2026  
**Escopo:** integridade do caminho de aceite comercial até o setup técnico. Não foram criadas funcionalidades comerciais, tarefas-modelo ou alterações visuais.

## Resultado executivo

> **Resultado comprovado após a correção:** o aceite de uma proposta e o setup automático de execução agora ocorrem no mesmo commit transacional. Se a criação do projeto ou de qualquer item do checklist falhar, o status da proposta não é confirmado como `accepted` e não permanece nenhum projeto ou checklist parcial.

## 1. Operações e caminhos reais confirmados

| Entrada / operação | Implementação real localizada | Gravações realizadas | Estado |
|---|---|---|---|
| Alterar status de proposta | `proposals.updateStatus` no router chama `updateProposalStatus` em `server/db.ts`. | Atualiza a proposta; no destino `accepted`, cria ou reutiliza o setup de execução. | **COMPROVADO**. |
| Criar projeto de forma explícita | `execution.createFromProposal` chama `createExecutionProjectFromProposal`. | Cria ou retorna projeto por proposta; cria checklist de documentos. | **COMPROVADO**. |
| Criar tarefa | `execution.createTask` chama `createProjectTask`. | Insere uma tarefa somente após existir projeto. | **COMPROVADO**. |
| Alterar checklist | `execution.updateChecklistStatus` chama `updateProjectChecklistStatus`. | Atualiza item já existente. | **COMPROVADO**. |
| Anexar evidência | `execution.uploadEvidence` armazena arquivo no S3 e depois chama `createProjectEvidence`. | Persiste metadados de evidência; valida que `taskId`, quando informado, pertence ao projeto. | **COMPROVADO**. |

## 2. Mapa exato do aceite para execução

```text
proposals.updateStatus({ id, status: "accepted" })
  └─ updateProposalStatus(id, "accepted", reviewedBy)
       └─ withTransactionRetry(db.transaction(...))
            ├─ SELECT proposta FOR UPDATE
            ├─ validar transição comercial e conteúdo mínimo
            ├─ UPDATE proposals.status = "accepted"
            ├─ SELECT execution_projects por proposalId
            │    └─ se existir: retornar o projeto existente (idempotência)
            ├─ INSERT execution_projects
            │    ├─ proposalId, opportunityId e companyId da proposta
            │    ├─ ownerId = usuário responsável pelo aceite
            │    ├─ title derivado do número da proposta
            │    └─ snapshots de escopo, entregáveis, premissas, exclusões e documentos
            ├─ dividir requiredDocumentsSnapshot em itens
            └─ INSERT project_checklist para todos os documentos requeridos
                 └─ COMMIT único; qualquer erro implica ROLLBACK integral
```

### Estruturas criadas automaticamente no aceite

| Estrutura | Regra aplicada | Responsável / prazo | Classificação |
|---|---|---|---|
| `proposals` | O status muda para `accepted` somente dentro da transação. | `reviewedBy` recebe o usuário que confirmou o aceite. | **COMPROVADO**. |
| `execution_projects` | Um único projeto por proposta. Reutiliza o existente se o aceite for reexecutado. | `ownerId` recebe o usuário do aceite. O título padrão é `Execução — {número da proposta}`. `startAt` e `dueAt` não são presumidos. | **COMPROVADO**. |
| Snapshots do projeto | Copia os snapshots da proposta: escopo, entregáveis, premissas, exclusões e documentos requeridos. | Congelados no momento do setup; não dependem de alteração posterior do catálogo. | **COMPROVADO**. |
| `project_checklist` | Cada linha/segmento não vazio de `requiredDocumentsSnapshot` torna-se item obrigatório. | `ownerId` recebe o usuário do aceite. Não há prazo automático porque a proposta não fornece prazo de documento individual. | **COMPROVADO**. |
| `project_tasks` | **Não é criado automaticamente.** Não existe no modelo atual um catálogo de tarefas-padrão ou regra de geração de tarefas por serviço. | Tarefa é criada depois pelo procedimento próprio `execution.createTask`. | **COMPROVADO**; não é lacuna transacional do setup atual. |
| `project_evidence` | **Não é criado automaticamente.** Evidências dependem de arquivo efetivamente enviado e são tratadas em fluxo posterior. | Ao receber `taskId`, o sistema exige vínculo com o mesmo projeto. | **COMPROVADO**. |
| Outras gravações | O fluxo não cria lead, atividade, notificação nem muda a etapa da oportunidade. | Não aplicável. | **COMPROVADO**. |

## 3. Garantias incorporadas

| Risco original | Controle aplicado | Evidência |
|---|---|---|
| Proposta aceita sem projeto/checklist | Status `accepted`, projeto e checklist estão na mesma transação. | Teste de rollback simulado e leitura do helper. |
| Dois projetos para a mesma proposta | Lock pessimista na proposta + `UNIQUE(execution_projects.proposalId)` + retorno do projeto existente. | Migration `0020_glamorous_paper_doll.sql`, introspecção do banco e teste de reexecução. |
| Concorrência ou conflito transacional no TiDB | `FOR UPDATE` e retry limitado a três tentativas para conflitos transitórios. | Código e testes de retry. |
| Projeto sem snapshots técnicos | Inserção lê snapshots diretamente da proposta bloqueada. | Leitura do helper e teste do payload. |
| Checklist parcialmente criado | Insert do projeto e batch de checklist participam da mesma transação. | Teste que simula falha no checklist: nenhum update ou insert é confirmado. |
| Evidência apontando para tarefa de outro projeto | Validação no helper e FKs físicas de projeto/tarefa. | Teste estrutural e `createProjectEvidence`. |

## 4. Constraints físicas verificadas

A migration `0020_glamorous_paper_doll.sql` foi aplicada após checagem de duplicidades e referências órfãs. O banco TiDB ativo confirma `UNIQUE(execution_projects.proposalId)`, `UNIQUE(proposals.seriesKey, proposals.version)` e FKs restritivas entre proposta, projeto, tarefas, checklist e evidências. O ledger `__drizzle_migrations` foi reconciliado de 1 para **21 hashes distintos**, e `pnpm drizzle-kit migrate` não tentou reaplicar DDL.

## 5. Testes e validação

| Validação | Resultado |
|---|---|
| Teste atômico do aceite e criação do setup | **3/3 aprovados**: commit conjunto, rollback por falha de checklist e reexecução idempotente. |
| Testes de integridade estrutural e retry | **8/8 aprovados**. |
| Suíte completa | **84/84 testes aprovados em 18 arquivos**. |
| TypeScript | `pnpm exec tsc --noEmit` concluído sem erros. |
| Build de produção | `pnpm build` concluído com sucesso. O warning de bundle acima de 500 kB permanece fora do escopo de integridade. |

## 6. Limites declarados

| Ponto | Situação | Classificação |
|---|---|---|
| Teste de falha contra banco físico | O rollback foi testado com transação determinística simulada; não há banco de teste isolado para injetar falha real no TiDB sem tocar o dado operacional. | **NÃO VALIDADO** em integração física. |
| Teste de duas sessões TiDB simultâneas | Locks, unicidade e retry foram inspecionados e cobertos por contratos, mas não foi executado stress test concorrente contra o banco operacional. | **NÃO VALIDADO** como carga real. |
| Tarefas-padrão automáticas | Não existe regra de domínio para gerá-las; não foi inventado template. O projeto nasce íntegro sem tarefas e tarefas só podem ser adicionadas após sua existência. | **COMPROVADO**. |
| Arquivo em S3 sem metadado em caso de falha posterior | Upload de evidência ocorre antes de persistir seus metadados. Pode deixar objeto S3 não referenciado se a persistência falhar; não altera o aceite nem o setup do projeto. | **INFERIDO** e fora do fluxo de aceite desta etapa. |

## Conclusão

O estado `accepted` não pode mais ser persistido pelo caminho normal da aplicação sem que o projeto e seus itens de checklist sejam criados no mesmo commit ou que a transação seja revertida. O comportamento é idempotente para reexecuções e protegido contra duplicação pela combinação de lock, retry e constraint física. Tarefas e evidências não fazem parte do setup automático atual e não foram simuladas ou introduzidas nesta rodada.
