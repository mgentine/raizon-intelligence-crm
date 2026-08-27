# Matriz de homologação documental — propostas, contratos e execução

**Data da análise:** 27 de agosto de 2026  
**Escopo:** oito PDFs encaminhados pelo responsável do CRM.  
**Regra aplicada:** documento emitido pela Raizon não equivale, por si só, a aceite da contratante. Esta análise não executou mutações no CRM, não criou empresas/propostas/projetos e não alterou a proposta nº 58/2026.

## Critério de classificação

| Situação | Evidência mínima reconhecida nesta análise | Efeito no CRM |
|---|---|---|
| Emitida | Proposta assinada apenas pela contratada ou identificada como proposta. | Manter `documentStatus=issued` e `decisionStatus=pending`. |
| Aceite/contratação demonstrado | Aceite expresso rastreável, contrato bilateral verificável, ordem de serviço ou instrumento equivalente. | Elegível à decisão de aceite, mas depende de autorização explícita para mutation. |
| Execução documentada | Relatório, medição, protocolo ou entrega vinculados a contrato/proposta identificável. | Evidência complementar; não substitui automaticamente aceite/contrato. |
| Não comprovado | Não há elemento documental suficiente ou há minuta/campo de assinatura sem prova material. | Não alterar status nem iniciar execução. |

## Inventário e fatos extraídos

| Documento | Contratante/cliente identificado | Fato documental relevante | Situação documental | Conclusão operacional |
|---|---|---|---|---|
| Proposta nº 56/2026 — PLANCON | Município de Palmeira d’Oeste/SP | Escopo PLANCON, R$ 13.000,00, validade de 30 dias e assinatura digital da Raizon em 17/08/2026. | **Emitida**; não há aceite da contratante no arquivo. | Não criar projeto. |
| Proposta nº 59/2026 — PGRS/licenciamento | T. A. Refrigeração Ltda. | CNPJ 14.427.300/0001-66, escopo e investimento de R$ 1.580,00; assinatura digital da Raizon em 04/08/2026. | **Emitida**; sem aceite/contrato anexado. | Não criar projeto. |
| Proposta nº 58/2026 — renovação de outorgas | TANSAN Indústria Química Ltda. / unidade Jarinu | CNPJ 20.927.059/0018-85, investimento de R$ 3.500,00 e assinatura digital da Raizon em 21/08/2026. | **Emitida**; CRM já a contém como proposta 58/2026 com decisão pendente. | Manter inalterada, conforme determinação anterior. |
| Contrato — Rodrigo Bersaneti Alves | Pessoa física identificada no instrumento | Objeto ambiental, valor R$ 6.500,00 e campos de assinatura. A página final mantém data e linhas de assinatura em branco. | **Não comprovado** como contratação assinada. | Não cadastrar/aceitar a partir deste arquivo. |
| Proposta — Grupo Venturini | Jose Pedro Venturini Junior ME e Venturini & Cia Ltda. | Duas renovações CETESB, R$ 6.700,00, validade até 31/03/2026. | **Emitida**; não há aceite, protocolo ou execução anexados. | Não criar projeto. |
| Proposta nº 42/2026 — planos de resíduos | Município de Aparecida d’Oeste/SP | Escopo PMGIRS/PGRCC/PGRSS e investimento de R$ 16.000,00. | **Emitida**; o próprio texto condiciona a contratação a aceite e instrumento administrativo. | Não criar projeto. |
| Contrato nº 006/2026 — PM Guzolândia | Município de Guzolândia/SP | Instrumento administrativo para PMGIRS e itens correlatos, valor total R$ 33.000,00 e data 05/02/2026. | **Contrato documentalmente identificado**, mas as páginas de assinatura visualizadas exibem campos sem assinatura/certificação visível. | Candidato a homologação controlada; não alterar sem autorização específica. |
| Relatório de execução e medição nº 01 — Guzolândia | Município de Guzolândia/SP | Vincula-se ao contrato nº 006/2026; registra medição de R$ 12.000,00, visita em 28/03/2026, protocolo CETESB em 14/05/2026 e entrega de PLANCON Fase 1 em 18/05/2026. | **Execução documentalmente relatada** e assinada pela contratada; não constitui, isoladamente, aceite de medição pela contratante. | Evidência forte de execução, dependente de autorização e, se exigido, de aceite/atesto da contratante. |

## Confronto com o CRM em modo somente leitura

A consulta de conferência localizou apenas a empresa TANSAN no subconjunto de CNPJs documentados. A proposta associada permanece `status=issued`, `documentStatus=issued`, `decisionStatus=pending`, investimento de R$ 3.500,00 e sem projeto de execução. Esse resultado confirma que **nenhum dos documentos recém-recebidos foi incorporado automaticamente**.

O primeiro comando de conferência utilizou nomes SQL em formato `snake_case`, incompatíveis com as colunas físicas em `camelCase`, e foi rejeitado antes de retornar dados. A repetição com identificadores corretos foi apenas de leitura; a resposta agregada da ferramenta não preservou a separação visual entre os quatro `SELECTs`. Por isso, a única conclusão de banco assumida aqui é a presença da TANSAN e da proposta nº 58/2026; ausência de outras empresas no retorno não deve ser tratada como prova de inexistência fora da amostra consultada.

## Recomendação e próxima decisão

> **Recomendação:** não usar nenhuma proposta isolada para criar projeto. O único conjunto com evidência documental material de contrato e execução é o caso **Município de Guzolândia / Contrato nº 006/2026**. Mesmo assim, a atualização no CRM deve ocorrer somente após autorização expressa para cadastrar ou vincular essa empresa e criar a proposta/projeto histórico, pois o instrumento visualizado não demonstra assinatura bilateral e o relatório de execução é subscrito pela contratada.

| Decisão necessária | Alternativa segura |
|---|---|
| Homologar Guzolândia como caso histórico contratado/em execução | Autorizar explicitamente o cadastro da empresa, proposta/contrato histórico e projeto, indicando o estado operacional desejado: `in_progress`, `delivered` ou `closed`. |
| Tratar as demais propostas | Mantê-las fora do CRM até envio de aceite, contrato, ordem de serviço, e-mail de aceite ou outra evidência rastreável. |
| Alimentar a base de clientes | Enviar CSV/XLSX separado; os PDFs não são uma base tabular de importação e não serão usados para criação em lote. |

## Limites

Esta é uma análise documental e técnica de rastreabilidade, não uma validação jurídica da contratação, assinaturas, exigibilidade, adimplemento ou regularidade de contratos. Não foram verificadas assinaturas digitais por cadeia criptográfica, publicações oficiais, processos administrativos externos, recebimento de pagamento ou atesto formal da contratante.

## Homologação autorizada posterior

Em 27/08/2026, o responsável pelo CRM autorizou explicitamente o cadastro histórico controlado do Município de Guzolândia/SP, com projeto inicial **em execução**. O cadastro passou a usar `Contrato nº 006/2026` como origem documental e a separar essa base de ativação de aceite comercial final: a proposta histórica ficou `documentStatus=issued` e `decisionStatus=pending`, enquanto o projeto recebeu `activationBasis=documented_contract` e permanece `in_progress`.

Nenhum pagamento, atesto, aceite final, aprovação final ou encerramento foi registrado. As três pendências continuam abertas como tarefas documentais, e os dois PDFs de origem foram preservados em S3 e vinculados ao projeto.
