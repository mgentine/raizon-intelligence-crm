# Referência de layout — proposta 58/2026 para exportação DOCX

## Estrutura observada no PDF de referência

O documento usa identidade visual da Raizon Ambiental com logotipo no topo esquerdo, linha fina horizontal em verde/dourado no cabeçalho, bloco de identificação da proposta no topo direito e rodapé institucional contínuo em faixa verde escura.

Na primeira página, a hierarquia é:

1. rótulo de proposta comercial;
2. número da proposta;
3. título principal em caixa alta, com ênfase na natureza do serviço;
4. subtítulo curto explicando o escopo executivo;
5. quadro-resumo com cliente, unidade, contato, contratada e responsável técnico;
6. caixa destacada de resumo executivo;
7. início do corpo com seções numeradas.

Nas páginas seguintes, o documento mantém:

- numeração de seções em negrito;
- corpo em parágrafos curtos e listas alfabéticas;
- tabela técnica de atos/outorgas vigentes;
- seção de escopo técnico com itens a, b, c...;
- seção de prazo estimado;
- quadro simples de investimento com descrição e valor à direita;
- condição de pagamento destacada em seção própria;
- seções separadas para exclusões, documentos iniciais necessários e base técnica/normativa;
- bloco de assinatura ao final.

## Regras para a versão DOCX no CRM

O Word deve preservar a hierarquia visual e documental, mas continuar governado apenas por snapshots confirmados do CRM. Portanto:

- cliente, serviço, investimento, pagamento, validade, premissas, exclusões e entregáveis devem sair dos snapshots da proposta;
- dados ausentes no snapshot não podem ser inventados para “preencher” o layout;
- propostas em modo demonstração local não devem exportar DOCX;
- o PDF de referência serve como padrão visual e estrutural, não como fonte para completar automaticamente campos do CRM.

## Estrutura mínima desejada para o DOCX

1. Cabeçalho com marca Raizon e identificação da proposta.
2. Título principal e subtítulo do serviço.
3. Quadro-resumo inicial.
4. Resumo executivo.
5. Escopo técnico/comercial.
6. Entregáveis.
7. Premissas e limites do escopo.
8. Investimento.
9. Forma de pagamento.
10. Validade.
11. Não estão inclusos / exclusões.
12. Documentos iniciais necessários.
13. Campo final para responsável técnico/assinatura institucional.

## Observação de implementação

Como a exportação atual já existe em PDF sob demanda, a nova exportação DOCX deve ser complementar, usando os mesmos dados governados e mantendo coerência entre os dois artefatos.
