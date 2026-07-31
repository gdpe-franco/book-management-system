# Project

Source requirements: `requirements.pdf`.

## Scope

- Laravel issues 24-hour Sanctum bearer tokens. Registration creates `admin`; only the provisioning command creates the initial `superadmin`.
- `admin` and `superadmin` manage books and view audit history; only `superadmin` lists users. Laravel Policies enforce access.
- Books contain `title`, `author`, `isbn`, and `published_year`; deletion is soft. Create, update, and delete events are audited.
- Audit logs are append-only. The dashboard combines paginated history with Socket.IO notifications after persistence.
- Laravel owns users and books; the Audit service owns logs. They use separate MySQL databases and Redis Streams for committed book events.
- The optional Open Library importer is development-only. The fixed dashboard carousel loads cover images only; it does not synchronize catalog data.

## Out of scope

Lending, inventory, tenants, a permission library, Kubernetes, CI/CD, cloud deployment, mobile applications, and additional services.

## Delivery

| Area | Status |
| --- | --- |
| Foundation, authentication, and bootstrap | Complete |
| Books, seed data, and event publishing | Complete |
| Audit persistence, history, and notifications | Complete |
| Dashboard authentication, books, users, and audit viewer | Complete |
| Handoff: checks, responsive polish, README, and test credentials | Complete |

## Completion criteria

Docker Compose starts the system from the README; authorized users manage books and audit history; superadmins list users; each mutation produces one audit log despite retries; connected dashboards receive the resulting notification.
