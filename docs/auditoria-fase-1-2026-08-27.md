# Auditoria da Fase 1 — 27/08/2026

## Conclusão executiva

A Fase 1 está **estruturalmente consistente** entre schema, migration, banco conectado, procedures, permissões e telas. A auditoria encontrou e corrigiu duas inconsistências de efetividade: o endpoint de template aceitava arquivos que não eram DOCX, apesar da interface indicar esse formato; e o componente de cabeçalho genérico exibia “Novo registro” em telas que não forneciam uma ação correspondente.

## Evidências verificadas

| Área | Verificação | Resultado |
|---|---|---|
| Banco | `raizon_profiles`, `service_catalog`, `proposal_sequences` e `proposals` existem | Conforme |
| Schema | Colunas de cadastro mestre, catálogo, snapshots, versionamento e numeração presentes | Conforme |
| Migration | `0012_sticky_grey_gargoyle.sql` é aditiva e cria as quatro estruturas | Conforme |
| Propostas | Empresa, oportunidade e serviço são relacionados; snapshots e mapa de origem são gravados | Conforme |
| Versionamento | Série por oportunidade, versão incremental e número anual preservado entre versões | Conforme |
| Emissão | Exige status `approved_internal`; numera apenas quando ainda não há número | Conforme |
| RBAC | Cadastro mestre administrativo; catálogo técnico/admin; proposta comercial/admin; revisão também técnica | Conforme |
| Template | DOCX, MIME permitido, nome sanitizado, limite de 5 MB e S3 | Corrigido e testado |
| Interface | CTAs específicos nas telas de Serviços e Propostas; duplicidade genérica removida | Corrigido |

## Correções aplicadas

A validação de templates foi extraída para `shared/templateRules.ts`, com testes próprios. O backend agora rejeita extensão ou MIME incompatível, sanitiza o nome e mantém o limite de tamanho antes do envio ao S3.

A emissão de propostas foi ajustada para permitir a emissão de uma nova versão aprovada mantendo o número original da série, em vez de rejeitar qualquer proposta que já possuísse número.

A criação de rascunhos agora confirma no backend que a oportunidade pertence à empresa selecionada, que unidade e contato pertencem à mesma empresa e que a oportunidade está em proposta ou etapa posterior. O perfil técnico pode encaminhar uma proposta para revisão técnica, mas não pode aprovar, emitir, negociar ou aceitar externamente.

## Validação automatizada e visual

TypeScript, build de produção e a suíte Vitest foram executados. A suíte final contém 54 testes aprovados, incluindo regras de etapa mínima, vínculos entre entidades, perfil técnico e validação de templates DOCX. As telas de Serviços, Propostas e Configurações foram revisadas em desktop 1280×720 e mobile 390×844, incluindo estados vazios e carregamento.

## Limitação conhecida

O banco desta sessão não possui registros operacionais populados. Portanto, não foi executada uma operação real de criar serviço, anexar DOCX, criar proposta, revisar, emitir e criar nova versão com dados persistidos. Essa validação deve ser feita com um serviço, uma empresa e uma oportunidade reais antes de usar a emissão em operação.
