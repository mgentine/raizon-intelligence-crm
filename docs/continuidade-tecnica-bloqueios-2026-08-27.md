# Continuidade técnica — decisões, bloqueios e critérios de liberação

**Data do registro:** 27 de agosto de 2026  
**Origem:** instruções explícitas do responsável pelo CRM.  
**Regra operacional:** nenhuma validação técnica poderá criar, alterar ou simular registros operacionais enquanto não houver dado real e autorização específica para a respectiva etapa.

## 1. Decisões vigentes

| Frente | Decisão | Situação de execução |
|---|---|---|
| Autenticação própria | Manter Manus OAuth. Login/senha, recuperação de acesso e MFA foram congelados até decisão futura. | **BLOQUEADO por decisão de negócio**. |
| Base de clientes | Arquivo real CSV/XLSX poderá ser processado somente em prévia/staging, com mapeamento, normalização, duplicidades, conflitos e relatório. | **AGUARDA arquivo real**; persistência definitiva exige validação posterior da prévia. |
| Conflitos de importação | A lógica poderá ser homologada apenas com arquivo real fornecido. | **AGUARDA dado real**; proibido fabricar conflitos ou modificar clientes para criar cenário. |
| CETESB | Usar exclusivamente atos já existentes no CRM cuja origem CETESB esteja documentada. | **AUTORIZADA somente análise/leitura**; não inferir regularidade, criar atos ou realizar scraping. |
| Agenda recorrente | Não criar recorrência de teste em empresa real. | **AGUARDA indicação de registro real** para homologação. |
| Execução ponta a ponta | Não alterar a proposta nº 58/2026, que permanece `issued`. | **AGUARDA proposta com aceite comercial confirmado** e autorização expressa para a conversão em projeto. |
| Fontes externas e jobs | Não ativar ingestão automática de CETESB/SP Águas em produção. | **BLOQUEADO** até fonte/API/exportação oficialmente adequada e definição operacional. |

## 2. Critérios objetivos de liberação

| Atividade | Pré-requisito mínimo | Ação permitida após liberação |
|---|---|---|
| Prévia de importação de clientes | Arquivo identificado, autorização de leitura e mapeamento mínimo de CNPJ/razão social. | Criar staging, normalizar, detectar conflitos e emitir relatório sem alterar entidades canônicas. |
| Aplicação de importação | Aprovação explícita do relatório de prévia, com regra para cada conflito. | Persistir somente as operações aprovadas, com auditoria de origem. |
| Homologação da execução | Proposta com aceite confirmado, responsável e autorização de alteração de status. | Converter em projeto, conferir checklist, tarefas/evidências e registrar resultado real. |
| Agenda recorrente | Registro real indicado e autorização explícita para criar/concluir recorrência. | Executar uma única jornada controlada e verificar reflexo no dashboard. |
| Automação externa | Fonte oficial utilizável, escopo, frequência, responsável e política de exceção definidos. | Habilitar job idempotente inicialmente sob observação, sem contornar bloqueios externos. |

## 3. Trabalho técnico autorizado enquanto há bloqueios

Estão autorizadas revisões de código, testes determinísticos, validações de schema, leitura de dados já existentes e documentação de riscos. Caso uma verificação identifique defeito puramente técnico que possa ser corrigido sem escrita em dados operacionais, a correção poderá prosseguir com teste e registro de evidência.

Não estão autorizados: inserção de empresas, contatos, atos, oportunidades, propostas, projetos, tarefas, checklist, recorrências, conflitos ou notificações para demonstrar funcionalidade; alteração da proposta nº 58/2026; ingestão automática de fontes externas; ou qualquer mecanismo de coleta que contorne login, CAPTCHA, bloqueio ou condições de acesso da fonte.

## 4. Limites conhecidos

O CRM possui fluxos e testes de contrato para prévia de importação, conflito, recorrência e execução. Entretanto, a efetividade operacional desses fluxos com dados reais permanece **NÃO VALIDADA** até que os pré-requisitos da seção 2 sejam atendidos. Essa condição não deve ser tratada como falha do dado, nem ser mascarada por seed ou simulação persistida.

## 5. Auditoria técnica e correções autorizadas

### 5.1 Importação de clientes: prévia persistida antes da base canônica

Foi identificado que a interface montava uma prévia local, mas a mutation `companies.bulkUpsert` criava um `import_run` e atualizava ou inseria empresas diretamente. A apresentação de “prévia” não era suficiente para assegurar staging: a confirmação representava escrita definitiva na base canônica.

O caminho público foi substituído por `companies.previewImport`. A nova operação cria `import_runs`, persiste cada linha em `import_staging`, normaliza o conteúdo, registra duplicidade interna e divergências contra a empresa canônica em `import_conflicts`, e finaliza o lote como `review_required`. O retorno apresenta quantidade de linhas válidas, rejeitadas, conflitos, duplicidades, inclusões potenciais, atualizações potenciais e registros inalterados. Ela não executa `INSERT` ou `UPDATE` em `companies`.

| Verificação | Classificação | Evidência |
|---|---|---|
| A antiga mutation pública fazia escrita canônica imediata | **COMPROVADO** | Leitura de `companies.bulkUpsert` no router e de `bulkUpsertCompanies` no helper anterior. |
| A prévia atual persiste apenas artefatos de revisão | **COMPROVADO** | `createCompanyImportPreview` usa `import_runs`, `import_staging` e `import_conflicts`; teste de contrato exige ausência de escrita em `companies`. |
| CNPJ inválido não pode tornar-se apto por preenchimento com zeros | **COMPROVADO** | `isValidCnpj` passou a exigir 14 dígitos, rejeitar repetição e validar os dois dígitos verificadores; teste de regressão incluído. |
| Aplicação definitiva após aprovação humana | **BLOQUEADA** | Não foi criada nesta rodada, conforme orientação do usuário. Dependerá de aprovação explícita do relatório de prévia e regras de decisão por conflito. |
| Prévia com arquivo real fornecido pelo usuário | **NÃO VALIDADA** | Nenhum arquivo operacional foi recebido ou processado nesta etapa. |

### 5.2 Callbacks periódicos: proteção contra ativação acidental

Os endpoints periódicos existentes permanecem montados e exigem identidade cron. Porém, antes desta revisão, uma eventual ativação de job autorizado poderia atualizar atos, criar tentativas de fonte, executar follow-ups, gerar notificações e tentar envio de e-mail. Isso contrariaria a decisão de manter automações externas e escritas operacionais desativadas.

Foi inserido um bloqueio explícito de modo `disabled_pending_authorization`. Após validar a identidade cron, os dois callbacks retornam sucesso controlado com `skipped`, sem acessar banco, criar registros, executar follow-ups ou enviar e-mail. A listagem somente-leitura da plataforma não identificou jobs associados ao projeto no momento da verificação.

| Verificação | Classificação | Evidência |
|---|---|---|
| Há jobs de plataforma ativos associados ao projeto | **COMPROVADO: não foram encontrados** | Consulta somente leitura retornou total `0`. |
| Callback cron não autorizado | **COMPROVADO** | Teste mantém resposta `403` antes de acesso ao banco. |
| Callback cron autorizado enquanto automação está bloqueada | **COMPROVADO** | Testes asseguram retorno `skipped` sem banco, notificações, e-mail, tentativas de fonte ou follow-up. |
| Ingestão automática CETESB/SP Águas | **BLOQUEADA** | Fontes permanecem sem endpoint/exportação oficialmente autorizado; não houve scraping, CAPTCHA ou chamada externa. |
| Homologação do gráfico com subconjunto CETESB documentado | **NÃO VALIDADA** | Foi realizada somente consulta agregada em leitura; a ferramenta não retornou linhas de amostra para confirmação da cobertura documental. |

### 5.3 Resultado de validação

Após as correções, `pnpm exec tsc --noEmit`, `pnpm test`, `pnpm build` e `git diff --check` concluíram sem erro. A suíte alcançou **94 testes aprovados em 20 arquivos**. O build continua com aviso pré-existente de chunk Vite superior a 500 kB; trata-se de tema de desempenho de bundle, não de persistência, staging ou autorização de importação.

> **Próximo passo bloqueado:** receber CSV/XLSX real para executar somente a prévia persistida. O relatório resultante deverá ser submetido à aprovação explícita antes de qualquer mutation que aplique inclusão ou alteração em empresas canônicas.
