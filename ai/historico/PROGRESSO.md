# Progresso — Rotarix

Diagnóstico em 18/10/2026, por leitura dos arquivos do checkout local. Não atesta estado de outros repositórios ou serviços publicados.

## Concluído nesta etapa documental

Leitura dos três documentos oficiais; consolidação do contexto, análise de RF/RNF/RN/UC, entidades conceituais, riscos, aceite e pendências; instruções persistentes e índice. Arquivo vazio `COONTEXTO_GERAL.md` renomeado para `CONTEXTO_GERAL.md`. Originais e código-fonte preservados. Implementação aguarda aprovação.

## Base técnica presente (sem validação em execução)

| Evidência | Estado observado |
|---|---|
| `src/index.js`, `src/app/index.js` | Bootstrap dotenv, Express, CORS, JSON, HTTP e integração Socket.IO; exportação da aplicação |
| `src/app/handlers/routes.handler.js` | Carregamento automático de rotas; diretório só contém `.gitkeep` |
| `src/app/config/swagger.js` | Interface `/api-docs`, OpenAPI 3 e esquema bearer; não há endpoints de negócio anotados |
| `src/app/database/index.js` | Configuração de conexão Sequelize/MySQL; autenticação só ocorre ao importar módulo; não se comprovou conexão ativa |
| `src/app/middlewares/` | Validação Zod, logger e restrição de IP local; não há autenticação de usuário/JWT |
| `src/app/socket/socketio.js` | Conexões e adesão a salas por `accountId`; nenhum fluxo de negócio comprovado |
| `docker-compose.yml`, `.github/workflows/test.yml` | MySQL 8 e pipeline de instalação/SQL/Jest definidos; execução bem-sucedida não verificada |
| `jest.config.js`, `src/tests/setup/global.js`, `src/tests/sequencer.js` | Infraestrutura de testes configurada, sem arquivos `*.test.js` |

## Ausente ou parcial

RF01–RF13: nenhuma implementação funcional encontrada. Controllers, services, repositories e routes contêm apenas `.gitkeep`; models tem somente exemplo comentado de associações. `data/db.sql` cria banco sem tabelas de domínio. Não há autenticação/autorização de usuários, gestão operacional, upload, fotos de odômetro, métricas, alertas ou anonimização. Não há app React Native/Expo neste checkout. Não há evidência de infraestrutura redundante, testes de desempenho ou aceite do cliente.

## Problemas observados para próxima etapa

- `data/db.sql` começa com `DROP DATABASE IF EXISTS rotarix`: script destrutivo, não executado nesta análise. CI também o executa.
- Logger registra `req.body` e `req.query` completos: futuros logins/uploads exigem ocultação de credenciais e dados pessoais.
- Socket permite `join(accountId)` informado pelo cliente sem validação de identidade; avaliar antes de transportar dados de contas.
- `private.auth.middleware.js` verifica apenas IP local; não satisfaz RNF02 e não substitui autenticação nem autorização por perfil.
- CI configura banco `rotarix`, enquanto prompt de testes descreve `rotarix_test`. `src/tests/setup/global.js` apenas importa o app, ao contrário da descrição de criação de tabelas no prompt. Confirmar configuração efetiva e isolamento antes de testes com banco.
- Middleware Zod descarta retorno do parse do body; coerções/defaults não são aplicados ao `req.body`. Parse de query tenta atribuir `req.query` no Express 5; compatibilidade precisa de verificação em execução.
- Falha de banco chama `process.exit()` sem código explícito de erro; comportamento operacional deve ser revisto na etapa autorizada.
- Contratos de resposta usam `id` no schema e `error_id` no middleware privado; padronização descrita no prompt ainda não é uniforme.
- Não há evidência de TLS ou recuperação implementados; URL de produção no Swagger é configuração, não comprovação de publicação.

## Validação e limites

Inspeção estática de todos os arquivos de código, configuração de testes, workflow, SQL e prompts locais. Sem dependências instaladas (`node_modules` ausente) e sem suítes de teste existentes; não foi executado `npm test`, instalado pacote, iniciado servidor ou aplicado SQL. Conferência dos links locais da memória e ausência de alterações nos arquivos rastreados de código/configuração por `git diff`. Nenhuma funcionalidade classificada como concluída.

## Plano recomendado, sujeito à priorização do usuário

1. Resolver P01/P02 (exclusões e histórico), P06/P07 (contas e responsabilidade) e P12 (estados/concorrência); confirmar protótipo e aprovação para implementar.
2. Especificar modelo de dados, contratos HTTP e autorização, respeitando os padrões locais e as decisões aprovadas; definir migrações e banco de testes isolado sem executar script destrutivo sobre dados existentes.
3. Implementar RF01–RF03 com autenticação, hash, autorização e testes de sucesso/erro; corrigir exposição de dados nos logs e acesso às salas antes de uso.
4. Implementar frotas, veículos, motoristas e atribuições (RF04–RF07/RF09), com testes de permissão e efeitos de desativação/exclusão.
5. Implementar infraestrutura de imagens e viagens/odômetro (RF10/RF13, RN06–RN08), com consistência concorrente e fotos obrigatórias.
6. Implementar despesas/comprovantes/abastecimentos (RF11/RF12/UC07), manutenções e alertas (UC08/RF05); métricas RF08 após dados operacionais disponíveis.
7. Integrar app Android/iOS conforme organização dos repositórios, validar os fluxos com gestor/motoristas e verificar desempenho, recuperação e critérios de aceite antes da entrega.

O plano é uma recomendação, não um cronograma aprovado. Localização, chat e modo off-line não entram por inferência.
