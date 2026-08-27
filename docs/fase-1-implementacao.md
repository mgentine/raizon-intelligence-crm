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
