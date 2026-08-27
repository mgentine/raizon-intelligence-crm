# Pendências e insumos necessários

Esta lista separa limitações de implementação de validações que dependem de dados ou configuração externos. Nenhum item abaixo deve ser tratado como concluído apenas porque a tela ou a procedure existe.

| Item | Estado atual | Insumo necessário |
|---|---|---|
| Login próprio com senha e recuperação | O projeto usa autenticação corporativa Manus OAuth; não há autenticação local independente | Decisão explícita de substituir ou complementar o provedor atual, incluindo política de senha, recuperação, MFA e responsabilidade de suporte |
| Rotina periódica de fontes | O callback recalcula filas e registra bloqueio quando CETESB/SP Águas não possuem endpoint autorizado; não há ingestão automática de arquivo sem origem confiável | Endpoint/exportação oficial autorizada ou procedimento de upload governado e agenda de produção publicada |
| Agenda recorrente completa | CRUD e conclusão existem; o fluxo com dados populados não foi simulado | Registro real autorizado de recorrência |
| Gráfico CETESB com dados reais | Estado vazio e layout responsivo foram verificados; não foi criado dado artificial para popular o gráfico | Base CETESB autorizada ou execução em ambiente com carga real |
| Atos, conflitos e histórico com dados reais | Procedures e estados existem; a efetividade visual com registros reais permanece pendente | Dados reais autorizados, preferencialmente arquivo de homologação da Raizon |
| Importação específica da base de clientes | A importação assistida e o vínculo por CNPJ existem; a homologação da base de clientes não foi executada | Planilha real da Raizon, mapeamento aprovado e autorização para carga |
| Jornada ponta a ponta | As etapas, transições e critérios estão implementados; a execução real não foi feita | Cliente, oportunidade, proposta e execução reais autorizados para piloto |

## Recomendação de fechamento

O próximo passo operacional deve ser a disponibilização de uma planilha de homologação anonimizada ou real autorizada, com pelo menos uma empresa, um contato, uma oportunidade, uma proposta e um ato regulatório. A carga deve ser executada em ambiente controlado, registrada em `import_runs`, revisada e eventualmente arquivada após a validação. Não se recomenda liberar cron de produção nem alterar o provedor de autenticação antes dessa rodada.
