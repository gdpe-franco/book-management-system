# Project

Source requirements: `requirements.pdf`.

## Product rules

- Laravel issues 24-hour Sanctum bearer tokens. Registration creates `admin` users only.
- `admin` and `superadmin` both authenticate, manage books, and view audit logs. Only `superadmin` may view the full user list. Laravel Policies enforce this.
- The initial `superadmin` is created by a documented privileged provisioning command; the application does not assign or change roles.
- Books have `title`, `author`, `isbn`, and `published_year`; deletion is soft. Successful create, update, and soft-delete operations are audited. Reads are not.
- Audit logs are append-only. The dashboard loads paginated history from the audit service; after successful persistence, the audit service emits a Socket.IO notification to connected dashboards.
- Book and audit data use separate MySQL databases. The audit service owns its database.
- Laravel is the only token authority. The audit service forwards bearer tokens to Laravel for validation and stores no local user session or token state.
- Seed data runs through documented commands. An optional Open Library importer is development-only; the application has no runtime catalog dependency.

## Not building

Lending, inventory, search, tenants, a permission library, Kubernetes, CI/CD, cloud deployment, mobile apps, and extra microservices.

## Done when

An admin or superadmin manages books and views audit history; a superadmin views the user list; each delivered mutation event creates one audit log despite retries; connected dashboards receive its notification without reload; and Docker Compose starts the project from documented commands.

## Working method

Deliver one feature at a time: approve a short PRD in `tasks/`, derive Ralph stories, implement one independently verifiable story, then update only the documentation affected by a real decision. Do not begin the next feature until the current feature passes its checks.

## Feature delivery order

1. **Foundation** — Owner: Compose. Service folders, health checks, environment examples, and developer commands. Complete.
2. **Authentication and bootstrap** — Owner: Laravel/MySQL. Sanctum bearer registration, login, logout, current-user endpoint, route middleware, and initial-superadmin provisioning command.
3. **User listing** — Owner: Laravel/MySQL. Superadmin-only paginated user list and `UserPolicy`.
4. **Book persistence** — Owner: Laravel/MySQL. Book migration, model, soft deletion, factories, and database tests.
5. **Book CRUD API** — Owner: Laravel. Validated book endpoints, API Resources, `BookPolicy`, and feature tests.
6. **Book seed data** — Owner: Laravel. Documented local seed command and optional development-only Open Library importer.
7. **Book event publishing** — Owner: Laravel/Redis. Publish committed book mutations to `book-events`.
8. **Audit persistence** — Owner: Audit service/MySQL. Audit schema, database client, and append-only audit-log storage.
9. **Audit consumption** — Owner: Audit service/Redis. Consume `book-events` idempotently and acknowledge only after persistence.
10. **Audit history API** — Owner: Audit service. Validate bearer tokens with Laravel and return paginated persisted audit logs.
11. **Audit notifications** — Owner: Audit service. Authorize Socket.IO connections and emit a notification after storing an audit log.
12. **Dashboard authentication** — Owner: Vue/Laravel. Token handling and authenticated application shell.
13. **Dashboard books** — Owner: Vue/Laravel. Book-management screens.
14. **Dashboard users** — Owner: Vue/Laravel. Superadmin user-list screen.
15. **Dashboard audit viewer** — Owner: Vue/Audit service. Load paginated audit history and append live Socket.IO updates; optionally surface each new log as a toast.
16. **Handoff** — Owner: whole system. End-to-end check, responsive polish, README, and test credentials.
