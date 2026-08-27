# Fase 2 — Execução e entrega técnica

## Objetivo

A Fase 2 converte uma proposta aceita em uma execução técnica rastreável. O projeto preserva o escopo comercial aprovado como snapshot, organiza documentos e tarefas, separa arquivos técnicos de evidências regulatórias e oferece uma trilha operacional até a entrega e o encerramento.

## Fluxo implementado

| Etapa | Registro principal | Controle aplicado |
|---|---|---|
| Proposta aceita | `proposals` | Apenas proposta com status `accepted` pode originar execução. |
| Abertura | `execution_projects` | Escopo, entregáveis, exclusões, documentos obrigatórios e vínculo comercial são copiados para snapshots. |
| Preparação | `project_checklist` | Cada documento obrigatório vira item de checklist com responsável e status. |
| Execução | `project_tasks` | Tarefas possuem categoria, responsável, prazo, status e data de conclusão. |
| Evidência técnica | `project_evidence` + S3 | O banco guarda metadados e referência; o arquivo é armazenado no S3. |
| Entrega e aceite | `execution_projects` | Status controlado por transições; datas de entrega, aceite e fechamento são registradas. |
| Encerramento | `shared/executionRules.ts` | O projeto só pode ser encerrado a partir de `accepted` e sem documentos obrigatórios pendentes. |

## Modelo de evidências técnicas

A tabela `project_evidence` foi criada pela migration `0014_moaning_dorian_gray.sql` e aplicada ao banco. Ela contém `projectId`, vínculo opcional com `taskId`, título, nome do arquivo, tipo MIME, `fileKey`, `fileUrl`, responsável pelo upload e data de criação. Não há coluna BLOB nem bytes de arquivo no banco.

O upload é realizado pelo backend com `storagePut()`, em chave isolada por usuário e projeto. A API restringe o arquivo a 5 MB, sanitiza o nome antes de criar a chave e permite os perfis `admin`, `commercial` e `technical`. A listagem é sempre filtrada por projeto e os arquivos são abertos pela URL retornada pelo armazenamento.

> **Governança:** evidência técnica de execução não substitui evidência regulatória. A primeira documenta o trabalho contratado e seus resultados; a segunda permanece vinculada ao ato regulatório e à fonte correspondente.

## Procedures adicionadas

| Procedure | Tipo | Função |
|---|---|---|
| `execution.evidence` | Query protegida | Lista evidências técnicas de um projeto. |
| `execution.uploadEvidence` | Mutation protegida | Recebe arquivo em base64, grava no S3 e persiste metadados em `project_evidence`. |

As procedures reutilizam o mesmo padrão tRPC do CRM e não criam endpoint REST paralelo. A validação de projeto ocorre antes da persistência dos metadados.

## Interface

A `ExecutionCenterView` agora apresenta a ficha do projeto com escopo congelado, entregáveis, checklist documental, tarefas técnicas e uma seção de evidências. O usuário informa o título, seleciona o arquivo e anexa o documento. Após sucesso, a listagem é atualizada e exibe título, nome do arquivo, data e ação para abertura.

A validação visual foi realizada em `/?view=Execução` nos viewports desktop de 1280×720 e móvel de 390×844. Com o banco sem projetos, foram confirmados os estados vazios, a navegação para Execução, o botão de abertura e a adaptação das colunas. O estado populado e o upload efetivo dependem de uma proposta aceita e de dados reais do ambiente.

## Critérios de aceite da Fase 2

A implementação é considerada tecnicamente pronta para validação operacional quando uma proposta aceita puder abrir um projeto, copiar seus snapshots, gerar checklist, receber tarefas, anexar evidências no S3 e avançar por transições válidas até `accepted`. O encerramento permanece condicionado à aprovação ou dispensa de todos os documentos obrigatórios.

A transição ponta a ponta com dados reais ainda não foi executada para evitar a inserção de clientes, propostas ou arquivos artificiais no banco. Essa validação deve ser feita pelo responsável do ambiente usando uma proposta real ou um registro de teste explicitamente autorizado.

## Validação realizada

| Verificação | Resultado |
|---|---|
| TypeScript | Aprovado com `pnpm exec tsc --noEmit`. |
| Testes automatizados | 57 testes aprovados em 9 arquivos Vitest. |
| Build | Build de produção executado com sucesso. |
| Migration | SQL gerado e aplicado sem operação destrutiva. |
| Visual desktop | Aprovado com estado vazio da Central de Execução. |
| Visual mobile | Aprovado com estado vazio e layout responsivo. |

## Riscos e próximos passos

O limite atual de 5 MB e o transporte em base64 são adequados para documentos operacionais pequenos, mas podem exigir upload multipart ou presigned URL em uma evolução futura para relatórios pesados, vídeos, plantas ou conjuntos de medições. Também permanece como próximo passo a validação operacional com dados reais e o refinamento do registro de aceite/justificativa antes do encerramento, caso a política interna da Raizon exija uma justificativa textual obrigatória.

Com a Fase 2 concluída, a Fase 3 pode tratar inteligência e automação: priorização baseada em histórico, geração de filas determinísticas, alertas de recorrência, indicadores de produtividade e apoio analítico sem inventar dados técnicos ou regulatórios.
