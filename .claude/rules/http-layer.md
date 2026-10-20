---
paths:
  - "src/app/index.js"
  - "src/app/routes/**"
  - "src/app/controllers/**"
  - "src/app/middlewares/**"
  - "src/app/handlers/**"
  - "src/app/config/**"
  - "src/app/socket/**"
---

# HTTP layer: routes, controllers, middlewares

## Routes

- Use one file per domain, `src/app/routes/<name>.routes.js`, exporting an `express.Router()`.
- `routes.handler.js` mounts every `.js` file in that folder at `/`, in reverse alphabetical order, with no prefix. Declare full paths in the router (`/fleets/:id`) and keep them unique across files.
- Chain: `router.<verb>(path, [auth], SchemaParserMiddleware(controller.bodySchema, controller.querySchema), controller.method)`.
- Put an `@swagger` JSDoc block above every endpoint. swagger-jsdoc only scans `src/app/routes/*.js`. Document path, query and body parameters, the success response, every error `id`, and `security: [{ bearerAuth: [] }]` on authenticated routes.

## Controllers

- A controller is a class whose Zod schemas are instance properties (`this.createSchema = z.object({...})`), exported as a singleton.
- Methods are `async (req, res)`: read the input, call **one** service method and turn the result into a status and envelope.
- Routes pass methods by reference, which loses `this`. Keep `this` out of handler methods (import the service at module level), or wrap the call in the route.
- Service errors don't map to HTTP status codes yet, because services return only `{ error, message, id }`. Settle this on the first domain (one option is a `status` field in the error object), record it in `decisions.md` and update this rule.
- Validation messages are in pt-BR. Without a custom message, Zod's default English message reaches the user.

## Middlewares

| File | Behavior | Caveats |
|---|---|---|
| `schema.middleware.js` | Factory `(bodySchema, querySchema)`. Converts numeric-looking query values to numbers, validates with Zod and answers 400 `invalid_schema` with `data.errors` on failure. | The body parse result is discarded, so Zod transforms, defaults and stripping never reach `req.body`. Express 5 exposes `req.query` as a getter, so `req.query = ...` is a silent no-op in this non-strict module. Confirm and fix this before relying on coercion. |
| `logger.middleware.js` | Logs IP, method, URL and the full body and query. Off in tests. | It will log passwords and personal data once auth exists. Redact before adding login. |
| `private.auth.middleware.js` | Lets only 127.0.0.1 and ::1 through. | Meant for internal routes; it isn't user authentication. Behind a reverse proxy on the same host, every request comes from localhost and passes. Returns `error_id` instead of `id`. |
| `auth.middleware.js` | *Not created yet.* Planned: verify `Authorization: Bearer <JWT>` and populate `req.account`. | Needed for RNF02, together with role (RN02) and assignment (RN03) checks. |

The schema middleware is imported as `SchemaParserMiddleware`:

```js
const SchemaParserMiddleware = require('../middlewares/schema.middleware')
```

## Swagger

Served at `/api-docs` (OpenAPI 3.0) with a `bearerAuth` JWT scheme. Servers are production `https://rotarix.xlucazzz.dev` and `http://localhost:3000`. The production URL is only configuration; no deployment has been verified.

## Socket.IO

- Starts only outside tests and shares the HTTP server. CORS allows any origin.
- A client emits `join` with an account id and joins room `account:<id>`. Nothing checks the id, so authenticate the socket before sending account data to rooms.
- `app/index.js` creates the `io` instance but doesn't export it, so services can't emit events yet.
