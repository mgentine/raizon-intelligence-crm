# Fase 1 — Base comercial e motor de propostas

## Objetivo

A Fase 1 estabelece a base governada para a Raizon Ambiental cadastrar seus dados oficiais, manter uma biblioteca técnica de serviços e transformar oportunidades qualificadas em propostas rastreáveis.

## Entregas implementadas

### 1. Cadastro mestre da Raizon

A tela **Configurações** agora possui o cadastro mestre da contratada: razão social, nome comercial, CNPJ, responsável técnico, título profissional, CREA, MTE, canais, endereço e assinatura padrão. A alteração é restrita ao perfil administrador. Esses dados ficam disponíveis para alimentar documentos oficiais futuros.

### 2. Catálogo de serviços

A tela **Serviços** permite cadastrar uma ficha técnica com nome, categoria, órgão provável, UF, resumo, escopo padrão, entregáveis, documentos necessários, exclusões, premissas, visitas incluídas, preço-base e chave/template DOCX. Serviços podem ser arquivados sem apagar histórico. O upload de template DOCX usa armazenamento S3; bytes não são armazenados no banco.

### 3. Preço sugerido, sem automação cega

O catálogo aceita preço-base e a nova proposta usa esse valor como sugestão editável. O cálculo puro também suporta fatores explícitos de porte, complexidade, distância, visitas, urgência e documentação. O valor final continua sendo aprovado manualmente pelo usuário.

### 4. Propostas versionadas

A tela **Propostas** cria rascunhos relacionando oportunidade, empresa e serviço ativo. A proposta congela snapshots do cliente e do serviço, registra mapa de origem e conserva escopo, entregáveis, exclusões e documentos da versão utilizada.

Estados disponíveis: rascunho, revisão técnica, revisão comercial, aprovada internamente, emitida, enviada, negociação, aceita, recusada e cancelada. O backend bloqueia transições inválidas e impede emissão sem aprovação interna. A numeração é anual e incremental, no formato `NNN/AAAA`; novas versões preservam o número da proposta e incrementam a versão.

## Permissões

| Operação | Administrador | Comercial | Técnico |
|---|---:|---:|---:|
| Consultar cadastro mestre | Sim | Sim | Sim |
| Alterar cadastro mestre | Sim | Não | Não |
| Consultar catálogo | Sim | Sim | Sim |
| Criar/editar serviço | Sim | Não | Sim |
| Anexar template DOCX | Sim | Não | Sim |
| Criar proposta | Sim | Sim | Não |
| Revisar/alterar status | Sim | Sim | Sim |
| Emitir proposta | Sim | Sim | Não |

## Limites conscientes

A Fase 1 não gera DOCX/PDF automaticamente, não calcula impostos ou margem financeira, não integra assinatura eletrônica e não cria dados de catálogo por seed. O template é armazenado e vinculado ao serviço, deixando a renderização documental para uma etapa posterior, depois que o padrão visual oficial for aprovado.

O fluxo está pronto para ser validado com dados reais de uma empresa, uma oportunidade e um serviço piloto. A validação automatizada não insere registros artificiais no banco.

## Complemento — formulário comercial de proposta

A criação de proposta agora começa pela seleção de uma empresa já cadastrada, exibindo CNPJ formatado, nome e oportunidades vinculadas à empresa escolhida. A oportunidade é filtrada pelo `companyId`, evitando que uma proposta seja criada para empresa diferente da oportunidade.

O formulário registra valor em reais, condição de pagamento, validade em dias, observações, informações pendentes e profissional responsável. Os profissionais aceitos pelo contrato são **Miguel Gentine** e **Laleska Fernanda**; o proprietário da operação (`ownerId`) continua sendo mantido separadamente para auditoria e controle de acesso.

O serviço é selecionado do catálogo ativo. Usuários com perfil administrador ou técnico podem abrir o cadastro rápido de um novo serviço com nome, categoria, escopo e entregáveis; após salvar, o serviço fica disponível para futuras propostas e pode ser selecionado no mesmo fluxo. O catálogo continua sujeito à governança técnica existente.

A proposta permanece como rascunho até as etapas de revisão e emissão. O snapshot preserva os dados cadastrais e o escopo do serviço no momento da criação; alterações posteriores no catálogo não reescrevem a proposta já criada.

### Evidência visual da melhoria

A revisão reproduzível com `?view=Propostas&openProposalForm=1` confirmou em desktop 1280×720 a hierarquia dos campos de cliente por CNPJ, oportunidade, serviço, profissional, valor, pagamento, validade e observações. Em viewport móvel 390×844, o formulário reorganiza os campos em uma coluna, mantém os controles legíveis e não apresenta overflow horizontal. Como o banco de homologação permaneceu sem registros artificiais, os seletores exibem estado vazio; a validação de persistência com uma proposta real permanece dependente de dados autorizados.

### Refinamento da busca por CNPJ

O formulário passou a oferecer um campo digitável para localizar empresa por CNPJ ou nome, seguido da seleção da empresa encontrada. A revisão com `?view=Propostas&openProposalForm=1` confirmou em 1280×720 e 390×844 que o campo fica no topo do fluxo, a seleção de oportunidade permanece dependente do cliente e não há overflow horizontal. Quando nenhum registro corresponde à busca, a interface informa claramente que não há cliente cadastrado correspondente. A lista vazia observada na revisão decorre do banco de homologação sem dados artificiais.

### Painel e duplicação rápida

O painel de propostas agora apresenta total, propostas em curso, propostas aceitas e valor da carteira ativa, além de cards com cliente, serviço, valor, condições, profissional e selo visual do status atual. A ação **Duplicar** cria um novo rascunho versionado da proposta selecionada e preserva escopo, snapshots, valor, condições comerciais, observações e profissional responsável; a versão original permanece intacta para auditoria.

O cadastro rápido de serviço passou a aguardar a atualização local do catálogo e seleciona o serviço recém-criado no mesmo formulário, sem recarregar a página. A revisão em 1280×720 e 390×844 confirmou legibilidade dos indicadores e ausência de overflow. Os cards com dados populados continuam pendentes de conferência com registros reais autorizados.

### Pesquisa, filtros e gráfico de valores

O painel passou a carregar todas as propostas persistidas, permitindo pesquisa por cliente, serviço, número de proposta ou profissional, além de filtros por status e profissional. A contagem de resultados é atualizada conforme os filtros aplicados. O gráfico de barras soma o valor das propostas por status usando somente os registros retornados e acompanha os filtros ativos; não são criados valores de demonstração.

Nas revisões desktop 1280×720 e mobile 390×844, os filtros foram exibidos de forma legível e o gráfico apresentou o estado seguro “Não há valores de propostas para os filtros aplicados”, pois o banco segue vazio. A agregação e os filtros foram extraídos para regras puras e cobertos por teste automatizado.
