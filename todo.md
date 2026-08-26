# Project TODO

- [ ] Autenticação com login, senha, recuperação de acesso e controle por perfis
- [x] Layout autenticado com navegação para dashboard, leads, empresas, atos regulatórios, oportunidades, atividades e configurações
- [x] Modelo canônico de empresas por CNPJ
- [ ] Cadastro de unidades operacionais e contatos
- [x] Cadastro de licenças, processos, outorgas e evidências regulatórias
- [x] Pipeline comercial específico da Raizon Ambiental
- [ ] Responsáveis, próximas ações, atividades, propostas e motivos de perda
- [x] Histórico de relacionamento por empresa e oportunidade
- [ ] Importação assistida de bases CETESB e SP Águas
- [ ] Normalização de CNPJ, telefones, e-mails, datas e municípios
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
- [ ] Criar CRUD completo de unidades, contatos e atos regulatórios, incluindo evidências
- [ ] Completar o funil integral da Raizon com propostas, responsáveis, perda, próximas ações e histórico por empresa/oportunidade
- [x] Implementar importação assistida real com mapeamento de colunas, prévia, conflitos, import_runs e revisão humana
- [ ] Adicionar normalização de telefone, e-mail, datas e municípios
- [x] Criar testes de deduplicação e conflitos entre CETESB e SP Águas
- [x] Construir painéis de cobertura de contato, previsão de receita e prioridades operacionais
- [x] Construir calendário operacional de recorrência com criação e conclusão de tarefas
- [ ] Implementar notificações internas e por e-mail
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
- [ ] Implementar conectores substituíveis para arquivo oficial, CNPJ, CETESB e SP Águas
- [x] Implementar reprocessamento seguro e preservação da última versão válida após falha
- [ ] Executar testes de autorização, idempotência, conflitos, status e notificações

# Ajustes identificados pela revisão de implementação

- [x] Implementar lógica real de Minha agenda de hoje e detecção de oportunidades paradas/sem avanço
- [x] Definir e aplicar critérios mínimos por etapa do pipeline no backend e refletir isso na UI
- [x] Integrar o status regulatório normalizado ao modelo, queries e UI sem perder o valor bruto publicado
- [x] Renderizar gráfico comercial separado usando o resumo do funil
- [x] Expandir autorização por perfil para todas as procedures e mutations sensíveis
- [x] Adicionar severidade e agrupamento às notificações no schema, backend e UI
- [ ] Implementar reprocessamento transacional/seguro com preservação explícita da última versão válida

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

- [ ] Validar visualmente a tela de Atos regulatórios com registros reais/populados exibindo regulatoryStatus normalizado ao lado do vencimento
- [x] Capturar e registrar explicitamente o estado de erro do funil comercial em mobile usando ?forceChartError=1
- [x] Adicionar teste de integração/unidade do contrato de listRegulatoryActs confirmando regulatoryStatus normalizado

# Correções de efetividade da governança

- [x] Adicionar ação explícita de rejeitar na tela de conflitos e validar o fluxo completo
- [x] Calcular e exibir idade da última carga válida por fonte usando import_runs concluídos
- [x] Implementar agrupamento real de notificações por groupingKey no backend e na UI

# Fechamento de governança

- [ ] Validar explicitamente a tela de Importações com conflitos reais, incluindo rejeição e atualização após decisão
- [x] Marcar todo o grupo de notificações como lido quando a ocorrência agrupada for aberta
- [ ] Adicionar testes específicos para agrupamento de notificações e decisão reject de conflito

# Gaps reabertos pela auditoria de efetividade

- [ ] Implementar histórico dedicado por empresa e oportunidade com atividades relacionadas
- [x] Adicionar painéis explícitos de cobertura de contato e prioridades operacionais no dashboard
- [ ] Gerar notificações para oportunidades paradas e falhas de importação
- [ ] Implementar rotina periódica para processar/atualizar fontes além do recálculo atual, com bloqueio documentado quando a fonte oficial não estiver disponível
- [ ] Documentar revisão final de segurança abrangendo permissões, dados sensíveis e estados de erro
- [ ] Criar UI de mapeamento manual de colunas na importação assistida
- [ ] Documentar bloqueio externo verificável para conectores oficiais CETESB e SP Águas ou implementar quando houver endpoint autorizado
- [ ] Adicionar teste específico para criação e conclusão de recorrências persistidas

# Estados explícitos do painel operacional

- [x] Adicionar estados de carregamento, erro e vazio ao painel de cobertura/prioridades
- [x] Validar visualmente os estados carregando, erro e sem dados do painel operacional

# Validação reproduzível de loading

- [x] Adicionar modo controlado forceCoverageLoading=1 e validar visualmente o loading do painel operacional
