# Auditoria de segurança pré-piloto

**Projeto:** Raizon Intelligence CRM  
**Data:** 30 de agosto de 2026  
**Escopo:** código versionado, configuração da aplicação, dependências e validações automatizadas. Não foram impressos valores de secrets nem executadas mutações nos dados operacionais.

## Veredito executivo

A versão está **apta para piloto controlado**, mas não deve ser classificada como segurança irrestrita ou certificada. Os controles críticos de aplicação estão ativos: Manus OAuth server-side, autorização por perfil no servidor, cookies protegidos, validação de entradas, queries parametrizadas, limites de upload, headers HTTP, rate limit básico, trilha de auditoria e redução de payloads sensíveis em logs.

A auditoria de dependências terminou sem vulnerabilidades conhecidas de severidade alta ou crítica e, após a remoção do ExcelJS, sem vulnerabilidade conhecida na auditoria de produção. O único risco moderado identificado vinha do `uuid` transitivo do ExcelJS; o fluxo foi migrado para `read-excel-file` e o ExcelJS foi removido.

Persistem limitações: TiDB não oferece RLS nativo no modelo utilizado; não há criptografia de campo implementada pelo CRM; não há bot protection dedicado/WAF/CAPTCHA; a aplicação depende da terminação HTTPS do hosting; e backup/restore operacional ainda exige confirmação e execução manual do responsável.

## Classificação dos vinte controles

| Nº | Controle | Estado | Evidência / conclusão |
|---:|---|---|---|
| 1 | Esconder API Keys | **Ativo com ressalva** | Secrets de servidor são obtidos por ambiente e não foram encontrados padrões de chaves privadas no repositório. Variáveis `VITE_*` são públicas por definição e não podem conter segredos. A chave de mapa do cliente deve ser tratada como chave pública restrita por origem/quota, não como segredo. |
| 2 | Limpar secrets do Git | **Comprovado no estado auditado** | Não há `.env`, certificados, chaves privadas ou arquivos de credenciais rastreados; a busca histórica por nomes de arquivos sensíveis não retornou itens. Esta verificação não substitui rotação de qualquer credencial que tenha sido exposta antes desta auditoria. |
| 3 | Public Key DB | **Não aplicável / não implementado** | O CRM usa `DATABASE_URL` no servidor; não expõe conexão de banco ao cliente. Não existe uma “public key” de banco usada pelo frontend. A conexão pública deve continuar proibida. |
| 4 | Ativar RLS | **Não disponível nativamente** | O banco é TiDB/MySQL e não há RLS nativo configurado. O controle compensatório atual é autorização server-side por OAuth, papel e perfil, com queries no servidor. A segregação por tenant não deve ser presumida, pois este piloto é de uma única organização. |
| 5 | Criptografia de dados | **Parcial** | Dados em trânsito e em repouso dependem dos controles do TiDB/hosting e da conexão configurada; não há criptografia de campos sensíveis pelo CRM. Não armazenar secrets ou senhas próprias no banco. |
| 6 | Auth Server Side | **Ativo** | Manus OAuth cria a sessão; contexto e `protectedProcedure` validam o usuário no servidor. Login próprio, recuperação de senha e MFA permanecem congelados. |
| 7 | Restringir acessos | **Ativo** | RBAC foi aplicado às consultas operacionais, gestão de acessos e ações críticas. O servidor não deve confiar em elementos ocultos do frontend. Menor privilégio deve ser aplicado manualmente após o primeiro acesso de cada colaborador. |
| 8 | Bloquear Mass Assignment | **Ativo na superfície revisada** | Procedures usam schemas Zod e campos explícitos para criação/atualização; não foi adotado spread indiscriminado do input em objeto de persistência. |
| 9 | Proteger cookies | **Ativo** | Sessão utiliza cookie server-side com flags de proteção compatíveis com o fluxo OAuth, incluindo `httpOnly`, `sameSite` e `secure` em produção conforme a infraestrutura. |
| 10 | Hash nas senhas | **Não aplicável** | Não existe autenticação própria nem senha armazenada pelo CRM. Se login próprio for aprovado no futuro, deverá entrar como projeto separado com hash forte, recuperação e MFA; não usar o campo atual de OAuth para isso. |
| 11 | Rate Limit | **Ativo, básico** | `express-rate-limit` foi aplicado na borda HTTP, com limite de corpo JSON e proteção de rotas sensíveis. Os limites devem ser ajustados após métricas reais do piloto. |
| 12 | Bot Protection | **Parcial** | Rate limit reduz abuso automatizado, mas não há WAF, CAPTCHA, challenge ou detecção dedicada de bots. Para piloto interno com OAuth isso é aceitável como controle proporcional; exposição pública exigiria camada adicional. |
| 13 | Queries parametrizadas | **Ativo na camada revisada** | Drizzle/mysql2 são usados para consultas e mutações; não foram encontrados caminhos de SQL concatenado nas áreas auditadas. |
| 14 | Validação dos Inputs | **Ativo** | tRPC/Zod valida contratos, CNPJ possui checksum, valores monetários usam regras em centavos/decimal e uploads têm limite de tamanho e campos controlados. |
| 15 | Vazar conteúdo | **Corrigido parcialmente** | O coletor de desenvolvimento deixou de registrar corpos, parâmetros e conteúdo de respostas tRPC; logs antigos foram limpos. As APIs não possuem uma camada universal de redaction de todos os campos, portanto não registrar novos dados pessoais em logs customizados. |
| 16 | Restringir uploads | **Ativo com limites** | Evidências são enviadas ao S3, com limite de 5 MB e metadados vinculados ao registro. O risco residual de objeto S3 não referenciado após falha posterior ao upload permanece documentado. |
| 17 | Trim respostas de API | **Parcial / sem controle universal** | Não existe middleware genérico que reduza cada resposta ao mínimo necessário. A redução de exposição é feita por procedures protegidas e seleção dos campos usados. Esse item não deve ser considerado uma garantia global. |
| 18 | Add Security Headers | **Ativo** | Helmet foi adicionado com regressão automatizada; o servidor emite headers de segurança e limita o parser JSON. |
| 19 | Forçar HTTPS | **Ativo no hosting; não como redirect local** | O endereço publicado pelo hosting Manus usa HTTPS e a sessão usa `secure` em produção. O servidor local continua HTTP para desenvolvimento; isso não deve ser confundido com uma política de redirect de produção. |
| 20 | Scan de dependências | **Comprovado no momento da auditoria** | `pnpm audit --prod` terminou sem vulnerabilidades altas/críticas e, após remoção do ExcelJS, sem vulnerabilidades conhecidas. Há warnings de pacotes deprecated e peer dependency do plugin JSX/Vite; não são vulnerabilidades confirmadas. Repetir o scan no CI e antes de cada publicação. |

## Alterações realizadas nesta rodada

Foram adicionados headers HTTP com Helmet, rate limit e limite de corpo; autorização server-side para consultas operacionais; gestão administrativa de perfis vinculados a Manus OAuth; trilha persistida de auditoria; redação de payloads tRPC no coletor de logs; validações de upload e regressões de segurança. A vulnerabilidade crítica transitiva de `fast-xml-parser` foi eliminada por atualização da cadeia AWS. A vulnerabilidade moderada transitiva do ExcelJS/uuid foi eliminada substituindo ExcelJS por `read-excel-file` e removendo ExcelJS.

A atualização do Express para 5.2.1 e do Recharts para 3.10.1 foi validada com adaptação de tipos dos Tooltips. A migration de auditoria é aditiva e foi aplicada/reconciliada; nenhum dado operacional foi criado, alterado ou removido nesta auditoria.

## Validação técnica

- TypeScript: aprovado.
- Suíte Vitest: **119 testes em 26 arquivos aprovados**.
- Build de produção: aprovado.
- `git diff --check`: aprovado na validação consolidada anterior; repetir após o fechamento desta documentação.
- `pnpm audit --prod --audit-level=high`: sem vulnerabilidades altas/críticas; auditoria final sem vulnerabilidades conhecidas após remover ExcelJS.
- Concorrência TiDB: validada em banco descartável com duas conexões.
- Migrations em banco vazio: validadas em ambiente descartável.
- Backup/restore do ambiente operacional: procedimento documentado, mas a execução efetiva continua sendo ação manual condicionante do responsável.

## Gate de liberação

A recomendação permanece **PILOTO CONTROLADO**. Antes do Publish, confirmar o backup aplicável à conta e manter Manus OAuth como único mecanismo de autenticação. Após a publicação, acompanhar autenticação/autorização, acessos negados, duplicidades, criação de projetos, mudanças de status, uploads, evidências, audit log, comportamento mobile e regressões.

Não liberar como produção irrestrita enquanto o backup/restore controlado não for confirmado. Não ativar importação definitiva, jobs externos, scraping, CETESB/SP Águas automáticos ou autenticação própria nesta rodada.

## Riscos residuais aceitos no piloto

A ausência de RLS nativo e de criptografia de campo exige disciplina de autorização server-side e proteção da infraestrutura. O bot protection é básico. O upload S3 pode deixar objeto não referenciado em uma falha posterior ao upload. A dependência de HTTPS é do hosting em produção. Warnings de bundle grande e pacotes deprecated devem ser monitorados, mas não bloqueiam o piloto por si só.
