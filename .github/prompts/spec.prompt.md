---
description: "Use when designing new features, endpoints, or modules. Generates a technical specification following the project's architecture and patterns."
agent: "agent"
argument-hint: "Descreva a feature ou endpoint que deseja especificar"
---

# Especificação Técnica — Rotarix Backend

Ao receber a descrição de uma feature, gere uma especificação técnica completa seguindo este template:

## Template de Especificação

### 1. Visão Geral
- Objetivo da feature
- Contexto e motivação

### 2. Endpoints

Para cada endpoint, defina:

```
[MÉTODO] /rota
- Autenticação: AuthMiddleware | privateAuthMiddleware | Nenhuma
- Descrição: O que o endpoint faz
```

**Request:**
```json
{
  "campo": "tipo — descrição e validações"
}
```

**Response (sucesso):**
```json
{
  "error": false,
  "message": "Mensagem de sucesso",
  "data": {}
}
```

**Response (erro):**
```json
{
  "error": true,
  "message": "Mensagem descritiva",
  "id": "error_identifier"
}
```

### 3. Validações (Zod Schema)
- Liste todos os campos com tipos, regras (min, max, regex) e mensagens de erro em português

### 4. Modelo de Dados
- Campos da tabela/model Sequelize
- Tipos, constraints, valores default
- Relacionamentos (se houver)

### 5. Regras de Negócio
- Condições que o service deve verificar
- Fluxo de sucesso e fluxos de erro com seus `id`

### 6. Arquivos a Criar/Modificar

| Arquivo | Ação | Descrição |
|---|---|---|
| `src/app/database/models/exemplo.js` | Criar | Model Sequelize |
| `src/app/repositories/exemplo.repository.js` | Criar | Queries de acesso |
| `src/app/services/exemplo.service.js` | Criar | Lógica de negócio |
| `src/app/controllers/exemplo.controller.js` | Criar | Handler HTTP + schemas |
| `src/app/routes/exemplo.routes.js` | Criar | Rotas + Swagger |
| `src/tests/entrypoints/exemplo/` | Criar | Testes de integração |

### 7. Casos de Teste
- Liste cenários de teste (sucesso + erros esperados)

## Regras para a Especificação

- Mensagens de validação e erro sempre em **português brasileiro**
- IDs de erro em **snake_case** em inglês (ex: `email_already_exists`)
- Seguir exatamente as camadas: Routes → Controller → Service → Repository → Model
- Considerar autenticação necessária para cada endpoint
- Documentar anotações Swagger necessárias
