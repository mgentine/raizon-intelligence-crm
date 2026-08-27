# Homologação histórica controlada — Município de Guzolândia/SP

**Data:** 27 de agosto de 2026  
**Autorização:** cadastro histórico controlado fornecido pelo responsável do CRM.  
**Base documental:** Contrato nº 006/2026 e Relatório Técnico de Execução e Medição nº 01, ambos encaminhados pelo responsável do CRM.

## Registro criado

| Entidade | Identificador | Estado registrado | Fundamentação documental |
|---|---:|---|---|
| Empresa | `30001` | Município de Guzolândia, CNPJ 45.746.112/0001-24, condição operacional ativa | Identificação do Contrato nº 006/2026. |
| Serviço histórico | `30001` | Inativo para novas propostas; chave `historico-guzolandia-contrato-006-2026` | Escopo contratual documental. |
| Oportunidade | `30001` | `execution`, valor estimado de R$ 33.000,00 | Objeto e valor global do contrato. |
| Proposta histórica | `30001`, `H-006/2026` | Documento emitido; **decisão pendente** | O identificador é interno histórico. O contrato é documentado, mas o aceite final não foi apresentado. |
| Projeto de execução | `1` | `in_progress`, com `activationBasis=documented_contract` | Contrato e relatórios registram contratação, execução e entregas. |

## Rastreabilidade e integridade

Os PDFs `CONTRATO.pdf` e `001_RelatórioTécnico-Medição01-PMGuzolandia.pdf` foram preservados como evidências do projeto em armazenamento S3. Seus hashes SHA-256 são, respectivamente, `9ce320d47daffc1ea77b974c73d1eedbb67b451ee8f1a83f1a2bc60ed48c23ef` e `a4a4c05f6e1cdf43f06a773403e2bfdd9cc447af387afb057d8f91d53066b443`.

Foram criadas quatro atividades documentais: contrato identificado em 05/02/2026; visita técnica em 28/03/2026; protocolo relatado em 14/05/2026; e entrega técnica do PLANCON Fase 1 em 18/05/2026. Datas civis foram registradas segundo a convenção técnica de meio-dia BRT quando a coluna exige instante, sem transformar o horário escolhido em fato documental.

| Verificação após o commit | Resultado |
|---|---|
| Empresa → oportunidade → proposta → projeto | 1 vínculo íntegro em cada relação. |
| Evidências preservadas | 2 PDFs vinculados ao projeto. |
| Atividades documentais | 4 registros. |
| Tarefas abertas | 3 pendências documentais. |
| Tarefas concluídas artificialmente | 0. |
| Checklist criado sem base documental | 0. |
| Blockers abertos | 0; nenhuma pendência foi mascarada como blocker sem responsável ou causa operacional. |
| Decisão comercial de aceite | `pending`; não registrada. |
| Estado de execução | `in_progress`; não entregue, aceita ou encerrada. |

## Pendências registradas

| Pendência aberta | Motivo |
|---|---|
| Obter atesto ou aceite final da contratante para entregas e Medição nº 01 | Não apresentado nos documentos analisados. |
| Verificar a situação dos itens contratuais não abrangidos pela Medição nº 01 | A medição detalha somente itens 3 (Fase 1), 6, 7, 8 e 9. |
| Definir eventual instrumento para Fase 2 do PLANCON, se aplicável | O relatório menciona fase posterior condicionada a repactuação ou novo instrumento. |

## Correção semântica aplicada

A primeira criação técnica usou a decisão `accepted` para atingir o caminho convencional de execução. Essa modelagem conflitaria com a instrução expressa de não presumir aceite final. A inconsistência foi identificada em validação somente leitura e corrigida na mesma rodada por migration aditiva `0024_certain_rage.sql`: `proposals` recebeu `contractReference` e `contractDocumentedAt`; `execution_projects` recebeu `activationBasis`. O registro histórico foi então ajustado para proposta emitida com decisão pendente e projeto ativado exclusivamente por contrato documentado.

> **Limite importante:** a existência documental de contrato e execução justificou o cadastro histórico autorizado. Ela não substitui validação jurídica de assinaturas, atesto, aceite de medição, adimplemento ou encerramento. Qualquer avanço para `delivered`, `accepted` ou `closed` exige evidência documental específica e nova autorização operacional.

## Limites técnicos remanescentes

O backend já deriva a condição comercial da empresa a partir de oportunidades e projetos e classifica Guzolândia como cliente em execução. A listagem de Empresas ainda exibe o campo legado `relationshipStatus`, que pode aparecer como `prospect`; essa apresentação não foi alterada nesta homologação para evitar uma alteração de interface fora do fluxo histórico autorizado. O alinhamento visual permanece registrado como melhoria futura e não altera os dados nem a condição derivada usada pelo backend.

O upload dos objetos S3 ocorre antes do commit dos metadados do banco. Neste caso, a transação foi concluída e os dois objetos estão referenciados; em uma falha posterior, poderia restar objeto não referenciado, o que requer rotina de reconciliação futura. Também não foram executados teste de concorrência física em sessões TiDB independentes nem validação criptográfica de assinaturas digitais/bilaterais.
