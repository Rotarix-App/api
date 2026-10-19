# Índice da documentação — Rotarix

## Retomar o projeto

1. Ler [instruções do agente](../AGENTS.md) e [contexto geral](CONTEXTO_GERAL.md).
2. Conferir [decisões e pendências](../historico/DECISOES.md) e [progresso/diagnóstico/plano](../historico/PROGRESSO.md).
3. Consultar [análise documental](requesitos/ANALISE_DOCUMENTAL.md) e os originais pertinentes à tarefa. Não é necessário carregar novamente todos os originais em toda sessão.

## Documentação oficial preservada

| Documento | Conteúdo | Consultar quando |
|---|---|---|
| [TAP — Termo de abertura](documentação-original/TAP_Termo_Abertura_Rotarix.md) | Equipe/empresa, prazo, problema, objetivo, escopo, premissas, riscos e aceite (1.1–1.14) | Planejar escopo, prazo, entrega e validação |
| [Especificação de requisitos](documentação-original/Especificacao_Requisitos_Rotarix.md) | RF01–RF13, UC01–UC08, RNF01–RNF06, RN01–RN08, matriz, papéis, glossário e revisões | Implementar/validar funcionalidades, permissões, dados e qualidade |
| [Projeto de intervenção](documentação-original/Projeto_Intervencao_Rotarix.md) | Justificativa, objetivos, tecnologias, metodologia, cronograma e referências | Revisar arquitetura documental, metodologia, prototipagem e avaliação |

## Memória e análise

| Arquivo | Assunto |
|---|---|
| [AGENTS da raiz](../../AGENTS.md) | Entrada persistente para novas sessões |
| [Instruções permanentes](../AGENTS.md) | Responsabilidades, limites e atualização de memória |
| [Contexto geral](CONTEXTO_GERAL.md) | Resumo do produto, perfis, arquitetura, entidades, regras, riscos e aceite |
| [Análise documental](requesitos/ANALISE_DOCUMENTAL.md) | Inventário funcional, rastreabilidade analítica, RN/RNF, pendências P01–P16 e proposta de validação |
| [Decisões](../historico/DECISOES.md) | Confirmações documentais, instruções do usuário, propostas e decisões ainda pendentes |
| [Progresso](../historico/PROGRESSO.md) | Evidências de implementação, limitações, problemas e plano priorizado recomendado |

Os diretórios `arquitetura/`, `banco-de-dados/` e `casos-de-uso/` permanecem vazios: não há especificações aprovadas próprias para preenchê-los. Entidades e arquitetura identificáveis estão no contexto; casos de uso completos permanecem na ER. A grafia existente `requesitos/` foi mantida. O arquivo vazio `COONTEXTO_GERAL.md` foi renomeado para `CONTEXTO_GERAL.md`.

## Referências técnicas locais

Estes arquivos orientam desenvolvimento e descrevem convenções; não substituem os três documentos oficiais nem comprovam implementação.

- [Arquitetura](../../.github/prompts/architecture.prompt.md): camadas, convenções, middleware e formato de resposta; consultar antes de novos módulos.
- [Especificação técnica](../../.github/prompts/spec.prompt.md): template de endpoints, validações, dados e testes; consultar ao detalhar funcionalidades.
- [Revisão](../../.github/prompts/review.prompt.md): critérios de arquitetura, segurança, documentação e testes; consultar em revisões.
- [Testes](../../.github/prompts/testing.prompt.md): padrões Jest/Supertest; conferir divergências de setup registradas no progresso.
- [package.json](../../package.json), [Docker Compose](../../docker-compose.yml), [Jest](../../jest.config.js) e [workflow](../../.github/workflows/test.yml): configuração real do checkout.
- [SQL inicial](../../data/db.sql): banco ainda sem tabelas de domínio; contém remoção do banco, não executar sem autorização.

## Consulta por tarefa

| Tarefa | Seções oficiais e complementos |
|---|---|
| Contas e perfil | ER RF01–RF03, UC01, RN01, RNF02; P05/P06/P14 |
| Frotas, veículos e motoristas | ER RF04–RF07, RF09, UC02–UC04, RN02–RN05; P01/P02/P07/P12 |
| Viagens e quilometragem | ER RF10/RF13, UC06, RN06–RN08; P12 |
| Despesas, anexos, abastecimentos e manutenção | ER RF05/RF11/RF12, UC07–UC08, RN08/RNF05; P09/P10/P13 |
| Métricas | ER RF08, UC05, Papéis; P08 |
| Infraestrutura e arquitetura | ER RNF01–RNF06; PI Referencial Teórico/Metodologia; TAP 1.12–1.13; progresso técnico |
| Aceite e prioridade | TAP 1.10/1.14, ER requisitos, PI Metodologia/Cronograma; pendências e plano no progresso |

Atualizar este índice quando documentos forem criados, movidos ou removidos.
