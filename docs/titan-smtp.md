# Integração SMTP Titan/HostGator

## Parâmetros adotados

A integração do Raizon Intelligence CRM utiliza a conta Titan hospedada no HostGator como remetente. O adapter usa `smtp.titan.email`, porta `465` e SSL/TLS. O usuário SMTP é o endereço completo da caixa Titan; os destinatários são configurados como uma lista separada por vírgulas. A senha permanece exclusivamente no mecanismo de Secrets do projeto.

| Variável | Finalidade | Obrigatória |
|---|---|---:|
| `TITAN_SMTP_USER` | Endereço completo da caixa Titan remetente | Sim |
| `TITAN_SMTP_PASSWORD` | Senha Titan ou senha de aplicativo | Sim |
| `TITAN_NOTIFICATION_RECIPIENTS` | Destinatários separados por vírgulas | Sim |

O HostGator orienta habilitar o uso externo da conta e informa `smtp.titan.email` como servidor de saída, com porta 465 e SSL/TLS recomendado [1]. A documentação do Titan também apresenta a alternativa porta 587 com STARTTLS, mas o CRM foi padronizado na opção SSL/TLS da porta 465 [2]. Se a conta tiver autenticação de dois fatores, deve ser usada uma senha de aplicativo, conforme a orientação do Titan [2].

## Comportamento do CRM

O callback periódico continua criando notificações internas de forma idempotente. O digest por e-mail só é tentado quando a execução cria pelo menos uma nova notificação; reexecuções sem novos alertas não enviam mensagens repetidas. Uma falha SMTP é devolvida no campo `email` da resposta do callback e não invalida o recálculo de prioridades nem a persistência do histórico da rotina.

A senha não é incluída em logs, respostas HTTP ou objetos de configuração redigidos. Os testes automatizados verificam a presença dos segredos injetados, a redação da senha e a política de não envio quando não há novos alertas; eles não realizam conexão ou envio real.

## Procedimento de teste operacional

Primeiro, confirme no painel do Titan/HostGator que o acesso por aplicativos externos está habilitado. Caso o 2FA esteja ativo, gere uma senha de aplicativo. Em seguida, preencha `TITAN_SMTP_USER`, `TITAN_SMTP_PASSWORD` e `TITAN_NOTIFICATION_RECIPIENTS` em **Secrets**, usando uma caixa de teste e pelo menos um destinatário controlado.

Depois, execute uma rotina que produza uma nova notificação operacional e confira o campo `email.sent` no retorno do callback e a chegada da mensagem na caixa destinatária. Não repita o teste indefinidamente: a deduplicação significa que execuções sem novos alertas devem retornar `email.skipped: true`. Se houver falha, verifique primeiro habilitação de acesso externo, senha de aplicativo, porta 465/SSL e bloqueios de IP antes de trocar a porta para 587/STARTTLS.

Após o teste, substitua a caixa de teste pelos destinatários operacionais e mantenha a senha somente no armazenamento seguro. Nunca registre a senha em commit, `.env`, ticket, screenshot ou mensagem de chat.

## Referências

[1]: https://suporte.hostgator.com.br/hc/pt-br/articles/30813560087571-Como-enviar-e-receber-e-mails-Titan-por-aplicativos-externos "HostGator — Como enviar e receber e-mails Titan por aplicativos externos"

[2]: https://support.titan.email/hc/en-us/articles/4405162224665-Configuring-Titan-on-Email-Scripts "Titan — Configuring Titan on Email Scripts"
