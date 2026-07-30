# Audit Service

The Audit service owns append-only audit logs. It is a Node.js and TypeScript service with a separate MySQL database; it does not access Laravel's Book database.

## Structure

```text
src/
  domain/                    Event rules and types; no infrastructure imports
  application/               Use cases and ports owned by the application
  infrastructure/mysql/      MySQL client, migrations, storage initialization, and adapters
  http/                      HTTP delivery adapters
  bootstrap.ts               Wires infrastructure initialization before delivery starts
  index.ts                   Process entry point and operational error boundary
```

The domain and application layers never import MySQL, Redis, HTTP, Socket.IO, or environment APIs. Infrastructure adapters implement application ports. `bootstrap.ts` is the composition root: it initializes MySQL storage before the HTTP server starts.

## Current behavior

- Startup applies pending MySQL migrations before binding the health server.
- `GET /health` returns `200` only after that initialization succeeds.
- Startup also creates or joins Redis Stream `book-events` consumer group `audit-service` with an instance-specific consumer name.
- `PersistAuditEvent` validates decoded v1 Book events and sends them to the `AuditLogStore` port.
- `MysqlAuditLogStore` is the current adapter. It records one row per `event_id` and returns `already_exists` for duplicate delivery.

## Future adapters

- Audit Consumption will add a Redis Streams input adapter that calls `PersistAuditEvent` and acknowledges messages only after `created` or `already_exists`.
- Audit History API will add an HTTP adapter and Laravel token-validation adapter.
- Audit Notifications will add Socket.IO as an output adapter after persistence.

## Commands

```sh
npm run migrate    # apply Audit database migrations
npm run lint
npm run typecheck
npm test
```

From the repository root, use `make audit-check` for the complete isolated Audit-service quality gate.
