# Project TODO

- [ ] Autenticação com login, senha, recuperação de acesso e controle por perfis
- [ ] Layout autenticado com navegação para dashboard, leads, empresas, atos regulatórios, oportunidades, atividades e configurações
- [x] Modelo canônico de empresas por CNPJ
- [ ] Cadastro de unidades operacionais e contatos
- [ ] Cadastro de licenças, processos, outorgas e evidências regulatórias
- [ ] Pipeline comercial específico da Raizon Ambiental
- [ ] Responsáveis, próximas ações, atividades, propostas e motivos de perda
- [ ] Histórico de relacionamento por empresa e oportunidade
- [ ] Importação assistida de bases CETESB e SP Águas
- [ ] Normalização de CNPJ, telefones, e-mails, datas e municípios
- [ ] Deduplicação por CNPJ e identificação de conflitos
- [ ] Trilha de origem, versão da fonte e auditoria de importações
- [ ] Priorização técnica separada da prioridade comercial
- [ ] Painéis de pipeline, prioridades, cobertura de contato, atrasos, vencimentos e previsão de receita
- [ ] Calendário de recorrência para renovações e obrigações periódicas
- [ ] Notificações internas para vencimentos, tarefas atrasadas, oportunidades paradas e falhas
- [ ] Estrutura de provedor para consulta cadastral de CNPJ
- [ ] Estrutura de ingestão controlada para fontes públicas CETESB e SP Águas
- [ ] Rotinas periódicas idempotentes para processamento de arquivos e recálculo de filas
- [x] Testes unitários do domínio e das regras de deduplicação/prioridade
- [x] Verificação visual e responsiva das telas principais
- [ ] Revisão final de segurança, permissões e estados vazios/erro

# Gaps identificados na revisão

- [ ] Implementar autenticação própria com login/senha, recuperação de acesso e autorização por perfis aplicada na UI e nas procedures
- [ ] Criar módulo operacional de leads separado da base de empresas
- [ ] Criar CRUD completo de unidades, contatos e atos regulatórios, incluindo evidências
- [ ] Completar o funil integral da Raizon com propostas, responsáveis, perda, próximas ações e histórico por empresa/oportunidade
- [ ] Implementar importação assistida real com mapeamento de colunas, prévia, conflitos, import_runs e revisão humana
- [ ] Adicionar normalização de telefone, e-mail, datas e municípios
- [x] Criar testes de deduplicação e conflitos entre CETESB e SP Águas
- [ ] Construir painéis de cobertura de contato, previsão de receita e prioridades operacionais
- [x] Construir calendário operacional de recorrência com criação e conclusão de tarefas
- [ ] Implementar notificações internas e por e-mail
- [ ] Implementar adapters reais e substituíveis para CNPJ, CETESB e SP Águas, sujeitos à disponibilidade e às regras de cada fonte
- [ ] Implementar rotina periódica completa para processamento de arquivos, atualização de fontes e recálculo de filas
- [x] Corrigir responsividade mobile: sidebar colapsável e grade do dashboard adaptável
- [x] Validar visualmente e em viewport móvel/desktop todas as telas principais do CRM
- [x] Documentar a verificação responsiva por tela após revisão final do preview
- [x] Validar visualmente a tela Atividades em desktop e mobile e registrar o resultado
- [x] Criar registro curto da revisão responsiva por tela das sete views principais
- [x] Implementar sidebar mobile realmente colapsável com toggle/drawer e validar em desktop/mobile
- [x] Revalidar a correção responsiva após comprovar sidebar colapsável e grade adaptável
- [ ] Implementar conclusão de itens recorrentes com status persistido no backend e ação na UI para marcar recorrência/tarefa como concluída
- [ ] Adicionar testes para criação e conclusão de recorrências, incluindo estados aberto/concluído
- [ ] Validar visualmente a agenda recorrente com fluxo completo: criar, listar, concluir e refletir no dashboard
