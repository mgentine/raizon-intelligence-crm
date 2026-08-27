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

## Oportunidades — validação adicional

- **Desktop 1280×720, `/?view=Oportunidades`:** cabeçalho, CTA e quatro colunas do funil (`Novas`, `Qualificadas`, `Propostas`, `Ganhas`) renderizados sem corte; estado vazio aparece como colunas limpas com contadores zero.
- **Mobile 390×844, `/?view=Oportunidades`:** sidebar colapsada, título e CTA acessíveis; as colunas são empilhadas verticalmente e permanecem utilizáveis, sem overflow horizontal observado. A tela fica longa, mas a leitura segue linear.
- **Limitação:** não há registros reais/populados no banco desta sessão; edição, mudança de etapa e perda foram validadas por contrato/regra, não por interação visual com registro persistido.

## Minha agenda — validação adicional

A agenda foi revisada em desktop 1280×720 e mobile 390×844. O estado vazio exibe a fila de leads/oportunidades e o painel escuro de rotinas/atividades sem sobreposição; no mobile, as seções empilham verticalmente e o CTA permanece acessível. O fluxo completo criar → listar → concluir → refletir no dashboard não foi executado nesta sessão porque não há item recorrente real/populado disponível e não foram inseridos dados artificiais.

## Cadastro de cliente por CNPJ

Em 26/08/2026, a view `/?view=Empresas` foi revisada em desktop. O botão **Cadastrar cliente**, a busca por CNPJ/nome e o filtro de relacionamentos aparecem alinhados; com banco vazio, a tela exibe estado vazio sem fabricar registros. O formulário de CNPJ é aberto após ação do usuário e contém estados de consulta, encontrado e falha para o preenchimento automático. A validação populada com retorno real do provider ainda depende de uma execução controlada com CNPJ válido.

- **Mobile 390×844, `/?view=Empresas`:** menu colapsado, título, botão **Cadastrar cliente**, busca, filtro de relacionamento e estado vazio renderizados sem sobreposição; o layout permanece legível e linear. A captura não abriu o formulário, portanto a validação visual do estado preenchido segue dependente de interação manual ou dados reais.

## Navegação após incorporação de Contatos à ficha de Empresas — 27/08/2026

A captura desktop confirmou que a navegação lateral não exibe mais a aba independente **Contatos** e que o atalho **Cadastrar cliente** permanece visível no dashboard. A captura mobile confirmou que o menu colapsável continua utilizável e que os atalhos de cadastro se reorganizam sem overflow. A ficha contextual de contatos depende da abertura de uma empresa real; como o banco permanece vazio, o estado populado e as operações de edição/arquivamento não foram executados nesta rodada.

## View Empresas após integração contextual — 27/08/2026

Em desktop 1280×720, a tela **Empresas** apresenta navegação sem Contatos, busca, filtro de relacionamento, CTA **Cadastrar cliente** e estado vazio sem sobreposição. Em mobile 390×844, o menu colapsado, título, busca, CTA, filtro e mensagem vazia permanecem legíveis; a busca fica estreita, mas utilizável, e não foi observado overflow horizontal. Não foi possível abrir a ficha contextual nem testar edição/arquivamento visualmente porque não existem empresas/contatos reais populados nesta sessão.

## Formulário ampliado de cliente — 27/08/2026

Com o parâmetro controlado `openCompanyForm=1`, o formulário foi revisado em desktop 1280×720 e mobile 390×844. A versão desktop apresenta seções de **Dados cadastrais**, **Endereço e operação** e **Canais e relacionamento**, com observações e ações no rodapé. No mobile, os campos empilham linearmente, o textarea permanece legível e os botões continuam acessíveis; não foi observado overflow horizontal. A validação de persistência com dados reais depende de cadastro controlado pelo usuário e não foi simulada.

## Autofill de endereço e porte — 27/08/2026

O formulário foi revisado novamente em desktop 1280×720 e mobile 390×844. O campo editável **Porte da empresa** aparece na seção de dados cadastrais; os campos de endereço permanecem organizados em seção própria. No mobile, o novo campo empilha sem overflow e o rodapé com cancelar/salvar continua acessível. A consulta efetiva contra provedor externo e persistência de um novo cliente não foram simuladas nesta rodada para não inserir dados artificiais.

### Evidência técnica

Os adapters BrasilAPI e CNPJ.ws agora normalizam porte, logradouro, número, complemento, bairro, CEP, telefone e e-mail. O helper de autofill só aplica esses valores quando o respectivo campo está vazio.

## UX da consulta por CNPJ — 27/08/2026

O formulário foi revisado em desktop 1280×720 e mobile 390×844 após a inclusão das máscaras. O campo CNPJ mantém a largura e hierarquia adequadas; o CEP permanece integrado à seção de endereço. No mobile, os campos continuam empilhados sem overflow e o espaço destinado ao feedback abaixo do CNPJ não desloca os botões para fora do formulário. O spinner e as mensagens dependem do estado da consulta e foram implementados no DOM; não foi forçada uma chamada externa durante a captura visual.

## Jornada pós-venda no quadro de oportunidades — 27/08/2026

O quadro foi revisado em desktop 1280×720 e mobile 390×844. As colunas **Contratação**, **Execução**, **Entrega**, **Encerradas** e **Pós-venda** aparecem após **Ganhas**. No desktop, o quadro usa quatro colunas por linha; no mobile, as nove etapas empilham verticalmente sem overflow horizontal. Como o banco permanece sem oportunidades, a revisão confirmou estrutura e estados vazios, mas não a transição com um caso persistido.
