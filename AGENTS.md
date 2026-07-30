# Agent Guide

Read `PROJECT.md` and `ARCHITECTURE.md` before work. The source PDF remains the original requirements reference.

## Documentation ownership

- `PROJECT.md`: product scope, delivery order, and non-goals.
- `ARCHITECTURE.md`: technical decisions, component boundaries, data model, and API/event contracts.
- `README.md`: local setup and developer commands.
- `AGENTS.md`: implementation workflow and code-quality conventions.

## Operating rules

- Treat the system as a Laravel/MySQL API, Node.js audit service, Vue 3/Pinia dashboard, Redis event broker, separately owned MySQL audit store, and Docker Compose environment. Do not substitute these choices without an approved project decision.
- Keep responsibility boundaries intact: Laravel owns users and books; the audit service owns audit logs; services communicate through the documented event contract.
- Before creating a feature PRD, follow the workflow and paths in `PROJECT.md`. Before implementation, use the approved PRD and its derived Ralph stories.
- Deliver one independently verifiable story at a time unless explicitly authorized otherwise. Include affected tests, documentation, authorization, validation, and container changes.
- Record durable decisions in the appropriate authoritative document; do not let feature artifacts override them.
- Never commit, repeat, log, or document secrets, credentials, tokens, private keys, or local environment-file contents. Use configuration keys and `.env.example` placeholders only.
- Run the checks specified by the affected project area. Do not commit broken code, generated runtime files, dependencies that belong in ignored directories, or unrelated changes.

A story is complete only when its acceptance criteria and applicable checks pass, all affected services start together, and durable documentation is current.

## Laravel quality and tests

- Run `make check` for backend changes; it enforces formatting, static analysis, and tests.
- Follow Laravel conventions: prefer framework facilities, use strict comparisons for known types, and reserve `UPPER_SNAKE_CASE` for true PHP constants.
- Keep validation at request boundaries, authorization in Policies, and responses in API Resources as those features are introduced.
- Cover only meaningful functional or security risks. Keep happy and non-happy behavior separate; use data providers only for equivalent variations with the same setup and assertions.
- Organize feature tests by API behavior under `tests/Feature/<Feature>/`, keep cross-cutting behavior in `tests/Feature/Api/`, and reserve `tests/Unit/` for isolated logic. Name files and methods concisely for behavior and outcome; put scenario detail in data-set labels and assertions.

## Audit-service quality and tests

- Run `make audit-check` for Audit-service changes; it uses a one-off test container to lint, typecheck, and run Node.js tests against the isolated `audit_testing` database. The long-running Audit service must not receive test credentials.
- Keep domain and application code independent of transport, database-driver, and configuration imports. Put those concerns in infrastructure adapters and the composition root.
- Use Node's built-in test runner for focused Audit-service tests. Tests must use `audit_testing` and must never read or write the local `audit` database.
- Place isolated tests in `audit-service/tests/unit/` and real dependency tests in `audit-service/tests/integration/`; mirror the relevant source path beneath each level.
