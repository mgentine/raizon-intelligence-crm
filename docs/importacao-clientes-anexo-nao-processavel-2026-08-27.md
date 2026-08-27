# Inspeção de anexo para prévia de importação de clientes

**Data:** 27 de agosto de 2026  
**Resultado:** arquivo não processável como base de clientes.

O arquivo recebido sob o nome `pasted_content.txt` contém instruções técnicas da rodada estrutural do CRM. Ele não contém cabeçalho tabular, CSV, XLSX, lista de empresas, CNPJ, razão social ou registros de clientes que possam ser mapeados e registrados em staging.

| Verificação | Resultado | Classificação |
|---|---|---|
| Formato de tabela utilizável | Ausente. | **COMPROVADO**. |
| Linhas de clientes para normalização | Ausentes. | **COMPROVADO**. |
| Prévia em `import_runs` / `import_staging` | Não executada. | **BLOQUEADA** por ausência de dado-fonte. |
| Escrita em `companies` | Não realizada. | **COMPROVADO**. |

> Para continuar, é necessário receber o CSV ou XLSX real. O primeiro processamento permanecerá limitado à prévia em staging, sem criação ou atualização de empresas canônicas.
