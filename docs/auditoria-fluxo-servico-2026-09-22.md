# Auditoria do fluxo de serviço — Raizon Intelligence CRM

**Data:** 22/09/2026  
**Escopo:** catálogo de serviços → oportunidade → proposta → emissão/envio → aceite → projeto de execução → checklist, tarefas, evidências e encerramento.  
**Método:** inspeção estática do schema, procedures tRPC, helpers de banco, regras puras, componentes de interface e testes automatizados. Não foram inseridos, alterados ou removidos dados operacionais durante a auditoria.

## 1. Sumário executivo

O fluxo possui uma base estrutural sólida para **versionamento de propostas, snapshots de serviço, transações, locks pessimistas, idempotência da criação do projeto e bloqueio de mutações após encerramento**. A criação do projeto a partir de proposta aceita ocorre em transação e o banco mantém unicidade por proposta.

Foram identificados **quatro riscos de integridade que devem ser tratados antes de uma liberação operacional mais ampla**:

| Severidade | Constatação | Efeito potencial |
|---|---|---|
| **P1** | Evidências podem ser incluídas em projeto encerrado ou cancelado | Reabertura material do histórico operacional após encerramento |
| **P1** | Atualização de checklist não grava evento de auditoria | Alterações documentais ficam sem trilha equivalente à de tarefas e status |
| **P1** | Aceite e entrega não exigem evidência mínima nem aceite formal no backend | Projeto pode avançar para `delivered`/`accepted` com comprovação insuficiente |
| **P1** | Encerramento valida checklist e blockers, mas não valida tarefas abertas nem evidência de entrega | Projeto pode ser encerrado com execução incompleta |

Também foram encontrados **riscos P2 de governança e consistência comercial**: investimento zero ou negativo pode ser salvo em rascunho; data de vencimento pode preceder o início do projeto; aceite de proposta não atualiza explicitamente a etapa da oportunidade; e upload de evidência pode deixar arquivo órfão no storage quando a persistência do metadado falha.

## 2. Fluxo comprovado no código

O caminho implementado é:

1. O catálogo ativo é consultado por `serviceCatalog.isActive = 1`.
2. `createProposalFromRefs` valida empresa, oportunidade, serviço ativo e coerência entre oportunidade e empresa.
3. A proposta recebe snapshots de cliente, serviço, escopo, entregáveis, premissas, exclusões e documentos obrigatórios.
4. O ciclo documental da proposta passa por revisão, aprovação interna e emissão; a numeração anual usa lock/transação.
5. O envio registra `sentAt`; a decisão comercial aceita/rejeita/cancela a proposta.
6. No aceite, a mesma transação cria `execution_projects`, checklist derivado dos documentos obrigatórios e evento de auditoria.
7. O projeto avança por `planning → in_progress → delivered → accepted → closed`, com blockers tratados separadamente.
8. Tarefas, checklist e evidências são relacionados ao projeto; tarefas e alterações de status possuem guards de encerramento.

A idempotência de proposta aceita → projeto está comprovada pelo índice único `execution_projects_proposal_unique` e pela verificação transacional existente.

## 3. Achados detalhados

### P1-01 — Evidência pode ser anexada após encerramento ou cancelamento

**Evidência:** `server/db.ts:397-411`, função `createProjectEvidence`.

A função verifica se o projeto existe e se a tarefa pertence ao projeto, mas não bloqueia `project.status` igual a `closed` ou `cancelled`. Em contraste, `createProjectTask`, `updateProjectTaskStatus` e `updateProjectChecklistStatus` possuem essa proteção.

**Impacto:** um projeto encerrado pode receber nova evidência posteriormente, alterando a percepção histórica da execução sem uma transição formal de reabertura. Isso viola a expectativa de imutabilidade pós-encerramento e torna o estado de encerramento reversível por uma operação de upload.

**Recomendação:** adquirir lock do projeto, validar status antes do upload/persistência e rejeitar a operação para projetos encerrados ou cancelados. Se houver necessidade legítima de complemento posterior, criar uma transição explícita de reabertura, com autorização, motivo e auditoria.

**Classificação:** erro de fluxo comprovado por inspeção de código; não foi executado upload destrutivo em dado operacional.

### P1-02 — Atualização de checklist não gera audit event

**Evidência:** `server/db.ts:414-425`, função `updateProjectChecklistStatus`.

A função atualiza o status e as notas dentro de transação e usa lock do item/projeto, mas não chama `writeAuditEvent`. Tarefas (`server/db.ts:375-388`), projeto (`server/db.ts:338-357`) e evidências (`server/db.ts:397-410`) possuem eventos de auditoria correspondentes.

**Impacto:** uma alteração de documento obrigatório — inclusive de `pending` para `approved` ou `waived` — pode não deixar registro de quem alterou, quando alterou e qual era o estado anterior. Isso é especialmente relevante porque o checklist participa do critério de encerramento.

**Recomendação:** registrar evento transacional com `beforeSnapshot` e `afterSnapshot`, incluindo `projectId`, título, status anterior, status novo e notas. Cobrir com teste que confirme rollback conjunto quando o evento falhar.

**Classificação:** lacuna de rastreabilidade comprovada por inspeção de código.

### P1-03 — Entrega e aceite não exigem comprovação mínima

**Evidência:** `server/db.ts:338-357` e `shared/executionRules.ts:4-11, 43-45`.

As transições permitem `in_progress → delivered` e `delivered → accepted`. O backend não exige, para `delivered`, tarefas concluídas, evidência vinculada ou registro de entrega. Para `accepted`, `acceptanceNotes` é opcional e também não há verificação de evidência de aceite.

**Impacto:** o estado pode afirmar que o serviço foi entregue ou aceito sem que o CRM possua comprovação mínima. Isso conflita com a regra operacional de não presumir aceite, conclusão ou encerramento sem evidência documental.

**Recomendação:** definir explicitamente o critério de negócio antes de codificar. Alternativa recomendada: `delivered` exige uma entrega/evidência registrada; `accepted` exige aceite documentado ou evidência equivalente e notas obrigatórias; a transição deve registrar audit event com referência à evidência. Não aplicar automaticamente essa regra a registros históricos sem decisão de negócio.

**Classificação:** risco de desenho comprovado no contrato atual; o critério exato de aceite ainda depende de decisão operacional.

### P1-04 — Encerramento não valida tarefas abertas nem evidência de entrega

**Evidência:** `server/db.ts:347-351`.

Ao encerrar, a função valida checklist obrigatório e blockers abertos. Não consulta `projectTasks` para verificar tarefas abertas e não verifica existência de evidência ou registro formal de entrega.

**Impacto:** um projeto pode alcançar `closed` com tarefas `open`, `in_progress` ou `blocked`, desde que o checklist esteja resolvido e não haja blocker aberto. O percentual de progresso exibido na UI pode continuar inferior a 100% mesmo com status encerrado.

**Recomendação:** bloquear encerramento quando existirem tarefas ativas não concluídas, salvo tarefas explicitamente canceladas/dispensadas por decisão registrada. Definir também se a evidência é requisito técnico obrigatório ou apenas recomendação para determinados serviços.

**Classificação:** erro de consistência de estado comprovado por inspeção de código.

### P2-01 — Rascunho aceita investimento zero ou negativo

**Evidência:** `server/routers.ts:74` aceita `investment: z.string().min(1)`; `server/db.ts:171-189` persiste o valor sem validação monetária positiva. A validação `Number(current.investment) > 0` só aparece ao avançar a proposta para revisão/emissão, em `server/db.ts:213`.

**Impacto:** rascunhos inválidos podem ser criados e aparecer em listagens, gráficos e duplicações. O bloqueio posterior evita emissão, mas desloca o erro para uma etapa tardia e pode gerar confusão comercial.

**Recomendação:** validar moeda em centavos e exigir valor maior que zero na criação e edição de proposta, mantendo mensagens específicas para rascunho sem investimento apenas se o negócio realmente desejar permitir pré-cadastro.

### P2-02 — Datas de início e vencimento do projeto não são coerentes entre si

**Evidência:** `server/routers.ts:83` aceita `startAt` e `dueAt`; `server/db.ts:312-329` persiste ambos sem verificar `dueAt >= startAt`.

**Impacto:** o projeto pode nascer com prazo anterior ao início, prejudicando agenda, indicadores e priorização.

**Recomendação:** validar a relação temporal no backend. Se a data de início for omitida, definir uma política explícita para comparar o prazo com a data de criação ou aceitar o prazo sem início.

### P2-03 — Aceite da proposta não atualiza explicitamente a etapa da oportunidade

**Evidência:** `server/db.ts:241-253` atualiza a proposta e cria o projeto, mas não altera `opportunities.stage`.

**Impacto:** a oportunidade pode permanecer em `proposal`, `negotiation` ou `approved` enquanto já existe um projeto de execução. Isso cria divergência entre o funil comercial e a operação, afetando dashboards e filas.

**Recomendação:** decidir a etapa canônica após aceite. A alternativa mais coerente é atualizar a oportunidade para `execution` dentro da mesma transação, preservando audit event e evitando alteração automática para `won` se ainda não houver critério financeiro/contratual.

### P2-04 — Possibilidade de arquivo órfão no storage após falha de persistência

**Evidência:** `server/routers.ts:92` faz `storagePut(...)` antes de `createProjectEvidence(...)`.

**Impacto:** se a validação de projeto/tarefa ou a inserção do metadado falhar depois do upload, o arquivo pode permanecer no storage sem registro canônico, dificultando governança e limpeza.

**Recomendação:** executar uma validação de preflight do projeto/tarefa antes do upload e criar rotina de compensação/limpeza quando a persistência falhar. Não é possível tornar storage e TiDB uma transação ACID única; a implementação deve usar padrão de compensação e estado observável.

### P2-05 — Validação de tipo de arquivo é insuficiente

**Evidência:** `server/routers.ts:92` valida tamanho e título, mas aceita qualquer `mimeType` não vazio.

**Impacto:** o fluxo aceita conteúdo com tipo inesperado, aumentando risco operacional e de armazenamento de arquivos não previstos.

**Recomendação:** definir allowlist de MIME/extensões para evidências, normalizar nome, validar extensão compatível e registrar rejeições. A política deve contemplar PDF, imagens e formatos realmente usados pela operação.

## 4. Pontos positivos confirmados

- Serviço arquivado não pode ser selecionado por `createProposalFromRefs`, pois a consulta exige `isActive = 1`.
- Snapshots de serviço e escopo são gravados na proposta; alterações futuras no catálogo não reescrevem a proposta histórica.
- Unidade e contato são validados contra a mesma empresa da proposta.
- A proposta aceita cria projeto e checklist na mesma transação.
- Existe lock pessimista para proposta, projeto, tarefa e checklist em operações críticas.
- Há unicidade de uma execução por proposta e de versões por série.
- Tarefas e checklist são bloqueados após projeto `closed` ou `cancelled`.
- Evidência vinculada a tarefa de outro projeto é rejeitada.
- O fluxo não presume aceite no momento da emissão; a decisão comercial é separada do ciclo documental.
- Os testes atuais cobrem transições, checklist, upload, atomicidade, locks e constraints estruturais.

## 5. Itens não validados nesta auditoria

Não foram realizados teste de concorrência com alteração real em banco operacional, aceite de proposta real, encerramento de projeto real, upload em storage produtivo, validação com arquivo de cliente real ou homologação com contrato novo. Também não foi alterado o caso histórico de Guzolândia nem a proposta 58/2026.

## 6. Priorização recomendada

### Antes de liberar operação normal

1. Bloquear evidência em projeto encerrado/cancelado.
2. Auditar alterações de checklist.
3. Definir e aplicar critérios de entrega, aceite e encerramento.
4. Impedir encerramento com tarefas ativas.
5. Validar investimento positivo e coerência de datas.

### Antes de ampliar governança comercial

6. Definir atualização da etapa da oportunidade após aceite.
7. Implementar preflight e compensação de upload.
8. Restringir MIME types e extensões.

## 7. Conclusão

**Conclusão técnica:** o fluxo não apresenta uma falha estrutural P0 de atomicidade na criação de projeto, mas ainda não deve ser considerado totalmente governado para operação normal. Os controles de proposta e criação de execução são fortes; as principais lacunas estão na prova da entrega/aceite, na imutabilidade pós-encerramento e na rastreabilidade de checklist.

**Recomendação:** manter o escopo em piloto controlado e corrigir primeiro os achados P1. A correção deve ser acompanhada por testes de regressão e uma homologação com proposta efetivamente aceita, sem utilizar a proposta 58/2026 nem fabricar aceite ou encerramento histórico.
