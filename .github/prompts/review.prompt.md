---
description: "Use when reviewing code, pull requests, or validating implementation quality. Covers coding standards, security checks, and best practices for the Rotarix backend."
agent: "agent"
---

# Code Review — Rotarix Backend

## Checklist de Review

### Arquitetura e Organização
- [ ] Respeita a separação de camadas: Routes → Controllers → Services → Repositories
- [ ] Controller NÃO contém lógica de negócio (apenas orquestra)
- [ ] Repository NÃO contém lógica de negócio (apenas queries)
- [ ] Novo domínio segue a estrutura de arquivos padrão (model, repository, service, controller, routes)
- [ ] Arquivo de rotas registra-se automaticamente (está em `src/app/routes/`)

### Validação e Segurança
- [ ] Inputs validados com Zod schema no middleware `SchemaParserMiddleware`
- [ ] Rotas protegidas utilizam `AuthMiddleware` ou `privateAuthMiddleware`
- [ ] Senhas são hashadas com bcrypt (nunca armazenadas em texto plano)
- [ ] Tokens JWT possuem expiração configurada
- [ ] Dados sensíveis (password, tokens) removidos antes de retornar ao client
- [ ] SQL injection prevenida (uso exclusivo de Sequelize, sem raw queries sem bind)
- [ ] Sem credenciais hardcoded (todas em variáveis de ambiente)

### Padrões de Código
- [ ] Respostas seguem formato padrão `{ error, message, data }` ou `{ error, message, id }`
- [ ] Status HTTP corretos (200, 201, 400, 401, 404, 500)
- [ ] Classes exportadas como singleton (`module.exports = new Class()`)
- [ ] Schemas Zod definidos como propriedade do controller
- [ ] Métodos async com tratamento de erro adequado
- [ ] Sem `console.log` desnecessário em produção (exceto no logger)

### Documentação
- [ ] Rotas possuem anotações `@swagger` com request/response documentados
- [ ] Parâmetros de path, query e body documentados no Swagger
- [ ] Schemas de autenticação referenciados (`bearerAuth`) quando necessário

### Testes
- [ ] Novos endpoints possuem testes correspondentes em `src/tests/entrypoints/`
- [ ] Testes cobrem cenários de sucesso e erro
- [ ] Testes não dependem de estado externo (usam o banco de testes dedicado)

## Severidades

| Nível | Critério | Ação |
|---|---|---|
| **Bloqueante** | Vulnerabilidade de segurança, perda de dados, crash em produção | Deve ser corrigido antes do merge |
| **Alto** | Violação de arquitetura, lógica de negócio no controller/repository | Deve ser corrigido |
| **Médio** | Falta de validação, resposta HTTP incorreta, sem testes | Recomendado corrigir |
| **Baixo** | Estilo, nomeação, documentação faltante | Sugestão de melhoria |
