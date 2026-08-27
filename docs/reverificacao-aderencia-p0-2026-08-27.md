# Reverificação de aderência — integridade P0

**Data:** 27 de agosto de 2026  
**Origem:** instruções reenviadas pelo responsável do CRM.  
**Método:** inspeção do schema, migration e helpers atuais, seguida de `pnpm exec tsc --noEmit`, `pnpm test`, `pnpm build` e `git diff --check`. Nenhum dado operacional foi criado, alterado ou excluído nesta reverificação.

## Resultado objetivo

| Critério do arquivo | Resultado | Classificação |
|---|---|---|
| Baseline, auditoria e migrations reproduzíveis | Registrados em `docs/rodada-estrutural-1-baseline-antes.md`, `docs/rodada-estrutural-1-auditoria.md` e migration `0020_glamorous_paper_doll.sql`. | **COMPROVADO**. |
| Aceite de proposta e setup técnico em transação única | `updateProposalStatus` usa transação, lock da proposta e cria/reutiliza projeto e checklist no mesmo commit. | **COMPROVADO**. |
| Idempotência de um projeto por proposta | Lock da proposta, recuperação de chave duplicada e `UNIQUE(execution_projects.proposalId)`. | **COMPROVADO**. |
| Versionamento de proposta | Lock de oportunidade e `UNIQUE(proposals.seriesKey, version)`. | **COMPROVADO**. |
| Numeração anual | A sequência é tratada sob transação e lock; a proteção de versão/série está declarada no schema e na migration. | **COMPROVADO** pela implementação e testes de contrato. |
| Integridade de tarefa/checklist após encerramento | Tarefa e checklist usam transação, lock do projeto e bloqueio em `closed`/`cancelled`. | **COMPROVADO**. |
| Falha parcial | Testes determinísticos cobrem rollback do aceite, criação de projeto e checklist. | **COMPROVADO** em simulação controlada. |
| TypeScript | Concluído sem erro. | **COMPROVADO**. |
| Testes | **94 testes aprovados em 20 arquivos**. | **COMPROVADO**. |
| Build de produção | Concluído sem erro. | **COMPROVADO**. |

## Limites que permanecem

| Limite | Estado |
|---|---|
| Teste de estresse com 50 sessões físicas concorrentes contra TiDB | **NÃO VALIDADO**. Não foi executado contra o banco operacional para evitar escrita e risco indevidos. |
| Falha injetada no driver/TiDB real durante o commit | **NÃO VALIDADO**. O rollback foi validado em teste determinístico. |
| Aviso de bundle Vite | Persistente para chunk de aproximadamente 1,75 MB (cerca de 470 kB gzip); fora do escopo de integridade P0. |
| Aviso de configuração pnpm | Persistente para chaves `pnpm` no `package.json`; fora do escopo de integridade P0. |

> **Conclusão:** a integridade P0 está **PARCIALMENTE ELIMINADA**. As invariantes essenciais de aplicação e banco foram implementadas e validadas por testes determinísticos, mas a concorrência sob carga física no TiDB e a injeção de falha real não foram homologadas no ambiente operacional.
