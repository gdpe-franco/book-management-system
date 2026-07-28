# Agent Guide

Read `PROJECT.md` and `ARCHITECTURE.md` before work. They are authoritative for scope, technical decisions, delivery order, and constraints. The source PDF remains the original requirements reference.

## Operating rules

- Treat the system as a Laravel/MySQL API, Node.js audit service, Vue 3/Pinia dashboard, Redis event broker, separately owned MySQL audit store, and Docker Compose environment. Do not substitute these choices without an approved project decision.
- Keep responsibility boundaries intact: Laravel owns users and books; the audit service owns audit logs; services communicate through the documented event contract.
- Before creating a feature PRD, follow the workflow and paths in `PROJECT.md`. Before implementation, use the approved PRD and its derived Ralph stories.
- Deliver one independently verifiable story at a time unless explicitly authorized otherwise. Include affected tests, documentation, authorization, validation, and container changes.
- Record durable decisions in the appropriate authoritative document; do not let feature artifacts override them.
- Never commit, repeat, log, or document secrets, credentials, tokens, private keys, or local environment-file contents. Use configuration keys and `.env.example` placeholders only.
- Run the checks specified by the affected project area. Do not commit broken code, generated runtime files, dependencies that belong in ignored directories, or unrelated changes.

A story is complete only when its acceptance criteria and applicable checks pass, all affected services start together, and durable documentation is current.
