---
description: "Use when creating new features, modules, routes, controllers, services, or repositories. Covers the layered architecture, naming conventions, and project patterns for the Rotarix backend."
agent: "agent"
---

# Arquitetura do Projeto — Rotarix Backend

## Stack

- **Runtime**: Node.js (CommonJS)
- **Framework**: Express 5
- **ORM**: Sequelize 6 (MySQL)
- **Validação**: Zod
- **Autenticação**: JWT (jsonwebtoken) + bcryptjs
- **Documentação**: Swagger (swagger-jsdoc + swagger-ui-express)
- **Testes**: Jest + Supertest

## Camadas (de fora para dentro)

```
Routes → Middlewares → Controllers → Services → Repositories → Models (Sequelize)
```

### Routes (`src/app/routes/*.routes.js`)
- Definem endpoints HTTP usando `express.Router()`
- Aplicam middlewares de validação (`SchemaParserMiddleware`) e autenticação
- Devem conter anotações `@swagger` JSDoc acima de cada endpoint
- Nomeação: `<domínio>.routes.js`

### Controllers (`src/app/controllers/*.controller.js`)
- Classes instanciadas com `new` e exportadas como singleton
- Definem schemas Zod como propriedades da instância (ex: `this.loginSchema`)
- Métodos async que recebem `(req, res)` e retornam JSON padronizado
- Não contêm lógica de negócio — delegam para Services

### Services (`src/app/services/*.service.js`)
- Classes instanciadas como singleton
- Contêm lógica de negócio
- Retornam objetos com `{ error: true, message, id }` em caso de falha
- Chamam Repositories para acesso a dados

### Repositories (`src/app/repositories/*.repository.js`)
- Classes instanciadas como singleton
- Encapsulam queries Sequelize
- Retornam modelo Sequelize ou `{ error: true, message, id }`

### Models (`src/app/database/models/*.js`)
- Definições Sequelize padrão

## Middlewares

| Middleware | Propósito |
|---|---|
| `auth.middleware.js` | *(a criar junto com o domínio de contas)* Valida JWT no header `Authorization: Bearer <token>`, popula `req.account` |
| `private.auth.middleware.js` | Autenticação para rotas internas/privadas |
| `schema.middleware.js` | Valida `req.body` e `req.query` usando schemas Zod |
| `logger.middleware.js` | Log de requisições (desabilitado em testes) |

## Padrão de resposta JSON

```json
{
  "error": false,
  "message": "Descrição do resultado",
  "data": {}
}
```

Em caso de erro:
```json
{
  "error": true,
  "message": "Descrição do erro",
  "id": "error_identifier"
}
```

## Convenções

- Arquivos nomeados em `kebab-case` com sufixo da camada (ex: `account.service.js`)
- Classes em `PascalCase`, exportadas como instância (`module.exports = new ClassName()`)
- Variáveis de ambiente via `dotenv`, acessadas com `process.env.*`
- Rotas registradas automaticamente pelo handler em `src/app/handlers/routes.handler.js` (lê todos os arquivos de `src/app/routes/`)

## Ao criar um novo domínio/recurso

1. Crie o model em `src/app/database/models/`
2. Crie o repository em `src/app/repositories/`
3. Crie o service em `src/app/services/`
4. Crie o controller em `src/app/controllers/`
5. Crie o arquivo de rotas em `src/app/routes/` com anotações Swagger
6. Crie testes em `src/tests/entrypoints/`
