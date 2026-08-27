# Rodada estrutural 2 — auditoria inicial de domínio

**Data:** 27 de agosto de 2026  
**Escopo:** Proposal, Opportunity, Company, Lead, ExecutionProject, dinheiro, timezone, archive e constraints derivadas.  
**Regra operacional:** nenhuma migration, alteração de registro ou redesign foi realizado nesta auditoria.

## Proteções P0 confirmadas

A implementação atual mantém a criação de projeto derivado de proposta em transação, com lock pessimista, idempotência protegida por `UNIQUE(execution_projects.proposalId)`, checklist atômico e retry limitado. A edição de proposta após emissão/aceite/vínculo e mutações de tarefas/checklist após encerramento também possuem testes de regressão. O schema e a migration 0020 registram as constraints críticas. **COMPROVADO** por `server/db.ts`, `drizzle/schema.ts`, `drizzle/0020_glamorous_paper_doll.sql`, `server/execution-project-atomicity.test.ts` e `server/structural-integrity.test.ts`.

## Modelo atual confirmado

| Entidade | Modelo efetivamente persistido/exposto | Classificação |
|---|---|---|
| Proposal | Um único `status` contém revisão técnica, revisão comercial, aprovação interna, emissão, envio, negociação e decisão final: `draft`, `technical_review`, `commercial_review`, `approved_internal`, `issued`, `sent`, `negotiating`, `accepted`, `rejected`, `cancelled`. | **COMPROVADO:** mistura dimensões conceituais; ainda não foi alterado. |
| Opportunity | `stage` contém aquisição, qualificação, proposta, negociação, ganho e também pós-venda/execução: inclui `execution`, `delivery`, `closed` e `aftercare`. | **COMPROVADO:** há sobreposição com o ciclo operacional. |
| Company | `relationshipStatus` é `prospect`, `client` ou `inactive`, exposto em criação, listagem e atualização de clientes. | **COMPROVADO:** identidade da empresa e relação comercial estão acopladas. |
| Lead | Possui `companyId`, `source`, prioridade, `commercialStatus`, próxima ação e dados regulatórios; `commercialStatus` replica parte do vocabulário comercial da Opportunity. | **COMPROVADO:** possui dados de origem/regulatórios próprios, mas a fronteira com Opportunity ainda precisa de decisão de consolidação. |
| ExecutionProject | Usa `status` com `planning`, `in_progress`, `blocked`, `delivered`, `accepted`, `closed`, `cancelled`. | **COMPROVADO:** `blocked` é status/fase atual; não há `project_blockers` no schema. |

## Avaliações de domínio

A recomendação preliminar é **não substituir estados nem remover colunas nesta etapa**. A correção segura exige uma matriz de transições real, inventário de dados persistidos e compatibilidade de leitura. Para Proposal, a separação entre ciclo documental e decisão é conceitualmente justificável, mas a aplicação atual possui regras, follow-ups, PDF/DOCX e transições acopladas ao `status`; portanto a mudança demanda migration aditiva e dual-read. Para Opportunity, a retirada dos estágios pós-venda deve ser avaliada junto ao fluxo da Central de Execução, não por renomeação isolada. Para Company, uma empresa pode atender múltiplas oportunidades, mas não há autorização para backfill ou mudança de registros nesta rodada de auditoria. Para Lead, existem atributos regulatórios que não devem ser descartados; a redundância comercial deve ser mapeada antes de congelar gravações. Para blockers, o arquivo recomenda avaliar uma estrutura própria, mas criar essa estrutura sem um fluxo operacional autorizado seria expansão de funcionalidade; fica como proposta, não como alteração aplicada.

## Dinheiro, datas e arquivo

Valores monetários persistidos em `service_catalog.basePrice`, `opportunities.estimatedValue` e `proposals.investment` usam `decimal(12,2)`. **COMPROVADO:** não há `float`/`double` no schema desses valores. Porém, cálculos de sugestão e métricas convertem valores para `Number`, o que é um risco de precisão em operações acumuladas, especialmente somas, parcelas e totais de pipeline. **COMPROVADO como risco de camada de cálculo; NÃO VALIDADO quanto a impacto nos valores reais.**

Campos de validade, vencimento e datas regulatórias usam `timestamp`, assim como instantes de criação, envio e aceite. **COMPROVADO:** não há distinção física `DATE` versus instante UTC no schema atual. A política de exibição local existe em partes da aplicação, mas uma auditoria completa de virada de dia ainda não foi executada. **NÃO VALIDADO** quanto à existência de erro operacional em registros reais.

`archivedAt` existe em unidades, contatos, atos regulatórios e arquivos de evidência; não existe nas tabelas de Proposal, Opportunity, Company, Lead ou ExecutionProject. **COMPROVADO:** o archive é parcial. Não foi executada exclusão operacional nem migration para soft delete. A necessidade de archive por entidade deve ser decidida com base no histórico e no comportamento de listagem antes de qualquer alteração.

## Decisões bloqueadas

Não serão implementados nesta etapa, sem autorização adicional e sem matriz de dados: remoção de `relationshipStatus`, consolidação de Lead, substituição de estados de Proposal/Opportunity, criação de `project_blockers`, conversão de timestamps para `DATE`, inclusão universal de `archivedAt` ou aplicação de migrations destrutivas. A próxima ação técnica recomendada é criar testes puros para dinheiro e timezone e uma matriz documental de transições, sem tocar no banco operacional. Qualquer migration deverá ser aditiva, possuir backfill explícito, verificação e rollback operacional.

## Resultado da auditoria inicial

A segunda rodada encontrou inconsistências conceituais reais, mas não há base segura para aplicar uma remodelagem automática sem risco de quebrar compatibilidade ou reinterpretar dados. O estado correto neste ponto é **auditar e preparar**, não redesenhar nem migrar silenciosamente.


## Correções técnicas aplicadas sem migration

A aritmética de preço sugerido e das métricas comerciais foi endurecida sem alterar tabelas ou registros. `shared/moneyRules.ts` usa `BigInt` para converter valores em centavos, somar, dividir parcelas e formatar BRL. `calculateSuggestedPrice` e `calculateCommercialMetrics` passaram a retornar decimais string calculados sem soma em ponto flutuante. O contrato de apresentação permanece compatível porque as funções de formatação do frontend já aceitam `string | number`.

Também foi criada `shared/timezoneRules.ts`, que formaliza a classificação de campos em `civil_date` ou `utc_instant`, valida `AAAA-MM-DD`, preserva a data civil na virada de dia e converte instantes para ISO UTC. A regra ainda não muda o schema físico: essa mudança foi deliberadamente evitada até um inventário de dados e uma migration aditiva poderem ser aprovados.

A política de archive existente foi coberta por teste puro: registros com `archivedAt` não aparecem em `onlyActive`. Não foi criado `archivedAt` universal, nem removida nenhuma coluna, tabela ou linha. A ausência de archive em Proposal, Opportunity, Company, Lead e ExecutionProject permanece uma decisão de domínio pendente, não uma falha corrigida silenciosamente.

## Validação final da rodada atual

`pnpm exec tsc --noEmit`, `pnpm test`, `pnpm build` e `git diff --check` foram executados após as alterações. Resultado: **99 testes aprovados em 21 arquivos**, TypeScript sem erro, build concluído e diff sem erro. Permanecem os avisos de configuração pnpm e chunk Vite acima de 500 kB.

> **Estado recomendado:** manter o modelo físico atual em compatibilidade, sem migration destrutiva. A próxima decisão de negócio necessária é aprovar, ou não, uma proposta de separação de estados, Company e Lead após inventário dos registros persistidos. Nenhum desses itens deve ser aplicado automaticamente.


## Compatibilidade aditiva aplicada

Foram adicionados classificadores puros em `shared/domainRules.ts`. Para Proposal, eles derivam `documentLifecycle`, `decisionStatus` e `communicationEvent` a partir do `status` legado. Para ExecutionProject, derivam `phase` e `hasOpenBlocker`, interpretando `blocked` como fase `execution` com condição de bloqueio aberta. Essa camada não cria `project_blockers`, não altera enums, não muda queries persistidas e não presume que todo bloqueio deva ser materializado como novo registro.

Os estados legados foram cobertos por testes. A separação física das dimensões continua pendente de decisão de domínio, inventário dos registros e plano de compatibilidade; portanto nenhuma migration foi gerada ou aplicada nesta extensão.
