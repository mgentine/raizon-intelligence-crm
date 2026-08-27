# Responsividade — celular e tablet

## Escopo aplicado

O CRM foi revisado nas telas **Visão geral**, **Propostas**, **Execução** e **Inteligência** em celulares de 390×844 e tablets de 768×1024. A navegação lateral permanece recolhida nessas larguras, preservando espaço útil para os dados e ações da operação.

Os controles de entrada passam a usar fonte mínima de 16 px até 1023 px. Em celulares, os botões adotam altura mínima de 44 px; os botões por ícone recebem também largura mínima de 44 px. Essa medida evita alvos de toque excessivamente pequenos e reduz o zoom automático de campos em navegadores móveis.

Os grids críticos se reorganizam para uma coluna em celular e preservam duas ou mais colunas apenas quando há largura suficiente. Formulários, filtros, indicadores, gráfico de propostas, checklist e painéis de inteligência seguem o fluxo vertical sem overflow horizontal. A interface mantém áreas de toque e ações primárias visíveis em telas menores.

## Evidência de validação

| Área revisada | Celular 390×844 | Tablet 768×1024 | Resultado |
|---|---|---|---|
| Visão geral | Sim | Sim | Navegação, cards, gráficos vazios e agenda sem overflow. |
| Propostas | Sim | Sim | Painel, filtros e gráfico reorganizados e legíveis. |
| Execução | Sim | Sim | Botão de início e estados de projeto sem corte. |
| Inteligência | Sim | Sim | Formulários, painéis e ações reorganizados para leitura e toque. |

> As telas populadas por propostas, projetos, atos e históricos reais ainda requerem uma rodada de homologação com dados autorizados. Não foram inseridos registros artificiais para produzir uma falsa validação visual.
