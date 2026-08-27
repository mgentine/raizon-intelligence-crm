# Análise de viabilidade — evolução do Raizon Intelligence CRM

**Data:** 27/08/2026  
**Escopo analisado:** proposta de transformar o CRM em um sistema técnico-comercial integrado, com motor de propostas, catálogo de serviços, precificação, documentos, operação, Radar e automações.

## 1. Parecer executivo

A ideia é **viável e estrategicamente coerente** com a operação da Raizon Ambiental, mas não deve ser implementada como um único “gerador automático de propostas”. O caminho seguro é evoluir o CRM em camadas: primeiro estruturar dados mestres e governança; depois criar propostas versionadas com templates DOCX; em seguida conectar proposta aprovada à execução; por último adicionar automações e IA controlada.

A recomendação é aprovar o conceito como **sistema técnico-comercial da Raizon**, mas executar um **MVP de propostas governadas** antes de criar módulos financeiros completos, integrações jurídicas amplas ou geração autônoma por IA. O maior valor está em eliminar redigitação, preservar o padrão técnico da Raizon, reduzir erro comercial e transformar uma venda aprovada em trabalho executável.

> **Conclusão:** aproximadamente 70% da proposta é implementável com a arquitetura atual ou por extensão direta. Cerca de 20% exige novos módulos de dados e documentos. Os 10% restantes dependem de integrações externas, disponibilidade de fontes oficiais, credenciais, regras jurídicas/contábeis ou decisão de escopo.

## 2. O que já existe e pode ser reaproveitado

O CRM já possui a base necessária para não começar do zero: empresas consolidadas por CNPJ, unidades, contatos contextuais, atos regulatórios, oportunidades, atividades, recorrências, prioridades, histórico, notificações, importação controlada, evidências em S3 e etapas pós-venda. O pipeline já contempla diagnóstico, escopo, proposta, negociação, aprovação, contratação, execução, entrega, encerramento e pós-venda.

A entidade **oportunidade** deve continuar sendo o centro do processo comercial. A proposta não deve duplicar cliente, contato, serviço ou valor; deve referenciar esses dados e registrar seus próprios snapshots quando for emitida, para preservar o que foi efetivamente apresentado ao cliente.

## 3. Matriz de viabilidade

| Capacidade | Viabilidade | Como implementar | Dependência ou ressalva |
|---|---|---|---|
| Cadastro mestre da Raizon | Alta | Nova tela de configurações com dados da contratada, responsáveis e assinatura | Controle de acesso administrativo e auditoria |
| Catálogo de serviços | Alta | Entidade de serviço com categoria, órgão, escopo, entregáveis, exclusões e documentos | Conteúdo precisa ser aprovado pela Raizon |
| Motor de propostas | Alta | Proposta vinculada a empresa, unidade, oportunidade e serviço | Exige versionamento e snapshot dos dados emitidos |
| Templates DOCX oficiais | Alta | Upload em S3, marcadores permitidos e substituição determinística | Necessário definir padrão de marcadores e testar documentos reais |
| Numeração anual | Alta | Sequência transacional por ano, reservada apenas na emissão | Cancelamento não pode reutilizar número |
| Controle de versões | Alta | Versões da mesma proposta, com número fixo e versão incremental | Deve impedir alteração silenciosa de versão emitida |
| Validade de proposta | Alta | Campo configurável, por exemplo 20 dias, gravado no documento | Prazo padrão deve ser uma regra editável da Raizon |
| Precificação por fatores | Alta | Regras determinísticas com preço-base, adicionais e aprovação manual | Preço sugerido nunca pode virar valor final sem confirmação |
| Documentos solicitados | Alta | Checklist por serviço e status recebido, pendente ou incompleto | Necessário upload e vínculo aos documentos/evidências |
| Revisão técnica e comercial | Alta | Estados separados antes da emissão | Mudanças após revisão devem gerar nova versão ou reabrir revisão |
| Criação de projeto após aprovação | Média/Alta | Criar entrega técnica, tarefas, documentos e cronograma a partir da proposta | Requer definir modelo de projeto e responsáveis |
| Follow-up automático | Alta | Criar atividades com datas relativas ao envio | Não enviar mensagens automaticamente sem aprovação/configuração |
| Diagnóstico assistido por IA | Média | IA sugere serviço e perguntas faltantes usando dados estruturados | Sempre exigir validação humana e registrar hipótese/origem |
| Validação em fonte oficial | Média | Adaptadores por fonte, URL, data, resposta e evidência | Não presumir API estável; respeitar acesso, CAPTCHA e termos da fonte |
| Cláusulas obrigatórias | Alta | Biblioteca de cláusulas bloqueadas ou administradas | Revisão jurídica/profissional recomendada antes do uso comercial |
| Radar de vencimentos | Alta | Estender atos e recorrências existentes para gerar oportunidades qualificadas | Vencimento é sinal comercial, não conclusão de irregularidade |
| Painel de propostas | Alta | Consultas agregadas de status, valor, conversão e motivos de perda | Indicadores só serão úteis após base histórica suficiente |
| Financeiro completo | Média | Contratos, parcelas, recebíveis e conciliação como módulo separado | Não deve ser confundido com proposta ou CRM; pode exigir integração contábil |
| Geração direta de PDF | Média | Converter DOCX aprovado ou gerar PDF em etapa posterior | Não substituir o documento oficial por layout improvisado de IA |
| Aprovação eletrônica/assinatura | Média/Baixa | Integrar provedor especializado ou registrar aceite documental | Exige definição jurídica, credenciais e fluxo de assinatura |

## 4. O que é viável agora

### 4.1 Fase 1 — base governada de serviços e propostas

A primeira entrega deveria criar o catálogo de serviços e a proposta como entidades próprias. Cada serviço deve conter nome, categoria, órgão provável, escopo padrão, entregáveis, documentos necessários, exclusões, premissas, visitas incluídas, modelo DOCX e regras de precificação. A proposta deve referenciar empresa, unidade, contato, oportunidade e serviço; registrar valor, condição de pagamento, validade, observações, status, número, versão e responsável pela revisão.

O sistema pode preencher automaticamente dados já existentes, mas precisa separar três conceitos: **valor cadastral**, **valor sugerido** e **valor aprovado na proposta**. O mesmo vale para órgão, modalidade, processo e prazo. Se uma informação não tiver origem conhecida, o sistema deve exibir “não informado”, “a validar” ou “hipótese”, nunca completar por achismo.

### 4.2 Fase 2 — documento oficial e controle de emissão

É tecnicamente viável armazenar modelos DOCX em S3 e substituir marcadores de forma determinística. A proposta deve ser montada a partir de um template aprovado, não redesenhada por IA. O fluxo recomendado é: rascunho sem número; revisão técnica; revisão comercial; aprovação interna; emissão com número anual; envio; negociação; aprovação ou perda.

O número deve ser reservado em transação somente no momento de **Emitir proposta**. A versão pode mudar sem alterar o número. Uma proposta cancelada preserva o número e o histórico, mas não volta à disponibilidade.

### 4.3 Fase 3 — proposta aprovada transformada em operação

Também é viável criar uma entrega técnica ou projeto a partir de uma proposta aprovada. O sistema deve copiar o escopo aprovado, os entregáveis, as exclusões, as premissas, a unidade, o responsável, o prazo e a condição de pagamento. A operação não deve reconstruir o escopo a partir de IA; deve nascer do conteúdo aprovado.

A automação inicial deve criar tarefas e checklists: documentos solicitados, análise, preparação, protocolo quando contratado, acompanhamento, revisão interna, entrega e aceite. Isso aproveita as atividades e recorrências já existentes, mas uma entidade explícita de **entrega técnica** será necessária para não sobrecarregar oportunidade ou atividade.

## 5. O que exige cuidado ou não deve ser feito agora

A proposta de financeiro completo é válida, mas não é o próximo passo. Contas a receber, conciliação, emissão fiscal e integração contábil aumentam muito a responsabilidade do sistema e exigem requisitos próprios. Nesta etapa, é suficiente registrar condição de pagamento e marcos financeiros da proposta; o módulo financeiro completo deve ser separado e priorizado depois da operação técnica.

A IA não deve escolher sozinha o órgão competente, garantir aprovação, definir obrigação legal, alterar escopo aprovado ou inventar preços. Ela pode interpretar demanda, sugerir serviço, redigir resumo executivo, apontar campos faltantes e adaptar linguagem dentro de limites. O resultado deve ser marcado como sugestão e passar por revisão humana.

A validação externa também não deve ser prometida como universal. CETESB, SP Águas e outras fontes podem ter formatos, permissões, atualizações e limites distintos. O CRM deve registrar fonte, data, URL, versão, resposta essencial e nível de confiança. Quando não houver fonte oficial acessível, o sistema deve bloquear a afirmação conclusiva e encaminhar para conferência documental.

A assinatura eletrônica, consulta automática de órgãos e envio automático de e-mail são extensões possíveis, mas dependem de provedor, credenciais, regras de uso e decisão operacional. Não devem ser acopladas ao primeiro MVP.

## 6. Modelo de dados recomendado

A separação mínima deve ser:

| Entidade | Função |
|---|---|
| Empresa | Identidade canônica por CNPJ |
| Unidade | Local/empreendimento onde a atividade ocorre |
| Contato | Pessoa e papel na decisão |
| Serviço | Biblioteca técnica aprovada |
| Regra de preço | Componentes e fatores do preço sugerido |
| Oportunidade | Negócio em andamento e contexto comercial |
| Proposta | Documento comercial, status, número e versão |
| Item da proposta | Serviço, quantidade, visitas, valor e descrição emitida |
| Documento solicitado | Checklist exigido pelo serviço |
| Projeto/entrega técnica | Execução após aceite |
| Tarefa/atividade | Ação com responsável e prazo |
| Evidência | Arquivo ou prova vinculada ao processo |
| Contrato/marco financeiro | Compromisso comercial e pagamentos, em fase posterior |

Um ponto importante é o **snapshot de emissão**. Se o nome do cliente, endereço, escopo ou preço mudar depois, a proposta já emitida não pode mudar retroativamente. A proposta precisa guardar a versão apresentada e apontar para os registros atuais apenas como referência.

## 7. Controles obrigatórios

O sistema deve manter uma matriz de origem para cada campo relevante: cadastro, usuário, serviço aprovado, cálculo, fonte oficial, documento ou IA. Campos estruturados sem origem devem permanecer pendentes. A proposta deve registrar quem criou, quem revisou, quem emitiu, quando foi emitida, quais fontes foram consultadas e quais campos permaneceram a validar.

As cláusulas de não garantia de aprovação e de dependência dos prazos do órgão podem ser incorporadas como cláusulas padrão administradas pela Raizon. Ainda assim, o texto final deve ser revisado profissionalmente antes de se tornar bloqueado no sistema.

A transição para contratação deve exigir, no mínimo, cliente, serviço, escopo, valor, responsável, condição de pagamento e próxima ação. A transição para execução deve exigir aceite ou evidência equivalente, responsável técnico, entregáveis e prazo. O encerramento deve exigir status das pendências, entrega realizada, aceite ou justificativa e histórico final.

## 8. Roadmap recomendado em três fases

A proposta deve ser executada em três fases, com uma fronteira clara entre o que é necessário para vender, o que é necessário para executar e o que é necessário para escalar. Cada fase deve gerar valor utilizável antes da seguinte começar.

### Fase 1 — Base comercial e motor de propostas

**Objetivo:** transformar uma oportunidade qualificada em uma proposta profissional, rastreável e pronta para revisão.

| Frente | Entrega |
|---|---|
| Dados mestres | Cadastro da Raizon, responsáveis, assinatura, dados bancários/comerciais e regras administrativas |
| Catálogo | Serviços, categorias, órgão provável, escopo aprovado, entregáveis, documentos, premissas e exclusões |
| Precificação | Preço-base e fatores de porte, complexidade, distância, visitas e urgência, sempre com aprovação manual |
| Proposta | Rascunho, revisão técnica, revisão comercial, emissão, envio, negociação e aprovação/perda |
| Documento | Template DOCX oficial, marcadores permitidos, número anual, validade e versão |
| Governança | Origem de cada campo, informações pendentes, trilha de alteração e bloqueio contra invenção de dados |

**Critério de aceite:** selecionar um serviço piloto, montar uma proposta a partir de uma empresa e unidade reais, revisar, emitir com numeração anual, gerar uma segunda versão e preservar o histórico da primeira.

**Fora do escopo:** financeiro completo, assinatura eletrônica, IA autônoma, integração ampla com órgãos públicos e geração de todos os serviços simultaneamente.

### Fase 2 — Conversão da venda em execução técnica

**Objetivo:** fazer a proposta aprovada gerar uma operação controlada, sem redigitação e sem perda do escopo contratado.

| Frente | Entrega |
|---|---|
| Conversão | Proposta aprovada convertida em projeto ou entrega técnica vinculada à empresa, unidade e oportunidade |
| Escopo | Cópia congelada do escopo, entregáveis, premissas, exclusões, valor e condição de pagamento aprovados |
| Documentos | Checklist por serviço com recebido, pendente, incompleto e evidências anexadas |
| Execução | Tarefas, responsáveis, prazos, revisão interna, protocolo quando contratado, entrega e aceite |
| Pendências | Registro de bloqueios, solicitações ao cliente, ajustes e reprocessamento da entrega |
| Histórico | Linha do tempo da contratação, documentos, atividades, alterações, aceite e encerramento |

**Critério de aceite:** aprovar uma proposta, gerar automaticamente a entrega técnica, solicitar documentos, registrar uma pendência, concluir a revisão, entregar o resultado e encerrar com aceite ou justificativa documentada.

**Fora do escopo:** substituir avaliação técnica por IA, afirmar aprovação de órgão público ou considerar uma licença vencida como irregularidade jurídica sem validação documental.

### Fase 3 — Inteligência, automação e escala

**Objetivo:** reduzir trabalho repetitivo e melhorar previsão comercial depois que o processo básico estiver comprovado.

| Frente | Entrega |
|---|---|
| Radar | Vencimentos, obrigações, riscos e sinais comerciais ligados a oportunidades qualificadas |
| Follow-up | Atividades automáticas após envio de proposta, com prazos e intervenção humana |
| Indicadores | Propostas no mês, valor proposto, valor fechado, conversão, ticket, motivos de perda e ciclo médio |
| IA assistiva | Sugestão de serviço, resumo executivo, adaptação controlada de escopo e identificação de campos faltantes |
| Validação externa | Consulta permitida a fontes oficiais, com URL, data, retorno bruto essencial e nível de confiança |
| Integrações | Assinatura eletrônica, financeiro, e-mail e fontes externas somente quando houver provedor e credenciais adequados |

**Critério de aceite:** as automações devem ser idempotentes, auditáveis e reversíveis; a IA deve apresentar sugestões com origem e exigir aprovação humana; nenhuma automação deve emitir proposta, prometer aprovação ou criar obrigação jurídica sem confirmação.

**Fora do escopo:** financeiro contábil completo sem requisitos próprios, scraping de portais protegidos, contorno de CAPTCHA ou uso de fonte oficial sem autorização.

## 9. Piloto recomendado

O piloto deve usar **um único serviço de alta recorrência e escopo relativamente padronizável**, como renovação de Licença de Operação, desde que a Raizon forneça o modelo DOCX oficial e valide o conteúdo técnico. O piloto deve passar por pelo menos um rascunho, uma revisão, uma emissão, uma alteração de versão e um cancelamento controlado. Depois, deve transformar uma proposta aprovada em checklist de documentos e entrega técnica.

Não recomendo começar com todos os serviços, todas as fontes públicas, financeiro completo e IA no mesmo ciclo. Isso dificultaria identificar se um problema veio do conteúdo técnico, da integração, do documento, do preço ou do processo comercial.

## 10. Decisão final

A alternativa recomendada é **implementar o motor governado de propostas como próxima grande frente**, mas em escopo controlado: catálogo de serviços, proposta versionada, template DOCX, numeração anual, revisão humana, checklist documental e conversão para entrega técnica. O sistema deve ser determinístico nos dados e documentos; a IA deve atuar como assistente de interpretação e redação, nunca como autoridade técnica ou jurídica.

Essa abordagem aproveita a base existente, produz valor comercial rapidamente e reduz o risco de construir um ERP amplo antes de validar o processo real. O próximo passo executável é selecionar um serviço piloto, fornecer o modelo DOCX oficial e aprovar os campos, cláusulas, entregáveis, exclusões e regra de preço que formarão a primeira ficha de serviço.
