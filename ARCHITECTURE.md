# Architecture

## System context

```plantuml
@startuml SystemContext
!pragma layout smetana
skinparam backgroundColor #FFFFFF
skinparam shadowing false
skinparam defaultFontColor #1E1E2E
skinparam ArrowColor #45475A
skinparam actorBackgroundColor #BFDBFE
skinparam actorBorderColor #45475A
skinparam actorFontColor #1E1E2E
skinparam rectangleFontColor #1E1E2E
skinparam databaseFontColor #FFFFFF
skinparam queueFontColor #1E1E2E
actor Administrator as admin
rectangle "Vue 3 Dashboard\nVue 3, Pinia, Socket.IO client" as spa #BBF7D0
rectangle "Book API\nLaravel, Sanctum" as api #FECACA
rectangle "Audit Service\nNode.js, TypeScript, Socket.IO" as audit #DDD6FE
database "Book Database\nMySQL" as mysql #6B7280
database "Audit Database\nMySQL" as audit_mysql #6B7280
queue "Event Broker\nRedis Streams" as redis #FEF3C7

admin --> spa : Uses HTTPS
spa --> api : Books and users\nREST/HTTPS
spa --> audit : Audit history\nREST/HTTPS
audit --> spa : New audit log\nSocket.IO / WebSocket
audit --> api : Validate bearer token\nREST/HTTPS
api --> mysql : Reads and writes
api --> redis : Appends events
audit --> redis : Consumes events
audit --> audit_mysql : Writes audit logs
@enduml
```

## Mutation flow

```plantuml
@startuml BookMutationAudit
skinparam backgroundColor #FFFFFF
skinparam shadowing false
skinparam defaultFontColor #1E1E2E
skinparam ArrowColor #45475A
skinparam sequence {
  ParticipantBorderColor #45475A
  ParticipantFontColor #1E1E2E
  ActorBorderColor #45475A
  ActorBackgroundColor #BFDBFE
  ActorFontColor #1E1E2E
}
actor Administrator as Admin
participant "Vue 3 Dashboard" as Vue #BBF7D0
participant "Laravel API" as Laravel #FECACA
database "Book DB\nMySQL" as MySQL #6B7280
queue "Redis Stream\nbook-events" as Redis #FEF3C7
participant "Audit Service" as Audit #DDD6FE
database "Audit DB\nMySQL" as AuditMySQL #6B7280

Admin -> Vue: Create, update, or soft-delete book
Vue -> Laravel: Authenticated mutation
Laravel -> MySQL: Commit transaction
Laravel -> Redis: Append event after commit
Laravel --> Vue: Resource response
Audit -> Redis: Read as consumer group
Redis --> Audit: Book event
Audit -> AuditMySQL: Persist by unique event ID
Audit -> Redis: Acknowledge entry
Audit -> Vue: audit.log.created
@enduml
```

## Data model

### Book database (MySQL)

```plantuml
@startuml BookDatabase
!pragma layout smetana
skinparam backgroundColor #FFFFFF
skinparam shadowing false
skinparam defaultFontColor #1E1E2E
skinparam ArrowColor #45475A
skinparam entity {
  BorderColor #45475A
  FontColor #FFFFFF
  BackgroundColor #6B7280
}
entity users {
  * id : bigint <<PK>>
  --
  name : string
  email : string <<UQ>>
  password : string
  role : admin | superadmin
  created_at : timestamp
  updated_at : timestamp
}
entity books {
  * id : bigint <<PK>>
  --
  title : string
  author : string
  isbn : string <<UQ>>
  published_year : integer
  deleted_at : timestamp?
  created_at : timestamp
  updated_at : timestamp
}
entity personal_access_tokens {
  * id : bigint <<PK>>
  --
  tokenable_type : string
  tokenable_id : bigint
  name : text (api)
  token : char(64) <<UQ, hashed>>
  abilities : text (["*"])
  last_used_at : timestamp?
  expires_at : timestamp? (issued: +24h)
  created_at : timestamp
  updated_at : timestamp
}
users ||--o{ personal_access_tokens : owns
@enduml
```

### Audit database (MySQL)

```plantuml
@startuml AuditDatabase
!pragma layout smetana
skinparam backgroundColor #FFFFFF
skinparam shadowing false
skinparam defaultFontColor #1E1E2E
skinparam entity {
  BorderColor #45475A
  FontColor #FFFFFF
  BackgroundColor #6B7280
}
entity audit_logs {
  * event_id : char(36) <<PK>>
  --
  event_type : string
  event_version : integer
  occurred_at : timestamp
  actor_id : bigint
  book_snapshot : json
  changes : json
  persisted_at : timestamp
}
note right of audit_logs
  actor_id is a reference, not a foreign key:
  Laravel owns users and books.
end note
@enduml
```

## Boundaries

| Component | Owns | Does not own |
| --- | --- | --- |
| Laravel API | users, books, Policies, mutation events | audit logs or WebSockets |
| Audit service | events, audit logs, real-time notifications | books, users, book database |
| Vue | interface and local state | business rules or databases |
| Redis Streams | event transport | system-of-record data |

## Integration rules

- Laravel uses MySQL and Sanctum bearer tokens; the audit service owns a separate MySQL database.
- Laravel and the MySQL server use UTC; both Book and Audit database timestamps use this shared server timezone.
- Stream `book-events` carries `event_id`, `event_type`, `occurred_at`, `actor.id`, `book`, and `changes`.
- Laravel publishes after commit. The audit service persists uniquely by `event_id`, then acknowledges and emits `audit.log.created`.
- Laravel is the sole bearer-token authority. The audit service delegates validation to Laravel's authenticated `GET /api/v1/me` endpoint and stores no local session or token state.
- Compose uses health checks and ignored environment files for secrets. MySQL and Redis use their standard ports on the local development host for optional database and Redis visualizers.

### Audit-service authentication

- Vue sends the Sanctum bearer token in the `Authorization` header to Laravel and the audit-history endpoint.
- For every audit-history request, the audit service forwards that header to Laravel's internal `GET /api/v1/me` endpoint. It returns `401` unless Laravel confirms the token.
- For the Socket.IO handshake, Vue sends the token through Socket.IO's `auth` payload, not a query parameter. The audit service validates it with Laravel before accepting the connection.
- The audit service retains only the validated user identity for the active socket; it does not issue, persist, or inspect Sanctum tokens.

## API contract — v1

All REST endpoints are versioned under `/api/v1` and use JSON. Protected calls send `Authorization: Bearer <token>`. The implemented request and response schemas live in the root `openapi.yaml` contract and are updated with each endpoint.

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/auth/register` | Public | Register an `admin` and return a 24-hour Sanctum bearer token. |
| POST | `/auth/login` | Public | Return a new 24-hour Sanctum bearer token. |
| POST | `/auth/logout` | Authenticated | Revoke the current token. |
| GET | `/me` | Authenticated | Laravel: return the current user and role; audit service uses it internally to validate bearer tokens. |
| GET, POST | `/books` | Authenticated | List active books; create a book. |
| GET, PATCH, DELETE | `/books/{id}` | Authenticated | Read, update, or soft-delete a book. |
| GET | `/users` | Superadmin | List users. |
| GET | `/audit-logs` | Authenticated | Audit service: validate the bearer token with Laravel, then return paginated persisted audit logs. |

Book write fields are `title`, `author`, `isbn`, and `published_year`. Laravel returns API Resources; validation failures use `422`, unauthenticated calls use `401`, and unauthorized calls use `403`.

## Event contract — v1

Laravel appends this JSON message to Redis Stream `book-events` after the MySQL transaction commits:

```json
{
  "event_id": "uuid",
  "event_type": "book.created",
  "event_version": 1,
  "occurred_at": "2026-07-27T12:00:00Z",
  "actor": { "id": 1 },
  "book": {
    "id": 42,
    "title": "Example title",
    "author": "Example author",
    "isbn": "9780000000000",
    "published_year": 2026
  },
  "changes": {}
}
```

- `event_type` is `book.created`, `book.updated`, or `book.deleted`; the last represents a soft deletion.
- `changes` records before/after values for updates and `deleted_at` for deletion.
- The audit service uses `event_id` as the `audit_logs` primary key, persists the log, then acknowledges the Stream entry and emits `audit.log.created` to connected dashboards. The audit-history endpoint supplies the paginated baseline; Socket.IO appends later logs in real time.
- Incompatible changes require a new event version; v1 remains supported until its consumers are removed.
