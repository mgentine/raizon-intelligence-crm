# Resumo executivo — Raizon Intelligence CRM

**Data de consolidação:** 27 de agosto de 2026  
**Versão técnica de referência:** [`cae1c37d`](manus-webdev://cae1c37d)  
**Ambiente de pré-visualização:** [Raizon Intelligence CRM](https://3000-i05a5ooadi9yezpo7bsuq-9b02eb63.us4.manus.computer)  
**Classificação:** plataforma técnico-comercial pronta para **piloto operacional controlado**, não substituta de responsável técnico, consulta oficial, assinatura, ERP financeiro ou fiscalização.

> **Decisão central de arquitetura:** CNPJ consolida a empresa, mas não substitui a unidade operacional, o ato regulatório, a evidência de origem nem o estágio comercial. O CRM trata cada uma dessas dimensões separadamente para reduzir conclusões indevidas.

## 1. Síntese executiva

O **Raizon Intelligence CRM** foi desenvolvido como um sistema web verticalizado para a operação de consultoria ambiental, SST e SSMA. Ele organiza a jornada desde a identificação de um potencial cliente por CNPJ e sinal regulatório até a qualificação comercial, proposta versionada, aceite, execução técnica, entrega, pós-venda e recorrências. O desenho prioriza rastreabilidade, governança de escopo, separação de responsabilidades e uso de evidências, em vez de automações que “preenchem lacunas” sem comprovação.

O núcleo comercial está conectado a uma base canônica de empresas, unidades, contatos, oportunidades, atividades, propostas e serviços. O núcleo regulatório mantém atos, versões, fontes, evidências e validação pendente/confirmada separados do funil comercial. Sobre essas bases, a Fase 3 acrescentou radar operacional, indicadores, notificações, follow-ups idempotentes, consulta externa registrada e IA assistiva sob revisão humana.

O caso real da proposta nº **58/2026**, relacionado à Sibelco Brasil/Tansa Indústria Química Ltda., foi usado como primeira evidência operacional. O documento foi preservado como evidência, a empresa e a oportunidade foram registradas, a proposta ficou como **emitida** — sem ser artificialmente tratada como aceite —, as quatro captações ficaram marcadas como dados documentais que exigem validação, e uma atividade de histórico foi vinculada à empresa e à oportunidade.

| Resultado atual | Situação |
|---|---|
| Base cadastral e comercial | Implementada e disponível no CRM. |
| Propostas PDF e Word | Implementadas a partir de snapshots congelados. |
| Execução técnica | Implementada; aguardando um aceite/contrato real para teste ponta a ponta. |
| Inteligência e automações | Implementadas em nível de piloto, com cron-only e idempotência. |
| Conectores regulatórios oficiais em lote | Estrutura pronta, mas bloqueada até API/exportação autorizada. |
| Autenticação própria com senha/MFA | Deliberadamente adiada; o sistema usa Manus OAuth. |

## 2. Evolução do sistema

| Etapa | Entregas principais | Resultado de negócio |
|---|---|---|
| Diagnóstico e pré-mortem | Benchmark de CRMs, jornada, riscos, fluxo de importação idempotente e separação regulatório/comercial | Definição de uma arquitetura própria para consultoria ambiental/SST, sem depender de CRM genérico. |
| Fase 1 — base comercial | Perfil mestre Raizon, catálogo, preço sugerido, propostas, revisão, emissão, versão e numeração anual | Proposta passa a ser documento comercial governado e auditável. |
| Fase 2 — execução | Projeto derivado de proposta aceita, checklist, tarefas, progresso, evidências S3, entrega e aceite | Venda aceita pode se converter em frente técnica com escopo congelado. |
| Fase 3 — inteligência | Radar, métricas, follow-up idempotente, validação externa registrada e IA assistiva | A operação passa a receber sinais e recomendações, sem transformar sugestão em decisão. |
| Refinamentos operacionais | CNPJ com fallback, PDF/Word, alertas de validade, cards mobile, swipe demonstrativo, correções de governança | Melhoria efetiva do uso diário em campo, comercial e celular. |

## 3. Funcionalidades implementadas

### 3.1 Cadastro, relacionamento e jornada comercial

O CRM possui uma ficha canônica de empresa com CNPJ normalizado, razão social, nome fantasia, porte, CNAE, endereço, município, UF, contatos, segmento, notas e status de relacionamento (**prospect**, **cliente** ou **inativo**). O formulário oferece máscaras de CNPJ e CEP, carregamento durante consulta e permite edição manual para evitar que uma fonte pública sobrescreva informação comercial confirmada.

Unidades operacionais, contatos e atividades são vinculados à empresa. Contatos podem ser associados a unidades e oportunidades, enquanto atividades registram canal, objetivo, resultado, próxima ação, prazo e responsável. A tela de histórico traz seções contextuais por empresa e oportunidade, evitando um histórico solto sem referência de negócio.

| Módulo | Capacidades entregues |
|---|---|
| Empresas | Cadastro manual e por CNPJ, filtros por prospect/cliente/inativo, dados editáveis, origem e data de consulta. |
| Unidades | Cadastro, edição e arquivamento por empresa, endereço, operação e responsável local. |
| Contatos | Inclusão no contexto da empresa, papel decisório, validação, edição e arquivamento. |
| Leads | Fonte, motivo do candidato, prioridades técnica/comercial, próxima ação e status comercial independente. |
| Oportunidades | Valor estimado, responsável, prazo crítico, próxima ação, entregáveis, pendências, motivo de perda e transições controladas. |
| Atividades | Histórico contextual, próxima ação, vínculo com empresa/oportunidade e registro de follow-up. |
| Recorrências | Obrigações com prazo, responsável, vínculo opcional ao ato e conclusão persistida. |

### 3.2 Inteligência regulatória e importações

Atos regulatórios são entidades próprias e podem representar licenças, processos, outorgas ou outros registros. Cada ato preserva tipo, órgão, número, processo, status publicado bruto, vencimento, fonte, URL de evidência e notas. O valor publicado não é apagado pelo status normalizado; o CRM calcula um estado de operação para priorização, preservando a fonte original.

Um controle corrigido durante o uso real garante que um ato com `needsValidation = 1` seja exibido como **Validação pendente**, mesmo se houver vencimento futuro. Isso impede que a mera data extraída de um PDF seja interpretada como regularidade confirmada. Evidências regulatórias são armazenadas em S3, enquanto o banco guarda apenas metadados, vínculo, URL/chave, fonte, responsável e data.

O módulo de importação assistida prevê mapeamento de colunas, prévia, normalização de CNPJ/datas/municípios, staging, conflitos, decisão humana, `import_runs`, versão da origem e auditoria. Ele está preparado para arquivo oficial fornecido; não há scraping silencioso de portais protegidos ou inferência de ausência de licença quando uma fonte falha.

### 3.3 Motor comercial e propostas

O catálogo de serviços armazena ficha técnica reutilizável: categoria, órgão provável, UF, resumo, escopo, entregáveis, documentos, exclusões, premissas, visitas, preço-base e chave de template. O preço sugerido pode considerar porte, complexidade, distância, urgência, visitas e qualidade documental, porém o valor final depende de aprovação humana.

Ao criar uma proposta, a interface exige empresa e oportunidade coerentes, serviço, profissional, valor, condição de pagamento, validade, observações e informações pendentes. Os profissionais controlados são **Miguel Gentine** e **Laleska Fernanda**. A proposta congela snapshots do cliente, serviço, escopo, entregáveis, premissas, exclusões e documentos necessários; alterações futuras no catálogo não reescrevem a versão já negociada.

| Recurso de proposta | Regra implementada |
|---|---|
| Status | Rascunho, revisão técnica, revisão comercial, aprovada internamente, emitida, enviada, negociação, aceita, recusada e cancelada. |
| Governança de transição | Backend impede emissão sem aprovação interna e bloqueia transições/perfis incompatíveis. |
| Numeração e versão | Sequência anual `NNN/AAAA`; nova versão preserva número e incrementa a versão. |
| Painel | Pesquisa, filtros por status/profissional, ordenação, valor por status, carteira e alertas de validade. |
| Mobile | Cards empilhados, ações acessíveis e swipe para alterar status/cancelar com confirmação; modo de demonstração é local e não persiste. |
| PDF | Documento profissional montado pelos snapshots confirmados. |
| Word | Arquivo `.docx` no layout comercial Raizon, com acesso geral e direto no card ao lado do PDF. |

O Word inclui cabeçalho institucional, identificação da proposta, resumo do cliente, resumo executivo, escopo, entregáveis, investimento, pagamento, validade, premissas, exclusões, documentos iniciais e responsável técnico. A exportação de PDF e Word é deliberadamente bloqueada no modo de demonstração, pois os três cards demonstrativos existem apenas em memória para testar gesto e ordenação.

### 3.4 Execução técnica e entrega

Uma proposta só pode criar projeto de execução quando seu status é **accepted**. Nesse momento, o CRM copia os snapshots comerciais para `execution_projects`; cria checklist de documentos, tarefas técnicas, responsáveis, prazos e espaço para evidências. Há status de planejamento, execução, bloqueio, entrega, aceite, fechamento e cancelamento.

O painel de execução calcula progresso geral, de tarefas e de checklist. Tarefas canceladas não reduzem o percentual; documentos obrigatórios aprovados ou dispensados contam como resolvidos. Arquivos técnicos ficam em S3 em caminho separado das evidências regulatórias e têm limite de 5 MB no fluxo atual.

## 4. Arquitetura, linguagem e código

O projeto é uma aplicação web full-stack em **TypeScript**, com frontend React e backend Node/Express. A comunicação de negócio usa **tRPC**, ou seja, as operações são contratos tipados entre interface e servidor, sem criar uma camada REST paralela para as entidades do CRM. Validações de entrada usam **Zod** e o banco relacional usa **Drizzle ORM** sobre MySQL/TiDB.

| Camada | Tecnologias e responsabilidade |
|---|---|
| Linguagem | TypeScript 5.9, módulos ECMAScript. |
| Frontend | React 19, Vite 7, Tailwind CSS 4, Radix/shadcn, Lucide, Recharts e Wouter. |
| Backend | Node.js, Express 4, tRPC 11, SuperJSON, Zod e Manus OAuth. |
| Dados | MySQL/TiDB via Drizzle ORM; schema em `drizzle/schema.ts` e migrations aditivas. |
| Arquivos | AWS SDK/S3; banco contém metadados e referências, nunca bytes/BLOB. |
| Documentos | jsPDF 4.2 para PDF e `docx` 9.7 para Word. |
| Mensageria | Nodemailer para SMTP Titan/HostGator, com segredos fora do código. |
| IA | Integração interna `invokeLLM` com saída JSON estruturada e aprovação humana. |
| Qualidade | Vitest, TypeScript (`tsc --noEmit`), Vite build e Esbuild do servidor. |

### Modelo de dados

O schema concentra as entidades de identidade (`users`), cadastro mestre (`raizon_profiles` e `service_catalog`), empresas (`companies`, `units`, `contacts`), regulatório (`regulatory_acts`, `regulatory_versions`, `evidence_files`), comercial (`leads`, `opportunities`, `proposals`, `proposal_sequences`), execução (`execution_projects`, `project_tasks`, `project_checklist`, `project_evidence`) e inteligência/operação (`activities`, `recurring_items`, `import_runs`, `import_staging`, `import_conflicts`, `notifications`, `intelligence_suggestions`).

O princípio de modelagem é o seguinte: **empresa não é oportunidade; oportunidade não é proposta; proposta emitida não é proposta aceita; ato documentado não é ato confirmado; evidência técnica não é evidência regulatória.** Essa separação muda a qualidade da gestão e da responsabilização.

## 5. APIs, rotas internas e integrações

### Contratos internos

As operações do aplicativo são expostas em `POST /api/trpc` por namespaces. Abaixo estão os principais grupos; a lista detalhada de inputs, validações Zod e RBAC está em `server/routers.ts`.

| Namespace tRPC | Operações principais |
|---|---|
| `auth` | Sessão atual e logout por Manus OAuth. |
| `raizon` | Consulta e atualização do cadastro mestre. |
| `companies`, `units`, `contacts` | Cadastro, edição, arquivamento e consulta contextual. |
| `cnpj` | Consulta e cadastro assistido pela resposta pública. |
| `leads`, `opportunities`, `activities`, `recurring` | Jornada comercial, transições, histórico, agenda e recorrência. |
| `regulatory`, `evidence`, `imports` | Atos, evidências, importações, conflitos e decisões auditáveis. |
| `services`, `proposals` | Catálogo, templates, criação, versão, emissão, status e painel comercial. |
| `execution` | Criação por proposta aceita, tarefas, checklist, status e evidências técnicas. |
| `intelligence`, `dashboard`, `notifications` | Radar, métricas, follow-up, IA, validação externa, gráficos, agenda e alertas. |

### Integrações externas e situação atual

| Serviço/fonte | Uso no CRM | Situação |
|---|---|---|
| [BrasilAPI — CNPJ](https://brasilapi.com.br/api/cnpj/v1/) | Consulta cadastral primária por CNPJ. | Ativa como primeira tentativa. |
| [CNPJ.ws — API pública](https://docs.cnpj.ws/referencia-de-api/api-publica/consultando-cnpj) | Fallback quando a rota primária falha, bloqueia ou retorna indisponível. | Ativa como fallback; respeitar a limitação publicada pelo provedor. [1] |
| [Conecta gov.br — Consulta CNPJ](https://www.gov.br/conecta/catalogo/apis/consulta-cnpj) | Alternativa oficial prevista no adapter substituível. | Depende de adesão, credenciais e autorização. [2] |
| [CETESB — Consulta de processo](https://licenciamento.cetesb.sp.gov.br/cetesb/processo_consulta.asp) | Referência para fonte pública e importação assistida. | Não há integração de lote habilitada sem endpoint/exportação autorizado. [3] |
| [SP Águas — Outorgas](https://www.spaguas.sp.gov.br/site/outorga/) | Referência de outorgas, validação humana e documentação de serviço. | Não há ingestão automática em lote sem canal autorizado. [4] |
| S3 configurado pelo projeto | Templates, evidências regulatórias e técnicas. | Ativo; metadados no banco, arquivos fora dele. |
| Titan/HostGator SMTP | Teste manual e digest de novas notificações. | Adapter implementado; teste operacional real depende de segredos e configuração da conta. [5] [6] |
| LLM interno | Sugestão de serviço, resumo e campos faltantes. | Ativo somente como sugestão pendente, revisável por humano. |

> **Observação de governança:** CETESB e SP Águas não são tratados como “API disponível” apenas porque têm páginas públicas. O CRM registra fonte, preserva a última versão válida e bloqueia atualização automática quando não houver endpoint ou arquivo oficialmente autorizado.

### Rotas agendadas

| Rota | Finalidade | Proteção |
|---|---|---|
| `POST /api/scheduled/refresh-regulatory-priorities` | Recalcula prioridades, registra bloqueios de fonte, cria notificações e executa follow-ups elegíveis. | Cron-only autenticado; chamadas comuns recebem bloqueio. |
| `POST /api/scheduled/refresh-commercial-follow-ups` | Cria atividade interna para propostas enviadas/em negociação sem resposta por 3+ dias. | Cron-only e `automationKey` única por proposta. |

Essas rotas são código pronto para agendamento, mas não devem apontar para a sandbox. A configuração operacional só faz sentido depois da publicação do aplicativo e de uma definição explícita de frequência, responsável e monitoramento.

## 6. Segurança, governança e qualidade

O login atual usa Manus OAuth; a autenticação local com senha, recuperação e MFA foi explicitamente adiada. O backend aplica RBAC com perfis **admin**, **commercial** e **technical** antes de operações sensíveis. Por exemplo: configurações mestre são administrativas; atos/evidências e importações são de admin/técnico; oportunidades e propostas são de admin/comercial; o perfil técnico só pode encaminhar proposta para revisão técnica.

Segredos SMTP permanecem no mecanismo de Secrets. O CRM não os expõe em logs, respostas ou telas. Os callbacks agendados são protegidos contra chamadas HTTP comuns, uploads têm limite de tamanho e registros arquivados são filtrados das views operacionais. A IA recebe somente o snapshot informado pelo operador e não pode emitir proposta, mudar funil, criar obrigação ou confirmar irregularidade sem decisão humana.

| Evidência de qualidade mais recente | Resultado |
|---|---|
| Verificação TypeScript | Aprovada com `pnpm exec tsc --noEmit`. |
| Testes automatizados | **73 testes Vitest aprovados** em 15 arquivos. |
| Build de produção | Aprovado com `pnpm build`. |
| Documento Word | DOCX real gerado a partir da proposta persistida nº 58/2026, com estrutura validada. |
| Responsividade | Revisões em 1280×720, 768×1024 e 390×844 nas telas críticas; cards de propostas e atos ajustados. |
| Migrações | Aplicadas de forma aditiva, incluindo evidências, inteligência, validações externas, profissional e premissas de proposta. |

O build apresenta somente aviso de bundle JavaScript acima de 500 kB. Isso não bloqueia a operação atual, mas recomenda evolução de code-splitting/dynamic import para reduzir tempo de carregamento à medida que o sistema crescer.

## 7. Caso real já cadastrado: proposta nº 58/2026

| Campo | Estado registrado |
|---|---|
| Cliente | Tansa Indústria Química Ltda. / Sibelco Brasil, confirmado no cadastro público consultado. |
| Serviço | Renovação de Outorgas de Uso de Recursos Hídricos Subterrâneos. |
| Situação comercial | **Emitida**. Não há aceite, contrato ou execução presumidos. |
| Evidência | PDF original associado ao CRM; dados de outorga extraídos como informação documental. |
| Atos/captações | Quatro registros vinculados, todos com **Validação pendente** até conferência de ato completo/processo/fonte oficial. |
| Histórico | Atividade vinculada a empresa e oportunidade, com próxima ação de solicitar documentos técnicos e atos integrais. |
| Documento comercial | Exportação PDF e Word baseada nos snapshots preservados. |

## 8. Pendências materiais e recomendação

As pendências restantes não são “falhas escondidas”; elas dependem de evidência ou decisão que não deve ser simulada. Ainda faltam: uma planilha real para importar clientes/atos e validar conflitos; uma obrigação real para testar agenda recorrente completa; dados CETESB autorizados para gráfico populado; aceite/contrato para iniciar execução ponta a ponta; configuração de fonte autorizada para automações regulatórias; e, caso se deseje operar fora da infraestrutura atual, decisão de escopo para autenticação própria.

A recomendação é conduzir um **piloto com um serviço recorrente e um cliente real autorizado**, utilizando o fluxo completo: cadastro por CNPJ, conferência da documentação, oportunidade, proposta, eventual aceite, projeto de execução, checklist, evidência, entrega e encerramento. Antes de escalar, medir conversão, prazo de resposta de propostas, pendências por projeto e percentual de registros com fonte/evidência.

## 9. Referências e links

[1] [CNPJ.ws — Consulta na API pública](https://docs.cnpj.ws/referencia-de-api/api-publica/consultando-cnpj)  
[2] [Conecta gov.br — API Consulta CNPJ](https://www.gov.br/conecta/catalogo/apis/consulta-cnpj)  
[3] [CETESB — Consulta de processo](https://licenciamento.cetesb.sp.gov.br/cetesb/processo_consulta.asp)  
[4] [SP Águas — Outorgas](https://www.spaguas.sp.gov.br/site/outorga/) e [Legislação de Outorgas](https://www.spaguas.sp.gov.br/site/portariasdeoutorgas/)  
[5] [HostGator — Configuração Titan em aplicativos externos](https://suporte.hostgator.com.br/hc/pt-br/articles/30813560087571-Como-enviar-e-receber-e-mails-Titan-por-aplicativos-externos)  
[6] [Titan — Configuring Titan on Email Scripts](https://support.titan.email/hc/en-us/articles/4405162224665-Configuring-Titan-on-Email-Scripts)

### Referências internas principais

| Documento/arquivo | Conteúdo |
|---|---|
| `drizzle/schema.ts` | Modelo de dados e relações do CRM. |
| `server/routers.ts` | Contratos tRPC, entradas validadas e RBAC. |
| `server/db.ts` | Persistência, agregações, radar e operações de domínio. |
| `client/src/pages/Home.tsx` | Shell, navegação e telas principais. |
| `client/src/components/ProposalCenterView.tsx` | Formulário, painel, PDF/Word, alertas, swipe e modo de demonstração. |
| `docs/fase-1-implementacao.md` | Base comercial e propostas. |
| `docs/fase-2-implementacao.md` | Execução, evidências e critérios de aceite. |
| `docs/fase-3-implementacao.md` | Radar, automação, IA e validações externas. |
| `docs/revisao-proposta-58-2026.md` | Revisão e cadastro governado do primeiro caso real. |
| `docs/pendencias-evidencia-real.md` | Insumos necessários para concluir validações sem dados fictícios. |
