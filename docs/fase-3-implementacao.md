# Fase 3 — Inteligência, automação e escala

## Objetivo

A Fase 3 adiciona inteligência operacional ao Raizon Intelligence CRM sem transformar inferências em fatos técnicos. O desenho adotado combina regras determinísticas, histórico de origem, automação idempotente e IA assistiva com aprovação humana.

## Entregas

### Radar operacional

A procedure `intelligence.radar` consolida atos regulatórios próximos do vencimento, recorrências pendentes, atividades atrasadas e oportunidades sem atualização recente. Cada sinal conserva a entidade de origem, empresa relacionada, data de referência e tipo de atenção. A ausência de sinais é exibida como estado vazio, não como falha.

### Indicadores comerciais

A procedure `intelligence.metrics` calcula propostas no mês, valor proposto, valor fechado, conversão sobre oportunidades decididas, ticket médio, ciclo médio de propostas aceitas e motivos de perda. Os cálculos são feitos sobre registros persistidos e as regras principais estão em `shared/intelligenceRules.ts`, permitindo teste isolado.

### Follow-up automático

Propostas nos estados `sent` ou `negotiating`, sem retorno por pelo menos três dias, tornam-se elegíveis para um follow-up. O job grava uma atividade com `automationKey` única no formato `auto_followup:proposal:{id}`. Existe uma verificação prévia e uma restrição única no banco para evitar duplicação em reprocessamentos ou chamadas concorrentes. O follow-up cria uma tarefa interna; não envia mensagem ao cliente automaticamente.

O callback é cron-only, autenticado por `sdk.authenticateRequest`, montado em `/api/scheduled/refresh-commercial-follow-ups` e também executado pelo callback regulatório existente. Chamadas que não sejam de cron recebem `403`. O callback retorna métricas de itens examinados, criados e ignorados em JSON estruturado.

### IA assistiva governada

A Central de Inteligência permite solicitar sugestão de serviço, resumo executivo ou identificação de campos faltantes. O operador fornece um snapshot de dados internos confirmados. A resposta é persistida em `intelligence_suggestions` com tipo, confiança, origem e status `pending`. Somente perfis autorizados revisam a sugestão; aprovação ou rejeição ficam registradas. A IA não cria proposta, altera cadastro, muda etapa comercial ou emite documento sem ação humana explícita.

### Validação externa controlada

A procedure `intelligence.recordValidation` registra uma consulta realizada em fonte oficial autorizada. São persistidos URL, identificador da fonte, situação publicada, vencimento, retorno essencial, confiança, responsável, data e fingerprint. A mesma combinação não é gravada duas vezes. O sistema diferencia `unverified`, `needs_review` e `confirmed`; somente o perfil técnico ou administrador pode confirmar uma validação.

A implementação não faz scraping de portais protegidos nem presume que uma fonte pública esteja disponível. Quando não houver endpoint autorizado, a última versão válida permanece preservada e a necessidade de validação é explicitada.

## Critérios de aceite

| Critério | Resultado |
|---|---|
| Radar com fontes identificáveis e estado vazio | Atendido |
| Métricas calculadas por regra testável | Atendido |
| Follow-up sem duplicação por retry ou concorrência | Atendido no código e na restrição do banco; falta teste de carga em produção |
| Callback protegido contra chamada comum | Atendido e coberto por teste |
| IA sem alteração automática de dados | Atendido |
| Aprovação humana registrada | Atendido |
| Consulta externa com fonte, retorno e confiança | Atendido como registro controlado |
| Migrações aditivas aplicadas | Atendido nas migrations 0015, 0016 e 0017 |
| Interface desktop e mobile | Atendido na revisão visual da Central |
| Operação real ponta a ponta | Pendente de piloto com dados autorizados |

## Configuração de produção

O callback deve ser agendado somente depois de publicar um checkpoint desta implementação. A plataforma precisa atingir a URL publicada, e não o endereço da sandbox. A expressão cron deve usar seis campos, em UTC, com intervalo mínimo de sessenta segundos. A criação do job deve ser feita após o usuário publicar e confirmar a configuração operacional, porque um job apontando para a sandbox não será confiável.

## Limites de uso

A Fase 3 não substitui responsável técnico, análise jurídica, consulta oficial, assinatura, fiscalização ou emissão de documento sem revisão. Indicadores não são metas automáticas; são sinais para decisão. Recomendações de serviço são hipóteses assistivas e devem ser confrontadas com escopo, risco, responsabilidade técnica, prazo e preço.
