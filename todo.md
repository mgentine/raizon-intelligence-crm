# Project TODO

- [ ] Autenticação com login, senha, recuperação de acesso e controle por perfis
- [x] Layout autenticado com navegação para dashboard, leads, empresas, atos regulatórios, oportunidades, atividades e configurações
- [x] Modelo canônico de empresas por CNPJ
- [x] Cadastro de unidades operacionais e contatos
- [x] Cadastro de licenças, processos, outorgas e evidências regulatórias
- [x] Pipeline comercial específico da Raizon Ambiental
- [x] Responsáveis, próximas ações, atividades, propostas e motivos de perda
- [x] Histórico de relacionamento por empresa e oportunidade
- [x] Importação assistida de bases CETESB e SP Águas
- [x] Normalização de CNPJ, telefones, e-mails, datas e municípios
- [x] Deduplicação por CNPJ e identificação de conflitos
- [x] Trilha de origem, versão da fonte e auditoria de importações
- [x] Priorização técnica separada da prioridade comercial
- [x] Painéis de pipeline, prioridades, cobertura de contato, atrasos, vencimentos e previsão de receita
- [x] Calendário de recorrência para renovações e obrigações periódicas
- [x] Notificações internas para vencimentos, tarefas atrasadas, oportunidades paradas e falhas
- [x] Estrutura de provedor para consulta cadastral de CNPJ
- [x] Estrutura de ingestão controlada para fontes públicas CETESB e SP Águas
- [x] Rotinas periódicas idempotentes para processamento de arquivos e recálculo de filas
- [x] Testes unitários do domínio e das regras de deduplicação/prioridade
- [x] Verificação visual e responsiva das telas principais
- [x] Revisão final de segurança, permissões e estados vazios/erro

# Gaps identificados na revisão

- [ ] Implementar autenticação própria com login/senha, recuperação de acesso e autorização por perfis aplicada na UI e nas procedures
- [x] Criar módulo operacional de leads separado da base de empresas
- [x] Criar CRUD completo de unidades, contatos e atos regulatórios, incluindo evidências
- [x] Completar o funil integral da Raizon com propostas, responsáveis, perda, próximas ações e histórico por empresa/oportunidade
- [x] Implementar importação assistida real com mapeamento de colunas, prévia, conflitos, import_runs e revisão humana
- [x] Adicionar normalização de telefone, e-mail, datas e municípios
- [x] Criar testes de deduplicação e conflitos entre CETESB e SP Águas
- [x] Construir painéis de cobertura de contato, previsão de receita e prioridades operacionais
- [x] Construir calendário operacional de recorrência com criação e conclusão de tarefas
- [x] Implementar notificações internas e por e-mail
- [x] Implementar adapters reais e substituíveis para CNPJ, CETESB e SP Águas, sujeitos à disponibilidade e às regras de cada fonte
- [ ] Implementar rotina periódica completa para processamento de arquivos, atualização de fontes e recálculo de filas
- [x] Corrigir responsividade mobile: sidebar colapsável e grade do dashboard adaptável
- [x] Validar visualmente e em viewport móvel/desktop todas as telas principais do CRM
- [x] Documentar a verificação responsiva por tela após revisão final do preview
- [x] Validar visualmente a tela Atividades em desktop e mobile e registrar o resultado
- [x] Criar registro curto da revisão responsiva por tela das sete views principais
- [x] Implementar sidebar mobile realmente colapsável com toggle/drawer e validar em desktop/mobile
- [x] Revalidar a correção responsiva após comprovar sidebar colapsável e grade adaptável
- [x] Implementar conclusão de itens recorrentes com status persistido no backend e ação na UI para marcar recorrência/tarefa como concluída
- [x] Adicionar testes para criação e conclusão de recorrências, incluindo estados aberto/concluído
- [ ] Validar visualmente a agenda recorrente com fluxo completo: criar, listar, concluir e refletir no dashboard
- [x] Aplicar o logotipo oficial da Raizon Ambiental no sidebar, cabeçalho, favicon/metadados e validar desktop/mobile
- [x] Remover fundo branco do logo oficial, melhorar resolução e substituir o asset no CRM
- [x] Validar visualmente o logo otimizado em desktop e mobile
- [x] Adicionar gráfico no dashboard com status atualizado dos leads importados da CETESB, usando agregação real do banco
- [ ] Testar o gráfico de status CETESB em dados vazios, dados reais e viewport mobile
- [x] Concluir pré-mortem do sistema completo antes de novas implementações e registrar riscos críticos, controles e critérios go/no-go
- [x] Documentar fluxo técnico detalhado de importação idempotente e separação entre status regulatório e comercial

# Escopo aprovado para implementação completa

- [x] Criar entidade explícita de leads com fonte, motivo do candidato, status regulatório referenciado e status comercial independente
- [x] Criar tabelas de staging, conflitos e versões de origem para importações
- [x] Criar armazenamento de metadados e upload de evidências regulatórias em S3
- [x] Implementar fila Minha agenda de hoje com leads, follow-ups, vencimentos e oportunidades paradas
- [x] Implementar transições controladas do pipeline com critérios mínimos e próxima ação
- [x] Implementar tela de revisão de conflitos com decisões aceitar/manter/revisar/rejeitar
- [x] Implementar status regulatório normalizado sem sobrescrever o valor publicado bruto
- [x] Implementar status comercial independente e gráfico comercial separado do gráfico regulatório
- [x] Aplicar autorização backend por perfil administrador, comercial e técnico
- [x] Implementar painel de saúde das fontes e idade da última carga válida
- [x] Implementar notificações agrupadas, severidade e deduplicação por entidade
- [x] Implementar estrutura substituível para CNPJ e importação assistida; bloquear CETESB/SP Águas quando não houver endpoint oficial autorizado
- [x] Implementar reprocessamento seguro e preservação da última versão válida após falha
- [x] Executar testes de autorização, idempotência, conflitos, status e notificações

# Ajustes identificados pela revisão de implementação

- [x] Implementar lógica real de Minha agenda de hoje e detecção de oportunidades paradas/sem avanço
- [x] Definir e aplicar critérios mínimos por etapa do pipeline no backend e refletir isso na UI
- [x] Integrar o status regulatório normalizado ao modelo, queries e UI sem perder o valor bruto publicado
- [x] Renderizar gráfico comercial separado usando o resumo do funil
- [x] Expandir autorização por perfil para todas as procedures e mutations sensíveis
- [x] Adicionar severidade e agrupamento às notificações no schema, backend e UI
- [x] Implementar reprocessamento transacional/seguro com preservação explícita da última versão válida

# Ressalvas finais antes do checkpoint

- [x] Restringir Minha agenda inteira à lógica de hoje/atrasado e exibir queueReason na UI para oportunidades/leads sem avanço
- [x] Definir critérios mínimos por etapa do funil no backend, incluindo contato válido, diagnóstico, proposta e motivo de perda
- [x] Normalizar status regulatório usando também expiresAt do ato relacionado e expor de forma consistente
- [x] Aplicar RBAC por perfil também às queries/listagens sensíveis de importação, conflitos, evidências e cadastros técnicos
- [x] Validar explicitamente o gráfico comercial em estados vazio, erro e mobile e registrar a cobertura

# Últimos ajustes de efetividade

- [x] Tornar obrigatória no backend a comprovação dos critérios por etapa do funil e fazer a UI enviar hasValidContact, hasDiagnosis, hasProposal e motivo de perda
- [x] Propagar o status regulatório normalizado com expiresAt para as demais listagens e visões relevantes
- [x] Adicionar tratamento e validação explícita de estado de erro para o gráfico comercial e registrar essa cobertura

# Ajustes de efetividade antes do checkpoint final

- [x] Substituir flags artificiais do funil por comprovação real no backend baseada em contatos, diagnóstico, proposta e motivo de perda persistidos
- [x] Exibir e validar o status regulatório normalizado com expiresAt nas telas de atos e visões analíticas relevantes
- [x] Forçar e revisar explicitamente o estado de erro do gráfico comercial e registrar essa cobertura visual

# Evidências finais de validação

- [x] Exibir regulatoryStatus normalizado com expiresAt também na UI de Atos regulatórios e registrar validação visual específica
- [x] Forçar uma falha controlada do dashboard.commercialFunnel, revisar a UI de erro em desktop/mobile e documentar a cobertura
- [x] Adicionar teste específico para propagação do status regulatório normalizado nas listagens de atos

# Limitações de validação com banco vazio

- [x] Validar visualmente a tela de Atos regulatórios com registros reais/populados exibindo regulatoryStatus normalizado ao lado do vencimento
- [x] Capturar e registrar explicitamente o estado de erro do funil comercial em mobile usando ?forceChartError=1
- [x] Adicionar teste de integração/unidade do contrato de listRegulatoryActs confirmando regulatoryStatus normalizado

# Correções de efetividade da governança

- [x] Adicionar ação explícita de rejeitar na tela de conflitos e validar o fluxo completo
- [x] Calcular e exibir idade da última carga válida por fonte usando import_runs concluídos
- [x] Implementar agrupamento real de notificações por groupingKey no backend e na UI

# Fechamento de governança

- [ ] Validar explicitamente a tela de Importações com conflitos reais, incluindo rejeição e atualização após decisão
- [x] Marcar todo o grupo de notificações como lido quando a ocorrência agrupada for aberta
- [x] Adicionar testes específicos para agrupamento de notificações e decisão reject de conflito

# Gaps reabertos pela auditoria de efetividade

- [x] Implementar histórico dedicado por empresa e oportunidade com atividades relacionadas
- [x] Adicionar painéis explícitos de cobertura de contato e prioridades operacionais no dashboard
- [x] Gerar notificações para oportunidades paradas e falhas de importação
- [ ] Implementar rotina periódica para processar/atualizar fontes além do recálculo atual, com bloqueio documentado quando a fonte oficial não estiver disponível
- [x] Documentar revisão final de segurança abrangendo permissões, dados sensíveis e estados de erro (docs/security-review-2026-08-26.md)
- [x] Criar UI de mapeamento manual de colunas na importação assistida
- [x] Documentar bloqueio externo verificável para conectores oficiais CETESB e SP Águas ou implementar quando houver endpoint autorizado
- [x] Adicionar teste específico para criação e conclusão de recorrências persistidas

# Estados explícitos do painel operacional

- [x] Adicionar estados de carregamento, erro e vazio ao painel de cobertura/prioridades
- [x] Validar visualmente os estados carregando, erro e sem dados do painel operacional

# Validação reproduzível de loading

- [x] Adicionar modo controlado forceCoverageLoading=1 e validar visualmente o loading do painel operacional

# Validação do mapeamento manual

- [x] Bloquear confirmação quando CNPJ ou razão social não estiverem mapeados
- [x] Exibir erro quando o remapeamento não produzir registros válidos
- [x] Criar validação reproduzível do remapeamento antes da confirmação

# Efetividade do histórico contextual

- [x] Exibir empresa e oportunidade relacionada em cada linha do histórico
- [x] Permitir registrar atividade vinculada a uma oportunidade pela UI
- [x] Criar seções contextuais claras por empresa e oportunidade, não apenas filtro por ID
- [x] Validar o histórico contextual com atividade efetivamente vinculada a oportunidade sem inserir dados artificiais no banco
- [x] Comprovar a listagem contextual da atividade real por meio da query tRPC utilizada pela tela Atividades

# Seções dedicadas de histórico

- [x] Exibir seções dedicadas “Histórico da empresa” e “Histórico da oportunidade” quando um contexto for selecionado
- [x] Validar visualmente as seções dedicadas de histórico em desktop e mobile

# Evidência mobile do histórico dedicado

- [x] Validar visualmente as seções dedicadas de histórico em viewport mobile e registrar explicitamente a evidência

# Normalização efetiva em fluxos persistidos

- [x] Aplicar normalizeDateValue em atos, atividades e recorrências antes de persistir
- [x] Aplicar normalização de município nos cadastros de empresas e unidades
- [x] Adicionar teste de procedure/fluxo persistido usando normalização de datas

# Fechamento do cadastro básico de unidades e contatos

- [x] Adicionar estados explícitos de carregamento e erro nas telas de Unidades e Contatos
- [x] Validar visualmente as telas de Unidades e Contatos também em viewport mobile
- [x] Documentar no backlog que cadastro básico não equivale a CRUD completo com edição/exclusão

# Fechamento do CRUD técnico com evidências

- [x] Integrar CRUD visual de evidências regulatórias na tela de Atos: listar anexos por ato, fazer upload real via S3, vincular/desvincular evidências e refletir o resultado na UI
- [x] Adicionar estados explícitos de carregamento/erro para a listagem de Atos regulatórios e validar visualmente edição/arquivamento em desktop/mobile
- [x] Adicionar testes cobrindo update/archive de unidades, contatos e atos, além do vínculo e exibição de evidências no contrato/backend

# Validação determinística do CRUD de Atos

- [x] Adicionar modos forceActsLoading=1 e forceActsError=1 para validar estados da listagem
- [x] Permitir validação de edição/arquivamento de ato real ou documentar bloqueio quando não houver registro populado
- [x] Adicionar teste cobrindo regulatory.update, regulatory.archive e filtro archivedAt

# Cobertura final de arquivamento técnico

- [x] Adicionar testes tRPC para units.update, units.archive, contacts.update e contacts.archive, incluindo autorização por perfil
- [x] Adicionar teste de listagem filtrada confirmando que atos e evidências com archivedAt não aparecem nas views operacionais

# Efetividade dos testes de arquivamento e RBAC

- [x] Extrair filtragem archivedAt para helper puro e testar atos/evidências arquivados fora das views
- [x] Ampliar testes de autorização para units.update, contacts.update e contacts.archive em perfis permitidos e proibidos, incluindo perfil autenticado sem autorização
- [x] Adicionar contrato de listagem operacional confirmando que registros arquivados não retornam via filtros específicos de atos/evidências

# Validação do callback periódico

- [x] Cobrir com testes o bloqueio cron-only e o formato de erro controlado do callback regulatório

# Cobertura explícita de governança

- [x] Testar a regra de idempotência de notificações abertas para evitar duplicação em reexecuções
- [x] Testar a mutation decideConflict com decisão reject, racional persistido e bloqueio para perfil comercial

# Completude do funil comercial

- [x] Implementar mutation e interface de atualização de oportunidade com responsável, próxima ação, notas, valor e motivo de perda

# Operação do funil na interface

- [x] Adicionar seletor completo de etapa e motivo de perda no card de oportunidade, com fluxo controlado, persistência atômica e regra pura testada

# Notificações por e-mail via Titan/HostGator

- [x] Configurar adapter SMTP do Titan com remetente, destinatários e variáveis seguras
- [x] Integrar envio de alertas sem duplicação e com falha observável
- [x] Adicionar testes do contrato de e-mail sem enviar mensagem real
- [x] Documentar parâmetros necessários e procedimento de teste operacional em docs/titan-smtp.md

# Validação do transporte Titan

- [x] Validar remetente, destinatários, assunto e redaction com Nodemailer mockado, sem conexão SMTP real

# Teste operacional de SMTP

- [x] Adicionar mutation protegida para teste manual de e-mail Titan, restrita a administrador e sem disparo automático

# Interface de teste SMTP

- [x] Adicionar botão de teste SMTP na tela de Configurações, visível somente para administrador

# Correção do erro SMTP 535

- [x] Tratar falha de autenticação Titan 535 com erro operacional seguro e orientado, com validação após atualização segura dos segredos
- [x] Adicionar teste do mapeamento de erro SMTP sem expor usuário ou senha, incluindo erro bruto do transporte

# Base de clientes reais

- [x] Definir entidade/status de cliente ativo separada de lead, sem duplicar empresas por CNPJ
- [ ] Adicionar importação governada da base de clientes com prévia, mapeamento, conflitos e auditoria
- [x] Criar filtros de clientes ativos, inativos e leads na consulta de empresas
- [ ] Validar carregamento com arquivo real fornecido pelo usuário, sem fabricar registros

# Cadastro e conversão lead-cliente

- [x] Adicionar botão destacado para cadastrar empresa diretamente na base
- [x] Criar regra de conversão de lead qualificado em cliente base sem duplicar empresa por CNPJ
- [x] Exibir avanço do lead até cliente e preservar histórico de atividades e oportunidades
- [x] Testar conversão, duplicidade por CNPJ e autorização por perfil

# Acesso rápido ao cadastro

- [x] Adicionar atalho “Cadastrar cliente” no dashboard principal

# Preenchimento automático por CNPJ

- [x] Consultar dados cadastrais ao informar CNPJ válido no cadastro de cliente
- [x] Preencher campos sem sobrescrever informações já editadas manualmente
- [x] Exibir loading, erro e retorno não encontrado da consulta cadastral
- [x] Testar normalização de CNPJ e preenchimento editável no contrato do formulário

# Diagnóstico da consulta CNPJ

- [x] Diferenciar CNPJ inválido, empresa não encontrada e indisponibilidade do provedor
- [x] Exibir mensagem orientada sem bloquear o preenchimento manual
- [x] Testar os três estados do provider cadastral

# Fallback da consulta CNPJ após HTTP 403

- [x] Adicionar fallback cadastral quando a rota principal retornar 403
- [x] Preservar distinção entre CNPJ não encontrado e provedor bloqueado/indisponível
- [x] Testar 403, fallback bem-sucedido e falha conjunta dos provedores

# Contatos dentro da ficha da empresa

- [x] Remover Contatos da navegação lateral e da aba independente
- [x] Incorporar listagem e cadastro de contatos ao contexto da empresa/cliente
- [x] Preservar vínculos de contatos com unidades, atividades e oportunidades
- [x] Validar permissões, estados vazio/erro e responsividade da seção contextual

# Ampliação do cadastro de cliente — solicitação 27/08/2026

- [x] Adicionar campos cadastrais, endereço, operação e relacionamento ao formulário de cliente
- [x] Persistir os novos campos no modelo canônico de empresas sem quebrar registros existentes
- [x] Manter o preenchimento automático por CNPJ sem sobrescrever dados editados manualmente
- [x] Adicionar testes e validar o formulário ampliado em desktop e mobile

# Autofill cadastral de endereço e porte — solicitação 27/08/2026

- [x] Adicionar porte empresarial ao modelo e ao formulário de cliente
- [x] Normalizar endereço retornado pelos provedores BrasilAPI e CNPJ.ws
- [x] Preencher endereço e porte por CNPJ sem sobrescrever edições manuais
- [x] Testar o contrato cadastral e validar a exibição desktop/mobile

# UX da consulta por CNPJ — solicitação 27/08/2026

- [x] Exibir loading visual durante a consulta cadastral por CNPJ
- [x] Aplicar máscaras automáticas de CNPJ e CEP durante a digitação
- [x] Exibir mensagens claras para CNPJ inválido e empresa não encontrada
- [x] Testar regras de máscara, estados de erro/loading e responsividade

# Jornada ponta a ponta do cliente — solicitação 27/08/2026

- [x] Definir jornada do primeiro contato ao pós-atendimento com etapas e critérios de passagem
- [x] Conectar a jornada a lead, empresa, contato, oportunidade, atividades, atos, recorrências e histórico
- [x] Implementar no CRM os estados de diagnóstico, proposta, contratação, execução, entrega, encerramento e pós-venda
- [x] Exibir responsável, próxima ação, prazo, entregáveis e pendências em cada etapa
- [ ] Testar o fluxo ponta a ponta sem inserir dados artificiais e validar desktop/mobile

# Fluxograma da jornada do cliente — solicitação 27/08/2026

- [x] Gerar fluxograma visual e fonte editável da jornada ponta a ponta do cliente

# Correção de consultas do dashboard — solicitação 27/08/2026

- [x] Diagnosticar a divergência de schema que quebra recorrências e atividades
- [x] Corrigir a migration/estrutura do banco sem remover dados existentes
- [x] Validar as queries, testes e dashboard após a correção

# Análise de evolução para sistema técnico-comercial — solicitação 27/08/2026

- [x] Analisar viabilidade da arquitetura de propostas, catálogo, operação, financeiro e Radar
- [x] Separar capacidades implementáveis, dependências externas e controles obrigatórios
- [x] Priorizar roadmap por valor, risco e esforço sem iniciar módulos não aprovados

# Roadmap em três fases — solicitação 27/08/2026

- [x] Reorganizar a evolução do sistema técnico-comercial em três fases
- [x] Definir entregas, dependências, critérios de aceite e limites de cada fase

# Fase 1 — base comercial e motor de propostas — solicitação 27/08/2026

- [x] Implementar cadastro mestre da Raizon com dados da contratada e assinatura padrão
- [x] Implementar catálogo de serviços com escopo, entregáveis, documentos, exclusões e premissas
- [x] Implementar regras de precificação sugerida com aprovação manual
- [x] Implementar propostas com rascunho, revisão, emissão, numeração anual e versionamento
- [x] Implementar governança de origem, informações pendentes e cláusulas obrigatórias
- [x] Adicionar testes e validar o fluxo da Fase 1 em desktop e mobile

# Auditoria da Fase 1 — solicitação 27/08/2026

- [x] Auditar consistência entre schema, migrations e banco da Fase 1
- [x] Auditar procedures, RBAC, transições e snapshots de propostas
- [x] Auditar telas, fluxo de uso, estados vazios/erro e responsividade
- [x] Corrigir inconsistências encontradas e reexecutar validações
- [x] Registrar conclusão da auditoria com ressalvas verificáveis

# Fase 2 — conversão da venda em execução técnica — solicitação 27/08/2026

- [x] Criar projeto de execução a partir de proposta aceita
- [x] Congelar escopo, entregáveis, premissas, exclusões e documentos da proposta
- [x] Implementar checklist de documentos e pendências com responsáveis e prazos
- [x] Implementar tarefas técnicas, evidências e acompanhamento de execução
- [x] Implementar entrega, aceite, encerramento e registro do pós-atendimento inicial
- [x] Adicionar testes de transição, RBAC, persistência e validar desktop/mobile

# Fase 2 — execução e entrega técnica

- [x] Criar tabela project_evidence e aplicar migration 0014 ao banco
- [x] Implementar persistência e listagem de evidências técnicas por projeto
- [x] Implementar upload de evidências técnicas ao S3 com limite de 5 MB e metadados no banco
- [x] Integrar anexos técnicos à ficha do projeto na Central de Execução
- [x] Validar TypeScript, 58 testes Vitest e build de produção
- [x] Validar visualmente a Central de Execução em desktop e mobile com banco vazio
- [ ] Executar transição ponta a ponta com dados reais do ambiente, sem inserir dados artificiais
- [x] Finalizar documentação operacional e critérios de aceite da Fase 2
- [x] Iniciar Fase 3 — Inteligência, automação e escala

# Melhoria solicitada — progresso da execução

- [x] Adicionar indicador visual de progresso baseado em tarefas e checklist na Central de Execução
- [x] Validar o indicador em desktop/mobile e atualizar testes/documentação

# Fase 3 — inteligência, automação e escala

- [x] Implementar radar operacional de vencimentos, pendências, riscos e sinais comerciais
- [x] Implementar follow-ups automáticos idempotentes após envio de propostas, com intervenção humana
- [x] Implementar indicadores comerciais de propostas, conversão, ticket, ciclo e motivos de perda
- [x] Implementar inteligência de carteira e recomendações determinísticas com origem rastreável
- [x] Implementar IA assistiva governada para sugestão de serviço, resumo e campos faltantes, exigindo aprovação humana
- [x] Implementar consulta externa controlada com fonte, data, retorno essencial e confiança quando houver provedor autorizado
- [x] Validar segurança, RBAC, idempotência, reversibilidade, testes e responsividade da Fase 3
- [x] Avaliar o sistema completo, riscos, lacunas, maturidade e próximos passos

# Melhoria da geração de propostas — solicitação 27/08/2026

- [x] Adicionar seleção de cliente cadastrado por CNPJ no formulário de proposta
- [x] Adicionar valor, condição de pagamento, validade e observações à proposta
- [x] Permitir selecionar serviço cadastrado e cadastrar serviço reutilizável para futuras propostas
- [x] Permitir selecionar profissional responsável: Miguel Gentine ou Laleska Fernanda
- [x] Validar persistência, governança, testes e responsividade do novo formulário de proposta

# Refinamento do cliente por CNPJ na proposta

- [x] Adicionar campo digitável de busca por CNPJ no formulário de proposta, mantendo a seleção do cliente cadastrado

# Decisão de escopo — autenticação

- [ ] Implementar autenticação própria com login/senha, recuperação de acesso e MFA — adiado por decisão do usuário; manter Manus OAuth no escopo atual

# Melhoria do painel de propostas

- [x] Criar painel de propostas com status visual, resumo e ação rápida de duplicação
- [x] Preservar profissional e condições comerciais ao duplicar uma proposta como novo rascunho
- [x] Selecionar imediatamente o novo serviço criado no formulário de proposta, sem recarregar a página
- [x] Validar duplicação, seleção imediata, responsividade, testes e build

# Filtros e visualização do painel de propostas

- [x] Implementar pesquisa por cliente, status e profissional no painel de propostas
- [x] Implementar filtros rápidos de status e profissional com contagem de resultados
- [x] Implementar gráfico de valores de propostas por status baseado exclusivamente em dados persistidos
- [x] Validar cálculo, estado sem dados, responsividade, testes e build

# Responsividade para celular e tablet

- [x] Ajustar navegação e cabeçalho para celulares e tablets
- [x] Ajustar formulários, painéis, filtros e ações de propostas para telas menores
- [x] Ajustar Central de Execução e Central de Inteligência para tablet e celular
- [x] Validar as telas críticas em 390×844, 768×1024 e desktop, sem overflow horizontal

# Autofill, PDF e alertas de validade de propostas

- [x] Implementar consulta pública de CNPJ no formulário de proposta, preservando edição manual
- [x] Implementar alertas visuais para propostas próximas da validade ou vencidas
- [x] Implementar exportação de proposta em PDF profissional baseada em snapshots confirmados
- [x] Validar dados, PDF, alertas, responsividade, testes e build

# Correção do menu móvel

- [x] Redesenhar o drawer móvel com rótulos, largura adequada e ação explícita de fechar
- [x] Escurecer o conteúdo de fundo e bloquear sua rolagem enquanto o menu estiver aberto
- [x] Validar menu aberto/fechado em celular e tablet sem corte ou sobreposição indevida

# Painel de propostas em celular

- [x] Auditar cards, filtros, gráfico e ações do painel em celular
- [x] Ajustar a estrutura mobile para cartões empilhados sem rolagem horizontal de conteúdo crítico
- [x] Validar a visualização mobile e documentar a decisão de layout

# Gestos e ordenação de propostas em celular

- [x] Implementar swipe em cards móveis para revelar ações rápidas sem executar alterações acidentais
- [x] Implementar cancelamento/arquivamento com confirmação e preservação de histórico, em vez de exclusão física
- [x] Implementar ordenação por criação, valor e validade no painel de propostas
- [x] Validar regras, gestos, ordenação, acessibilidade e responsividade em celular

# Feedback de swipe e modo de demonstração local

- [x] Adicionar transição suave e alerta visual de sucesso após mudança de status por swipe
- [x] Criar modo de demonstração local com propostas simuladas, sem gravar dados no banco
- [x] Validar gestos, ordenação e distinção visual entre dados demonstrativos e dados persistidos

# Proposta nº 58/2026 — Tansa Indústria Química Ltda.

- [x] Revisar a proposta anexada sob os aspectos técnico, comercial, documental e regulatório
- [x] Cadastrar o cliente, oportunidade e proposta nº 58/2026 com rastreabilidade documental e sem presumir dados ausentes
- [x] Incorporar ao template oficial de propostas os controles reutilizáveis identificados na revisão
- [x] Congelar premissas do serviço no snapshot da proposta e propagar o conteúdo à execução técnica
- [x] Atualizar o PDF para exibir premissas e limites mensuráveis do escopo comercial

# Correção de perfil mestre detectada na validação

- [x] Garantir que a consulta do perfil mestre Raizon retorne `null`, e nunca `undefined`, quando o cadastro ainda não existir
- [x] Adicionar teste de regressão para a consulta do perfil mestre sem registro persistido

# Correção de validação regulatória pendente

- [x] Impedir que ato com `needsValidation = 1` apareça como válido apenas por possuir vencimento futuro
- [x] Exibir status explícito de validação pendente na lista de atos e cobrir o caso com teste de regressão

# Correção mobile da lista de atos regulatórios

- [x] Eliminar overflow horizontal dos cards de atos em telas de 390 px, mantendo visíveis Editar, Arquivar e Evidências
- [x] Validar a lista de atos real em desktop e celular após a reorganização das ações

# Exportação Word de propostas

- [x] Implementar exportação DOCX baseada exclusivamente nos snapshots confirmados da proposta
- [x] Reproduzir a hierarquia visual da proposta nº 58/2026: capa, resumo, escopo, investimento, condições, premissas e aceite
- [x] Adicionar ação de exportação Word no painel, mantendo o PDF disponível e bloqueando demonstrações locais
- [x] Testar a estrutura do DOCX e validar download com a proposta persistida nº 58/2026

# Correção de descoberta da exportação Word

- [x] Exibir Exportar Word diretamente no card de cada proposta persistida, ao lado de Exportar PDF
- [x] Validar a visibilidade das duas exportações em desktop e celular

# Resumo executivo do sistema

- [x] Consolidar histórico, funcionalidades, tecnologias, APIs, links e integrações do Raizon Intelligence CRM
- [x] Documentar validações, limitações conhecidas e próximos passos por prioridade

# Rodada estrutural 1 — Integridade transacional e concorrência

- [x] Registrar baseline imutável: versão, árvore relevante, migrations, schema, alterações locais, testes, TypeScript, build e warnings
- [x] Auditar criação de projeto a partir de proposta aceita, com transações e rollback em falhas intermediárias
- [x] Auditar e reforçar idempotência e concorrência na criação de projetos e na numeração anual de propostas
- [x] Auditar e reforçar constraints críticas no schema e no banco sem alterar o modelo comercial além do necessário
- [x] Criar testes de regressão para falha parcial, duplicação concorrente e numeração anual
- [x] Registrar evidências finais como COMPROVADO, INFERIDO ou NÃO VALIDADO e consolidar checkpoint
- [x] Reconciliar o ledger `__drizzle_migrations`, que registra somente a migration 0000 apesar do schema físico refletir migrations posteriores

# Etapa 2 — Proposta aceita para projeto atômico

- [x] Mapear proposta aceita, projeto, checklist, tarefas, snapshots, responsáveis, prazos e outras gravações reais do fluxo
- [x] Garantir que todas as gravações de setup de execução ocorram em uma única transação atômica
- [x] Criar testes de rollback para falha em checklist/tarefas e reexecução idempotente da criação de projeto
- [x] Documentar o fluxo comprovado e quaisquer estruturas que não sejam criadas automaticamente
- [x] Tornar atômico o aceite comercial e a criação idempotente de projeto/checklist, evitando proposta aceita sem setup de execução

# Rodada estrutural 1 — Imutabilidade e transições críticas

- [x] Impedir alteração de conteúdo comercial em proposta emitida, aceita ou vinculada a projeto de execução
- [x] Serializar a transição de status do projeto, incluindo validação de checklist no encerramento, para evitar corrida entre leitura e gravação
- [x] Criar testes de regressão para edição bloqueada e encerramento concorrente de execução
- [x] Documentar a auditoria e a evidência das correções de imutabilidade e transição

# Rodada estrutural 1 — Integridade pós-encerramento

- [x] Impedir criação ou atualização de tarefa/checklist em projeto encerrado ou cancelado
- [x] Serializar as mutações de tarefa/checklist com lock do projeto para evitar corrida com o encerramento
- [x] Adicionar testes de regressão para bloqueio pós-encerramento sem gravações parciais

# Continuidade técnica sem dados operacionais — decisões de 27/08/2026

- [x] Documentar bloqueios de autenticação própria, automações externas, agenda real e execução real até nova autorização ou dado válido
- [x] Auditar controles técnicos de importação em prévia, conflito, dados CETESB documentados e jobs desativados sem criar ou alterar registros
- [x] Corrigir e testar apenas pendências técnicas comprovadas que não modifiquem dados operacionais
- [x] Substituir a confirmação de importação direta por prévia transacional em `import_runs` e `import_staging`, sem escrita em `companies`
- [x] Gerar conflitos persistidos e relatório estimado da prévia antes de qualquer futura aplicação canônica
- [x] Cobrir o contrato de prévia e a remoção do caminho tRPC de escrita direta com testes de regressão
- [x] Adicionar bloqueio explícito de escrita aos callbacks periódicos até autorização operacional de ativação
- [x] Exigir CNPJ com comprimento e dígitos verificadores válidos na prévia antes de classificar a linha como apta

# Prévia autorizada de importação de clientes — arquivo real recebido

- [x] Inspecionar formato, estrutura e qualidade do arquivo recebido sem alterar entidades canônicas — anexo continha instruções técnicas, não CSV/XLSX nem registros de clientes
- [ ] Mapear e registrar somente a prévia transacional em `import_runs`, `import_staging` e `import_conflicts`
- [ ] Verificar relatório, conflitos, duplicidades e ausência de escrita em `companies` antes de solicitar aprovação

# Reverificação de aderência às instruções P0 reenviadas

- [x] Confrontar os requisitos P0 do arquivo com schema, migration, transações, locks e testes atuais
- [x] Reexecutar TypeScript, testes e build sem alterar dados operacionais
- [x] Registrar a conclusão e os limites de validação da reverificação
