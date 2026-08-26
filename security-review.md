# Revisão de segurança do MVP

## Controles verificados

- As operações de domínio usam `protectedProcedure` e dependem de sessão autenticada.
- O callback periódico exige autenticação de tarefa e rejeita chamadas sem `isCron` e `taskUid`.
- A consulta de CNPJ valida a entrada e normaliza o CNPJ antes do provedor externo.
- A importação registra usuário, fonte, arquivo, contagens e status da execução.
- A importação é idempotente por CNPJ e os conflitos devem permanecer revisáveis.
- O logout limpa o cookie de sessão com `httpOnly`, `secure`, `sameSite` e `path` adequados ao template.
- O frontend trata estados vazios, carregamento e falhas sem exibir credenciais ou dados sensíveis.

## Limitações conhecidas

A autenticação atual é a autenticação corporativa do template Manus/OAuth. O requisito de login local com senha, recuperação de acesso por e-mail e administração completa de perfis ainda não foi implementado. Portanto, não se deve declarar esse requisito como concluído.

Os conectores CETESB e SP Águas ainda são preparados/controlled-source; a aplicação não presume API pública estável nem contorna autenticação, CAPTCHA ou restrições de acesso.

## Conclusão

O MVP possui proteção de sessão e isolamento básico das procedures, mas requer uma rodada específica de autenticação local, RBAC detalhado e testes de autorização antes de uso produtivo com equipe ampliada.
