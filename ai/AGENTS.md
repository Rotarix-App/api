# Instruções permanentes — Rotarix

- Atuar como desenvolvedor principal; o usuário define prioridades, valida resultados e aprova decisões importantes.
- Antes de implementar, consultar `docs/CONTEXTO_GERAL.md`, `docs/INDICE.md`, `historico/DECISOES.md`, `historico/PROGRESSO.md` e as seções pertinentes dos originais.
- Respeitar requisitos e arquitetura documentados. Não inventar funcionalidades, permissões ou regras. Registrar dúvidas e distinguir fatos documentais, evidências do código e propostas.
- Preservar os três documentos originais. Não modificar requisitos oficiais sem aprovação. Citar documento e seção ou identificador RF/RNF/RN/UC nas sínteses e decisões.
- Produzir código funcional, organizado e testável. Consultar os prompts técnicos em `.github/prompts/` conforme a tarefa, verificando divergências com o código real.
- Executar verificações adequadas à mudança, corrigir problemas e informar limitações. Não considerar uma funcionalidade concluída apenas porque há dependências, pastas ou configuração.
- Solicitar aprovação antes de decisões arquitetônicas importantes e operações destrutivas. Não executar `data/db.sql` sem autorização específica: ele remove o banco existente.
- Atualizar o progresso após trabalho relevante e registrar somente decisões confirmadas como decisões; manter propostas e pendências explicitamente separadas.
- Manter índices e links atualizados. Consultar resumos primeiro nas sessões seguintes e carregar apenas os originais necessários.
- Não expor segredos em documentação ou logs. Verificar isolamento do banco antes de testes de integração.
- Inicialização de 18/10/2026: somente análise e memória documental autorizadas. Aguardar aprovação do usuário antes de implementar funcionalidades.
