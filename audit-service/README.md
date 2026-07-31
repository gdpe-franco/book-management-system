# Audit Service

The Audit service owns append-only audit logs. It is a Node.js and TypeScript service with a separate MySQL database; it does not access Laravel's Book database.

## Structure

```text
src/
  domain/                    Event rules and types; no infrastructure imports
  application/               Use cases and ports owned by the application
  infrastructure/mysql/      MySQL client, migrations, storage initialization, and adapters
  infrastructure/redis/      Redis Streams input adapter
  infrastructure/socketio/   Socket.IO authentication and notification adapters
  http/                      HTTP delivery adapters
  bootstrap.ts               Wires infrastructure initialization before delivery starts
  index.ts                   Process entry point and operational error boundary
```

The domain and application layers never import MySQL, Redis, HTTP, Socket.IO, or environment APIs. Infrastructure adapters implement application ports. `bootstrap.ts` is the composition root: it initializes MySQL storage before the HTTP server starts.

## Current behavior

- Startup applies pending MySQL migrations before binding HTTP and Socket.IO delivery.
- `GET /health` returns `200` only after that initialization succeeds.
- `GET /api/v1/audit-logs` validates the forwarded Laravel bearer token and returns persisted Audit history.
- Socket.IO shares port `3000`. It requires `auth.authorization` with the complete bearer value, validates it through Laravel, and disconnects accepted sockets after 15 minutes.
- Startup also creates or joins Redis Stream `book-events` consumer group `audit-service` with an instance-specific consumer name.
- `PersistAuditEvent` validates decoded v1 Book events and sends them to the `AuditLogStore` port. `MysqlAuditLogStore` returns the exact new persisted record or `already_exists` for a duplicate delivery.
- A newly persisted record is broadcast as `audit.log.created` to connected authorized clients. Notifications are best-effort; reconnecting clients recover through the history API.

## Commands

```sh
npm run migrate    # apply Audit database migrations
npm run lint
npm run typecheck
npm test
```

From the repository root, use `make audit-check` for the complete isolated Audit-service quality gate.
