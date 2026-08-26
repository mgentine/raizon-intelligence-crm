# Prontidão dos conectores regulatórios — 26/08/2026

## Conclusão técnica

A plataforma deve manter ingestão assistida por arquivo como caminho operacional padrão até que exista endpoint oficial autorizado e estável para cada fonte. Não é seguro transformar páginas públicas em um scraper silencioso: mudanças de layout, autenticação, indisponibilidade e regras de uso podem produzir dados incompletos sem que o CRM consiga distinguir ausência de licença de falha de coleta.

| Fonte | Canal oficial observado | Situação para automação | Decisão no CRM |
|---|---|---|---|
| CETESB | Consulta pública de solicitações por número, CNPJ, razão social, endereço ou CEP; e-CETESB com login para funcionalidades adicionais | Não foi identificado endpoint público documentado para ingestão em lote | Usar arquivo oficial/fornecido e preservar sourceVersion, evidência e estado da carga. Bloquear atualização automática quando não houver arquivo autorizado. |
| SP Águas | Portal de Outorgas, SOE, Painel de Outorgas/SIGAM e orientações DPO | A página informa manutenção temporária do SOE; não foi identificado endpoint público documentado para lote | Usar arquivo autorizado ou exportação formal. Não inferir ausência de outorga a partir de falha do portal. |
| CNPJ | API Consulta CNPJ do Conecta gov.br, com endpoints de produção/homologação | Requer adesão, credenciais, configuração de acesso e regras do Conecta | Manter adapter substituível e ativar somente após credenciais e autorização do consumidor. |

## Comportamento obrigatório da rotina

Quando a fonte oficial não estiver disponível, a rotina registra uma tentativa `import_run` com status `failed`, origem normalizada (`cetesb` ou `sp_aguas`), identificação `scheduled-source-update` e mensagem explicando o bloqueio. A resposta do callback também retorna os IDs dessas tentativas. A rotina deve gerar alerta operacional quando aplicável e preservar a última versão válida. Ela não deve arquivar atos existentes, zerar resultados, substituir a situação publicada nem criar leads a partir de resposta vazia.

A atualização automática de CETESB e SP Águas permanece pendente de endpoint/exportação autorizado. A implementação atual entrega o callback periódico de recálculo de prioridades e notificações, além da ingestão assistida governada por arquivo; isso é deliberadamente diferente de um conector oficial em produção.

## Fontes oficiais consultadas

1. [CETESB — Consulta de processo](https://licenciamento.cetesb.sp.gov.br/cetesb/processo_consulta.asp)
2. [e-CETESB — Portal de Licenciamento Ambiental](https://e.cetesb.sp.gov.br/portal-servicos-frontend/)
3. [SP Águas — Outorgas](https://www.spaguas.sp.gov.br/site/outorga/)
4. [Conecta gov.br — API Consulta CNPJ](https://www.gov.br/conecta/catalogo/apis/consulta-cnpj)
