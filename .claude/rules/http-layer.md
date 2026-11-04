---
paths:
  - "src/app/index.js"
  - "src/app/routes/**"
  - "src/app/controllers/**"
  - "src/app/middlewares/**"
  - "src/app/handlers/**"
  - "src/app/config/**"
  - "src/app/utils/**"
---

# HTTP layer: routes, controllers, middlewares

The reference implementation is `auth.routes.js`, `user.routes.js`, `auth.controller.js` and `user.controller.js`.

## Routes

- Use one file per domain, `src/app/routes/<name>.routes.js`, starting with `const Router = require('express').Router()`.
- `routes.handler.js` mounts every `.js` file in that folder at `/`, in reverse alphabetical order, with no prefix. Declare full paths (`/users/@me`, `/fleets/:id`) and keep them unique across files.
- Write one line per endpoint: `Router.<verb>(path, [AuthMiddleware], [roleMiddleware('manager')], [SchemaParserMiddleware(Controller.bodySchema, Controller.querySchema)], Controller.method)`.
- Routes for the signed-in user go under `/users/@me`.
- Put an `@swagger` block above each endpoint, or above a group of endpoints that share a path.
  - swagger-jsdoc only scans `src/app/routes/*.js`.
  - Document the body, every error `id` with its status, and `security: [{ bearerAuth: [] }]`.
  - Reuse the shared schemas in `config/swagger.js` (`User`, `UserResponse`, `AuthResponse`, `Error`), and add new shared schemas there.

## Controllers

- A controller is a class whose Zod schemas are instance properties built in the constructor, exported as a singleton.
- Build schemas from the shared fields in `src/app/utils/schemas.js` (`name`, `email`, `phone`, `password`, `cnhNumber`, `cnhCategory`, `role`), and add new reusable fields there.
- Zod 4 syntax:
  - Custom messages are `z.string({ error: '...' })` and `.min(n, '...')`; `required_error` and `invalid_type_error` are ignored by Zod 4.
  - Use `z.discriminatedUnion` for role-dependent bodies, and `.refine(fn, { error, path })` for cross-field checks.
  - Use `.trim()` and `.toLowerCase()` to normalize input; the middleware puts the parsed values into `req.body`.
- Handlers are `async (req, res)`. They read the input, call **one** service method, then either:
  - `if (result.error) return utils.sendError(res, result)`, or
  - `res.status(200 | 201).json({ error: false, message: '<pt-BR>', data })`.
- Routes pass handlers by reference, so handlers must not use `this`. Services are imported at module level.
- Validation and response messages are in pt-BR.

## Middlewares

| File | Behavior |
|---|---|
| `auth.middleware.js` | Requires `Authorization: Bearer <JWT>` and reloads the user on every request. Missing, invalid or expired token, or a deleted user: 401 `unauthorized`. Inactive user: 403 `account_inactive` (D24). On success it sets `req.user` (a Sequelize instance whose `toJSON` hides `passwordHash`). |
| `role.middleware.js` | `roleMiddleware('manager')` or `roleMiddleware('manager', 'driver')`. Goes after `AuthMiddleware` and returns 403 `forbidden` for other roles (RN02). |
| `schema.middleware.js` | `SchemaParserMiddleware(bodySchema, querySchema, paramsSchema, { stringQueryFields })`. Optional parameter validation writes parsed values to `req.params`. Scalar numeric-looking query values are converted to numbers except fields explicitly listed in `stringQueryFields`; Fleet preserves `search` and `status` as text. Arrays/objects stay intact for Zod to reject. Writes parsed body/query values back, answers 400 `invalid_schema` with `data.errors`, and forwards non-Zod errors to `next(err)`. Existing two-argument calls remain supported. |
| `logger.middleware.js` | Logs IP, method, URL, body and query, with password fields replaced by `***`. Off in tests. |
| `private.auth.middleware.js` | Lets only 127.0.0.1 and ::1 through, for internal routes. It isn't user authentication: behind a reverse proxy on the same host, every request passes. |

## Authentication

- **JWT:** payload `{ sub: '<user id>', role }`, signed with `JWT_SECRET`, expires in 7 days (`AuthService`). There's no revocation list: a token stays valid until it expires, but a deleted or deactivated user is rejected because the middleware reloads the user.
- **Passwords:** bcrypt with cost 10. The policy is 8–72 characters with upper case, lower case and a digit (`utils/schemas.js`).
- **Login:** an unknown email and a wrong password both return 401 `invalid_credentials`. A bcrypt comparison runs either way, so the response time doesn't reveal which accounts exist.
- **Logout:** happens on the client, which discards the token. There's no endpoint.

## Swagger

Served at `/api-docs` (OpenAPI 3.0) with a `bearerAuth` JWT scheme. Servers are production `https://rotarix.xlucazzz.dev` and `http://localhost:3000`. The production URL is only configuration; no deployment has been verified.

## Real-time

There's no real-time channel. Socket.IO was removed on 2026-10-20 at the user's request. Don't add WebSockets, Socket.IO or similar without asking.
