# Revisão final de segurança e permissões — 26/08/2026

O sistema aplica controle de acesso baseado em perfis (RBAC) em todas as camadas sensíveis do backend (tRPC) e reflete essas restrições na interface do usuário.

## Matriz de autorização funcional

| Entidade | Ação | Admin | Técnico | Comercial | Usuário |
|---|---|:---:|:---:|:---:|:---:|
| **Empresas/Leads** | Listar/Ver | Sim | Sim | Sim | Sim |
| **Unidades** | Criar/Editar/Arquivar | Sim | Sim | Não | Não |
| **Contatos** | Criar/Editar/Arquivar | Sim | Sim | Sim | Não |
| **Atos Regulatórios** | Criar/Editar/Arquivar | Sim | Sim | Não | Não |
| **Evidências (S3)** | Listar/Upload/Arquivar | Sim | Sim | Não | Não |
| **Oportunidades** | Criar/Mudar Etapa | Sim | Não | Sim | Não |
| **Importações** | Histórico/Conflitos | Sim | Sim | Não | Não |
| **Configurações** | Gerenciar | Sim | Não | Não | Não |

## Proteções implementadas

1. **Garantia de Perfil (tRPC):** Todas as mutations e queries sensíveis utilizam o helper `requireProfile(ctx, [...])` antes de qualquer operação de banco ou armazenamento.
2. **Filtro Operacional:** Registros com `archivedAt` preenchido são excluídos das listagens operacionais por filtros específicos de contrato (`filterRegulatoryActRows`, `filterEvidenceRows`), impedindo acesso a dados desativados.
3. **Idempotência de Alertas:** A rotina periódica utiliza a regra `shouldCreateOpenNotification` para evitar a duplicação de notificações para a mesma entidade enquanto houver uma ocorrência não lida.
4. **Governança de Arquivos:** O upload de evidências é restrito a 5 MB e os metadados são vinculados ao usuário que realizou o upload, com trilha de auditoria persistida.
5. **Bloqueio Cron-only:** O callback de atualização regulatória exige uma identidade de cron válida (`user.isCron === true`), bloqueando disparos manuais não autorizados.

## Limitações conhecidas

- **Autenticação Local:** O sistema utiliza Manus OAuth como provedor de identidade. A implementação de login/senha local com recuperação de acesso permanece como item de backlog para ambientes fora da infraestrutura Manus.
- **Visibilidade de Dados:** Atualmente, todos os usuários autenticados com perfil autorizado podem ver todos os leads e empresas. Não há isolamento por "carteira de clientes" nesta versão.
