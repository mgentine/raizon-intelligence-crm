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

## Correção do drawer móvel

O menu lateral móvel foi substituído por um drawer com largura de até 80% da tela e limite de 300 px. Os rótulos agora permanecem visíveis ao lado dos ícones; o menu possui botão explícito de fechamento, fechamento ao tocar no overlay e suporte à tecla Escape. O conteúdo da página fica escurecido e sua rolagem é bloqueada enquanto a navegação está aberta.

Na verificação em 390×844, o drawer exibiu a lista de navegação completa, com texto legível e sem competir com o conteúdo de fundo. O botão de abertura do menu e o ícone de notificações passaram a ter área de toque de 40×40 px no cabeçalho; os demais botões mobile mantêm a regra geral de 44 px.

## Painel de propostas em celular

O painel de propostas não utiliza tabela horizontal em dispositivos móveis. Em 390×844, filtros, gráfico e propostas são apresentados em fluxo vertical; as propostas são cards empilhados com status, validade, investimento, profissional e ações organizadas em grade de uma coluna. Dessa forma, exportar PDF, alterar status ou duplicar uma proposta não exige deslocamento horizontal.

O formulário de nova proposta também foi revisado nessa largura: a consulta por CNPJ, a seleção de serviço, os campos comerciais e as ações de rascunho permanecem empilhados e utilizáveis. Essa estrutura é preferível à rolagem horizontal porque preserva contexto e área de toque em uma operação comercial frequente.

## Gestos e ordenação em propostas móveis

Os cards de propostas em celular aceitam deslize horizontal. O gesto para a esquerda revela as ações rápidas de alteração de status e cancelamento; um gesto para a direita recolhe essas ações. A alteração só ocorre após a seleção explícita do novo status. O cancelamento solicita confirmação e apenas atualiza o status para `cancelled`, mantendo proposta, snapshots e versões no histórico. Não existe exclusão física por gesto.

O painel recebeu ordenação por data de criação, maior investimento e validade mais próxima. A ordenação é executada sobre os dados persistidos já filtrados e foi coberta por teste unitário. A verificação visual em 390×844 confirmou o seletor de ordenação e o fluxo vertical; a abertura do swipe sobre card populado depende de uma proposta real autorizada, que não foi criada artificialmente.

## Feedback de status e demonstração local

Após uma alteração de status pelo painel de ações revelado no swipe, a interface exibe uma confirmação verde, com ícone de sucesso e transição suave de entrada. A mensagem tem região `aria-live` e desaparece automaticamente em operação normal. A captura de validação mostra a confirmação de mudança para **Negociação** sem interferir nos filtros ou nos cards.

Para permitir avaliação dos gestos sem poluir o CRM, o painel inclui um modo de demonstração local. Ele exibe três propostas identificadas como **Demonstração**, com valores e status diversos, somente em memória. As mudanças de status e cancelamentos nesses cards não acionam procedures, não criam dados persistidos, não permitem PDF, emissão ou duplicação e não se misturam a qualquer métrica real após sair do modo.

## Lista de atos regulatórios com dados reais

A validação com quatro registros reais de captação subterrânea identificou que o layout original mantinha ações fora da área visível em 390×844. O card foi reorganizado para fluxo vertical nessa largura: identificação e fonte ficam no topo, vencimento e selo de validação aparecem em duas colunas e as ações **Editar**, **Arquivar** e **Evidências** ocupam uma grade de três colunas com área de toque adequada. A verificação posterior confirmou todas as ações visíveis, sem overflow horizontal.

Os registros de origem documental também exibem **Validação pendente**, em vez de “válido”, quando `needsValidation = 1`, ainda que tenham data de vencimento futura. Isso preserva a distinção entre dado extraído de proposta e situação regulatória confirmada.
