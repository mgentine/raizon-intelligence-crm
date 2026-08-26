# Validação visual reproduzível — 26/08/2026

A validação foi executada no preview do CRM em desktop (1280×720) e mobile (390×844), com o banco operacional sem registros populados. Foram revisados o dashboard, a distribuição de status dos leads CETESB, a cobertura de contato, a prioridade operacional, o funil comercial e a agenda regulatória.

## Evidências observadas

| Estado | Desktop | Mobile | Resultado |
|---|---:|---:|---|
| Dashboard sem dados | Validado | Validado | Cards, grids e mensagens vazias permanecem legíveis e sem sobreposição. |
| Cobertura/prioridades carregando (`forceCoverageLoading=1`) | Validado | Validado | Placeholders aparecem no lugar dos totais sem deslocar a estrutura. |
| Funil comercial com erro (`forceChartError=1`) | — | Validado | Mensagem controlada é exibida no painel sem quebrar as demais seções. |
| Atos regulatórios populados | Não validado | Não validado | Não há registros reais disponíveis nesta sessão; não foram inseridos dados artificiais. |
| Status CETESB populado | Não validado | Não validado | Depende de carga real de fonte regulatória autorizada. |

## Limite da evidência

Esta revisão demonstra estabilidade estrutural e responsividade nos estados vazios e controlados. Ela **não substitui** a inspeção de registros reais, especialmente para nomes longos, múltiplos atos por empresa, evidências anexadas, conflitos e status regulatório normalizado ao lado do vencimento.
