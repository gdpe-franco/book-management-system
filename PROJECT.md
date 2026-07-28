# Project

Source requirements: `requirements.pdf`.

## Product rules

- Laravel issues Sanctum bearer tokens. Registration creates `admin` users only.
- `admin` and `superadmin` both manage books and view audit logs. Only `superadmin` manages users and assigns roles. Laravel Policies enforce this.
- Books have `title`, `author`, `isbn`, and `published_year`; deletion is soft. Successful create, update, and soft-delete operations are audited. Reads are not.
- Audit logs are append-only. The dashboard loads history normally and adds Socket.IO notifications in real time.
- Book and audit data use separate MySQL databases. The audit service owns its database.
- Seed data runs through documented commands. An optional Open Library importer is development-only; the application has no runtime catalog dependency.

## Not building

Lending, inventory, search, tenants, a permission library, Kubernetes, CI/CD, cloud deployment, mobile apps, and extra microservices.

## Done when

An admin manages books; a superadmin manages users; each delivered mutation event creates one audit log despite retries; the dashboard receives it without reload; and Docker Compose starts the project from documented commands.

## Working method

For each roadmap phase: approve a short PRD in `tasks/`, derive Ralph stories, implement one verifiable story, then update only the documentation affected by a real decision.

## Delivery order

1. **Foundation** — service folders, Compose, health checks, environment examples, and startup/migration/seed commands.
2. **Laravel API** — bearer authentication, roles and Policies, soft-deletable books, seed data, and backend tests.
3. **Audit pipeline** — Redis Stream publisher, idempotent MySQL audit consumer, log endpoint, and Socket.IO notification.
4. **Dashboard** — authentication, user/book management, logs, and real-time updates.
5. **Handoff** — end-to-end check, responsive polish, README, and test credentials.
