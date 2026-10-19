# Decisões, propostas e pendências

Registro inicial: 18/10/2026. Confirmação documental não significa implementação ou aprovação de detalhes ausentes. Não há precedência formal estabelecida entre os três originais.

## Decisões explicitamente documentadas

| ID | Decisão | Fonte |
|---|---|---|
| D01 | Aplicativo mobile para gestores e motoristas; painel web e off-line fora desta versão | TAP 1.10; ER Escopo |
| D02 | React Native Android/iOS; persistência estruturada MySQL | ER RNF05–RNF06; PI Metodologia |
| D03 | JavaScript, Expo, Figma, VS Code, Git/GitHub e Swagger compõem o ferramental descrito; MySQL em servidor próprio | PI Referencial Teórico e Metodologia |
| D04 | Perfil único e imutável; acesso operacional restrito ao perfil e atribuição | ER RF01, RN01–RN03 |
| D05 | Placa única, frota única por veículo, uma viagem ativa por motorista/veículo, odômetro não decrescente e fotos obrigatórias de leituras | ER RN04–RN08; ressalva P01 sobre frota obrigatória |
| D06 | Histórico de viagens/despesas preservado sem identificação ao excluir motorista | ER RF03/RF06 |
| D07 | Comunicação segura, senha protegida, imagens vinculadas e redundância/recuperação | ER RNF02/RNF04/RNF05; TAP 1.13 |
| D08 | Prazo previsto 17/08/2026–25/11/2026; protótipo validado antes de codificar e desenvolvimento incremental semanal | TAP 1.4; PI Metodologia |

## Instruções confirmadas pelo usuário nesta inicialização

- Construir memória persistente a partir dos três originais, preservando rastreabilidade e arquivos oficiais.
- Inspecionar código sem modificá-lo; implementação de funcionalidades somente após aprovação posterior.
- Solicitar aprovação para decisões arquitetônicas importantes ou operações destrutivas.

## Evidências técnicas, sem nova decisão arquitetônica

Node.js/CommonJS, Express, Sequelize, Zod, Socket.IO, JWT/bcryptjs e Jest/Supertest constam do repositório. O padrão de camadas está descrito em `.github/prompts/architecture.prompt.md`. Ver [progresso](PROGRESSO.md). Dependências e padrões locais não comprovam funcionalidades implementadas nem resolvem lacunas oficiais.

## Propostas ainda não aprovadas

Plano de desenvolvimento no [progresso](PROGRESSO.md); associações analíticas RF–UC e critérios futuros na [análise documental](../docs/requesitos/ANALISE_DOCUMENTAL.md). Nenhuma escolha de hospedagem, storage, novas entidades físicas ou rastreamento foi aprovada nesta sessão.

## Pontos pendentes

[P01–P16](../docs/requesitos/ANALISE_DOCUMENTAL.md#contradições-e-perguntas-para-decisão-do-usuário) concentram conflitos e definições faltantes. Registrar aqui a resposta do usuário e sua data antes de promover uma proposta a decisão.
