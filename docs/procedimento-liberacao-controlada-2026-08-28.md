# Procedimento de liberação controlada para usuários finais

## Objetivo e limite

Este procedimento prepara o **Raizon Intelligence CRM** para publicação em piloto controlado. A versão técnica candidata é o checkpoint `feb8fceb`; ela preserva o caso histórico autorizado de Guzolândia em execução e contém a auditoria, as constraints e os testes de concorrência validados nesta rodada.

> A publicação não converte fatos documentais pendentes em aceite, pagamento, entrega aceita ou encerramento. Também não autoriza importações canônicas, automações externas de CETESB/SP Águas ou recorrências sobre empresas reais sem autorização específica.

## Pré-publicação

| Ordem | Responsável | Ação verificável | Critério de aprovação |
|---:|---|---|---|
| 1 | Administrador do CRM | Conferir em Configurações a conta proprietária, os perfis operacionais e a lista de contas que já acessaram por Manus OAuth. | A conta proprietária continua `admin`; cada pessoa recebe somente perfil comercial ou técnico necessário. |
| 2 | Administrador do CRM | Validar o caso Guzolândia nas visões Empresas, Oportunidades, Propostas e Execução. | Projeto `em execução`; proposta `H-006/2026` sem aceite final; duas evidências, quatro atividades e três pendências abertas. |
| 3 | Responsável pelos dados | Criar backup manual atual de dados da tarefa conforme a situação indicada por e-mail e notificação no produto. | O pacote completo é confirmado no destino escolhido e não é renomeado ou alterado. |
| 4 | Responsável pelos dados | Fazer download do código pelo painel de gerenciamento como cópia complementar. | Arquivo local disponível; este download **não** substitui o backup da tarefa. |
| 5 | Administrador do CRM | Publicar apenas após concluir as etapas 1 a 4. | O ambiente publicado abre por HTTPS, efetua login OAuth e as quatro telas operacionais respondem. |

## Backup e recuperação

O backup da tarefa é uma fotografia pontual: registros, uploads, alterações e configurações posteriores não são incluídos. Caso a conta esteja sujeita à política de backup/restauração, o responsável deve confirmar a notificação oficial e usar o fluxo de exportação de dados da tarefa no portal indicado. A restauração oficial é uma operação única; por isso, **não** deve ser usada como teste exploratório contra o ambiente operacional.

| Cenário | Decisão operacional |
|---|---|
| Conta sem aviso oficial de impacto | Manter o checkpoint e cópia de código; não executar restauração. |
| Conta com aviso oficial | Fazer backup completo e novo imediatamente antes da publicação e após qualquer carga relevante. |
| Necessidade de recuperar o ambiente | Conferir todos os pacotes completos antes da restauração; a restauração devolve o estado do momento do backup. |
| Falha em upload de evidência | Conferir se o metadado foi criado e se o objeto S3 está referenciado; objeto não referenciado requer reconciliação administrativa. |

## Operação inicial do piloto

O piloto deve iniciar com poucos usuários internos, preferencialmente um administrador, um perfil comercial e um perfil técnico. Cada nova conta primeiro autentica por Manus OAuth; depois, o administrador atribui o perfil operacional na seção **Acessos de equipe**. Nenhuma senha local é cadastrada ou armazenada pelo CRM.

Durante as duas primeiras semanas, registrar no CRM cada falha, tentativa de transição bloqueada, dúvida de evidência ou conflito de importação. O administrador deve revisar o audit log das alterações críticas e checar que oportunidades ativas tenham responsável, próxima ação e data.

## Operações ainda bloqueadas por desenho

| Operação | Motivo do bloqueio | Condição para liberar |
|---|---|---|
| Importação definitiva de empresas | Ainda não foi fornecido CSV/XLSX real para prévia e aprovação. | Arquivo real, mapeamento, relatório de conflitos e aprovação explícita da prévia. |
| Integração automática CETESB/SP Águas | Não há fonte oficial/API autorizada configurada para ingestão automática. | Fonte oficial validada, definição operacional e autorização explícita. |
| Recorrência real | Não foi indicado registro real apropriado. | Obrigação real, responsável, prazo e autorização para homologação. |
| Login próprio/MFA | Mantido congelado por decisão de escopo. | Nova decisão de negócio, requisitos de identidade e estratégia de recuperação. |

## Referências oficiais

[1] [Guia de backup de dados Manus](https://help.manus.im/en/articles/16147892-service-change-overview-how-to-back-up-your-data)  
[2] [Guia de restauração de dados Manus](https://help.manus.im/en/articles/16147895-service-change-overview-how-to-restore-your-data)  
[3] [Visão geral da política de serviço](https://help.manus.im/en/articles/16147831-service-change-overview-what-s-happening-and-am-i-affected)
