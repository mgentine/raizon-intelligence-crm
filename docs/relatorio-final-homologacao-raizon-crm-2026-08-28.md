# Relatório final — Raizon Intelligence CRM

**Data da homologação:** 28 de agosto de 2026  
**Caso real autorizado:** Município de Guzolândia/SP — CNPJ 45.746.112/0001-24  
**Decisão de release:** **SIM, SOMENTE EM PILOTO CONTROLADO**

## 1. Veredito executivo

O CRM está apto a iniciar um **piloto interno controlado**, com poucos usuários autorizados e poucos cadastros reais, mantendo acompanhamento técnico do uso. A decisão não autoriza produção irrestrita: o fluxo histórico de Guzolândia foi validado até o estado documentalmente suportado — **em execução** — e os controles críticos de banco, estados, permissões, upload, rastreabilidade e concorrência física foram verificados. Ainda falta a evidência de recuperação por backup/restauração e permanecem bloqueados fluxos que dependem de dado real ainda não fornecido.

> **Não houve aceite final, atesto, pagamento, encerramento ou conclusão artificial de Guzolândia.** O sistema preserva proposta documental emitida e decisão comercial pendente; o projeto está ativado por contrato documentado, não por aceite do cliente.

| Dimensão | Decisão | Base da decisão |
|---|---|---|
| Piloto interno controlado | **Aprovado** | Um caso real, transações críticas, migrations, testes e telas principais validados. |
| Uso interno contínuo | **Condicionado** | Exige backup atual confirmado e monitoramento dos primeiros registros operacionais. |
| Produção irrestrita | **Não aprovada nesta rodada** | Restore oficial não deve ser usado como teste exploratório; também há apenas um caso real homologado e importação real pendente. |

## 2. Estado técnico final

O sistema continua em React 19, TypeScript 5.9, Vite 7, Node/Express, tRPC 11, Drizzle e TiDB/MySQL. Manus OAuth permanece como autenticação vigente; autenticação própria, recuperação de senha e MFA permanecem congeladas. As mudanças foram limitadas a defeitos ou lacunas comprovadas: audit log persistido, proteção de logs tRPC, semântica de execução histórica, classificação visual derivada da empresa, alerta indevido de validade, gestão administrativa de perfis OAuth e ergonomia do funil móvel.

| Verificação | Resultado comprovado |
|---|---|
| TypeScript | `pnpm exec tsc --noEmit` sem erro. |
| Testes automatizados | 25 arquivos, 117 testes aprovados, 0 falhas; a saída não registrou testes ignorados. |
| Migrations no banco operacional | `pnpm drizzle-kit migrate` concluído sem tentar reaplicar DDL. |
| Banco vazio temporário | 26 migrations aplicadas; 26 tabelas criadas; `audit_events` com 11 colunas. Banco temporário removido pelo verificador. |
| Concorrência física TiDB | Duas conexões isoladas serializaram `proposal_sequences` (`1 → 3`, espera de 307 ms); UNIQUE rejeitou duplicação concorrente de proposta e de projeto por proposta. |
| Build de produção | Concluído. Há aviso não bloqueante de chunk JavaScript acima de 500 kB. |
| Integridade do diff | `git diff --check` sem erro. |

## 3. Arquitetura e domínio final

O domínio preserva compatibilidade com registros legados e mantém a separação aditiva entre documento, decisão comercial e execução. `Proposal` distingue `documentStatus` de `decisionStatus`; `ExecutionProject` distingue `phase` de `activationBasis`; `Company` possui condição operacional e relação comercial derivada; `Lead` convertido aponta para `Opportunity`; blockers permanecem entidade própria; e valores monetários persistem como `decimal`/string, sem `float` ou `double`.

| Conceito | Estado aplicado nesta homologação |
|---|---|
| Documento/proposta | Pode estar `issued` sem decisão comercial de aceite. |
| Contrato documentado | Pode ser origem de projeto histórico com `activationBasis=documented_contract`. |
| Aceite do cliente | Continua exigido no fluxo normal `Proposal → ExecutionProject`; não foi flexibilizado. |
| Entrega | Não implica aceite nem encerramento. |
| Blocker | Não é criado automaticamente a partir de tarefa ou atraso. |
| Arquivamento | Soft archive é preservado e passou a gerar evento auditável para evidências. |

## 4. Caso Guzolândia cadastrado

O agregado autorizado foi consultado novamente após a reexecução idempotente da rotina. Não houve duplicação. A reexecução retornou `alreadyApplied=true`, com proposta `30001` e projeto `1`; o processo foi encerrado após o resultado porque a conexão de desenvolvimento ficou aberta, sem criar registro adicional.

| Entidade | Identificador | Estado comprovado na consulta final |
|---|---:|---|
| Empresa | `30001` | Município de Guzolândia, ativo; relação comercial derivada exibida como **Cliente base**. |
| Oportunidade | `30001` | Etapa `execution`. |
| Proposta histórica | `30001` / `H-006/2026` | `issued / issued / pending`; `decidedAt = NULL`; referência ao Contrato nº 006/2026. |
| Projeto | `1` | `in_progress / in_progress / documented_contract`. |
| Evidências do projeto | 2 | Contrato e relatório técnico preservados em S3. |
| Atividades documentais | 4 | Contrato, visita, protocolo e entrega documental. |
| Tarefas | 3 abertas; 0 concluídas | Representam pendências documentais, não atividades concluídas artificialmente. |
| Checklist | 0 | Não foi inventado checklist sem fonte documental. |
| Blockers | 0 | Não existia impedimento documental suficientemente definido para cadastro. |

Os arquivos de origem permanecem identificados pelos hashes SHA-256 `9ce320d47daffc1ea77b974c73d1eedbb67b451ee8f1a83f1a2bc60ed48c23ef` (Contrato nº 006/2026) e `a4a4c05f6e1cdf43f06a773403e2bfdd9cc447af387afb057d8f91d53066b443` (Relatório Técnico/Medição nº 01).

## 5. Fluxos homologados

| Fluxo ou controle | Evidência de homologação | Resultado |
|---|---|---|
| Company → Opportunity → Proposal → Project | Consulta somente leitura do agregado real e telas de Empresas, Oportunidades, Propostas e Execução | Aprovado até `in_progress`. |
| Contrato documentado ≠ aceite | Proposta histórica `decisionStatus=pending`, projeto com `activationBasis=documented_contract`, teste de regressão | Aprovado. |
| Idempotência histórica | Reexecução controlada da rotina e contagens 1/1/1/1/2/3/4 | Aprovado, sem duplicidade. |
| Proposal aceita → Project convencional | Testes transacionais e locks preexistentes, mantidos verdes | Aprovado por teste automatizado. |
| Transições de execução | Regras e testes de estados; não houve alteração artificial do projeto real | Aprovado por teste automatizado; estado real preservado. |
| Upload de evidência | Testes para tamanho inválido, falha de S3 e projeto inexistente | Aprovado por teste controlado. |
| Archive de evidência | Teste de soft archive e evento de auditoria | Aprovado por teste controlado. |
| RBAC server-side | Testes de commercial, technical e admin; consulta de audit log exclusiva de admin | Aprovado por teste automatizado. |

## 6. Audit log e observabilidade

Foi criada a migration aditiva `0025_clumsy_nick_fury.sql`, que adiciona `audit_events`. O evento armazena tipo e identificador da entidade, ação, ator, origem, snapshots antes/depois, metadados, data e campo opcional para correlação quando uma requisição o fornecer. Não existem FKs nessa tabela para não impedir a preservação do histórico após archive ou evolução de registros relacionados.

O evento real `1` foi gravado para o Projeto `1` com ação `historical_homologation_verified`, ator `1`, origem `homologation_2026_08_28` e snapshot do estado observado. Esse evento registra **a revisão atual**, não pretende retroagir o instante original de criação, contratação ou entrega. O comportamento prospectivo foi coberto por testes de criação de empresa, mudança de projeto, conclusão de tarefa e archive de evidência.

O coletor de diagnóstico do navegador foi corrigido após a inspeção comprovar que respostas tRPC completas eram gravadas em log de desenvolvimento. Chamadas tRPC atuais passam a registrar somente rota sem query string, método, status, duração e marcador `[tRPC payload not recorded]`; corpo, cabeçalhos e parâmetros são omitidos. A validação pós-reinício confirmou ausência de `input=` e de conteúdo de Guzolândia nas novas entradas tRPC. Logs antigos que continham payload foram limpos do ambiente de desenvolvimento.

## 7. Segurança, storage e erros

Manus OAuth continua sendo a fronteira de autenticação. As procedures protegidas usam autorização de perfil no servidor; a interface não é a única barreira. A seção administrativa **Acessos de equipe** lista somente contas que já autenticaram via OAuth e permite ao administrador atribuir perfil comercial/técnico e papel administrativo, com auditoria. A conta proprietária e o administrador atual não podem perder administração nessa tela. O upload de evidência valida título, tamanho máximo de 5 MB e falhas de storage, e só tenta persistir os metadados depois do armazenamento retornar sucesso. Há, contudo, um limite conhecido: uma falha posterior ao upload e anterior ao commit pode deixar objeto S3 sem referência; Guzolândia não está nessa condição, pois seus dois objetos foram associados na transação concluída.

| Controle | Resultado | Limite residual |
|---|---|---|
| OAuth/RBAC | Validado por procedures, gestão administrativa de perfis e testes automatizados | Não houve teste manual com múltiplas contas reais nesta rodada. |
| IDOR e validação de IDs | Rotas verificadas por contratos e cenários de erro | Não foi realizado pentest independente. |
| Upload/S3 | Tamanho inválido, falha de storage e projeto inexistente testados | Não há compensação automática para objeto S3 órfão após falha posterior ao upload. |
| Logs | Payload tRPC atual redigido e teste de regressão criado | A proteção cobre o coletor de desenvolvimento auditado, não substitui política corporativa de retenção de logs. |
| Jobs periódicos | Permanecem cron-only e inertes até autorização | Nenhuma ingestão automática externa foi ativada. |

## 8. Migrations, backup e recuperação

As migrations 0000–0025 foram aplicadas com sucesso a banco TiDB temporário vazio e o schema resultante foi validado. O ledger operacional contém 26 entradas; a migration `0025` foi reconciliada após aplicação manual, seguindo o procedimento já adotado no projeto para evitar repetição de DDL no banco ativo. Foi executada concorrência física com duas sessões TiDB no banco temporário; não foi executado upgrade independente a partir de snapshot representativo anterior.

O mecanismo gerenciado de backup de website inclui código, arquivos enviados, banco, configuração e segredos no snapshot de dados da tarefa, mas é um ponto no tempo e não uma sincronização contínua. A restauração requer os pacotes corretos e só pode ser concluída uma vez. Nesta rodada não foi solicitado nem executado restore de ambiente contendo dados reais, pois isso poderia sobrescrever estado operacional. Portanto, a presença do caso de Guzolândia em backup foi **inferida pela arquitetura da plataforma**, não validada por restore controlado; esta é a principal restrição para produção irrestrita. [1] [2]

## 9. Responsividade e experiência operacional

Foram revisadas as telas de Empresas, Oportunidades, Propostas e Execução em 1440×900, 768×1024 e 390×844. Empresas apresenta Guzolândia como **Cliente base** por relação derivada. Propostas apresenta `H-006/2026` como emitida, sem alerta falso de vencimento. Execução apresenta o projeto como **Em execução** e informa que projetos históricos podem decorrer de contratação documentada. Configurações passou a exibir gestão funcional de acessos, sem cartões de ação inoperante.

Não foram observados botões críticos fora do viewport, modais impossíveis de usar ou conteúdo cortado nas telas revisadas. No celular, o funil passou a usar faixa horizontal com snap e oculta somente colunas sem oportunidade; a primeira coluna visível possui cartão real e mantém a ação de edição acessível. As etapas continuam completas nas telas maiores.

## 10. Correções realizadas nesta rodada

| Defeito ou lacuna comprovada | Correção mínima aplicada | Regressão |
|---|---|---|
| Não havia audit log persistido | Migration `0025`, helper transacional, consulta administrativa e eventos críticos | `audit-log.test.ts` e RBAC. |
| Execução histórica era descrita como se viesse sempre de aceite | Linguagem da Central de Execução e subtítulo ajustados | TypeScript, testes e capturas visuais. |
| Empresa histórica aparecia como prospect pelo campo legado | Interface passou a exibir relação comercial derivada | Captura visual em desktop, tablet e celular. |
| H-006/2026 recebia alerta de validade inexistente | Propostas com `validityDays <= 0` não geram alerta de expiração | `proposal-alert.rules.test.ts`. |
| Log de desenvolvimento continha resposta tRPC integral | Coletor omite corpo, cabeçalhos e parâmetros de chamadas tRPC | Teste e validação runtime do log novo. |
| Não havia administração de perfis para contas OAuth já existentes | Nova seção Acessos de equipe, rota exclusiva de admin e evento de auditoria | `access-management.router.test.ts`. |
| Funil móvel iniciava por colunas vazias e exigia rolagem improdutiva | Faixa horizontal com snap e ocultação móvel somente de etapas vazias | Captura em 390 px com cartão e ação acessíveis. |

## 11. Fluxos não homologados e pendências externas

Os itens a seguir não são falha de código nesta rodada, mas não possuem base real ou autorização suficiente para homologação operacional: importação definitiva de CSV/XLSX de clientes e conflitos reais; segunda proposta efetivamente aceita; agenda recorrente real; conjunto CETESB ampliado; fonte/API regulatória oficialmente adequada; e automações externas. Todos permanecem bloqueados ou em staging conforme decisão anterior.

Também permanece pendente a verificação documental ou jurídica de assinatura bilateral/digital, atesto, aceite final, pagamento, itens contratuais remanescentes e encerramento do Contrato nº 006/2026. Essas ausências são fatos não cadastrados, não defeitos do CRM.

## 12. Riscos residuais e evidência necessária

| Classificação | Risco ou restrição | Evidência concreta para remover |
|---|---|---|
| **Bloqueia produção irrestrita** | Restore de backup não executado em ambiente controlado | Backup atual completo e restore controlado que confirme código, banco, evidências e audit log. |
| **Não bloqueia piloto** | S3 pode manter objeto sem referência se o banco falhar após upload | Rotina de reconciliação/limpeza ou mecanismo compensatório testado. |
| **Não bloqueia piloto** | Audit log só passa a registrar mutações futuras; criação original de Guzolândia antecedeu a tabela | Histórico de novos eventos em operação e, se necessário, evento de reconciliação explicitamente datado — já criado para a revisão, sem retroação. |
| **Melhoria futura** | Aviso de chunk Vite acima de 500 kB | Medição de performance real que justifique code splitting. |

## 13. Funcionalidades congeladas

Permanecem fora desta liberação: autenticação própria, recuperação de senha, MFA, portal do cliente, WhatsApp, OCR, financeiro completo, novas integrações regulatórias, dashboards novos, BI avançado, automações externas, IA autônoma e aplicativo mobile dedicado. CETESB e SP Águas não receberam scraping, contorno de CAPTCHA ou coleta automática.

## 14. Decisão final e próximo passo

**O RAIZON INTELLIGENCE CRM ESTÁ PRONTO PARA SER UTILIZADO NA OPERAÇÃO REAL DA RAIZON?**

> **SIM, SOMENTE EM PILOTO CONTROLADO.**

O piloto deve iniciar com acesso interno limitado, manutenção do Manus OAuth, cadastro manual/rastreável e monitoramento dos primeiros fluxos. Não autorizar importação definitiva, automação externa, mudança de estado de Guzolândia ou expansão para produção irrestrita sem evidência adicional. Antes de publicar, o responsável deve executar o procedimento `docs/procedimento-liberacao-controlada-2026-08-28.md`, confirmar o backup atual conforme o aviso oficial aplicável à conta e atribuir os perfis de cada colaborador depois do primeiro login OAuth. A publicação pode então ocorrer como piloto; não é necessário nem recomendável usar a restauração oficial como teste exploratório.

## Referências

[1] [Backup de dados de websites — orientação oficial](https://help.manus.im/en/articles/16147892-service-change-overview-how-to-back-up-your-data)  
[2] [Restauração de dados de websites — orientação oficial](https://help.manus.im/en/articles/16147895-service-change-overview-how-to-restore-your-data)
