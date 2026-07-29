# Book Management System

## Start the environment

Requirements: Docker Desktop or Docker Engine with the Compose plugin.

For a new clone, run:

```sh
make up
```

This creates `.env` from `.env.example` when needed, builds the images, initializes the local application databases on the first MySQL start, and starts all services. Do not commit `.env`.

For a normal work session after `make down`, run the same command:

```sh
make up
```

Services are available at:

- Laravel API: `http://localhost:8000`
- Vue dashboard: `http://localhost:5174`
- Audit service health check: `http://localhost:3000/health`
- MySQL: `127.0.0.1:3306`
- Redis: `127.0.0.1:6379`

Use your local `.env` values to configure a database manager. Connect with `MYSQL_BOOK_USER` to the `books` database or `MYSQL_AUDIT_USER` to the `audit` database.

Useful commands:

```sh
make ps       # service status and health
make logs     # follow service logs
make down     # stop services; preserve databases and dependencies
make check    # initialize isolated test stores, then run backend checks
make test-db-init # initialize the test database for an existing MySQL volume
make test-redis-init # clear Redis DB 2, used only by tests
```

`make check` runs Laravel Pint, Larastan/PHPStan (level 5), and the Laravel test suite in that order. It stops at the first failing check. Tests use `books_testing` in MySQL and Redis database `2`; `make check` clears only those test stores, never local Book, Audit, or Redis event data.

## Container commands

Open a shell in any running service:

```sh
make shell SERVICE=backend
make shell SERVICE=mysql
make shell SERVICE=audit-service
make shell SERVICE=frontend
make shell SERVICE=redis
```

Run a command without opening a shell:

```sh
make exec SERVICE=backend CMD='php artisan route:list'
```

Open the database or Redis command-line client with the appropriate local service account:

```sh
make mysql-books
make mysql-audit
make redis-cli      # application event broker, Redis DB 0
make redis-test-cli # isolated PHPUnit broker, Redis DB 2
```

## Laravel database bootstrap

For the initial superadmin, first run `make up` once to create the ignored root `.env`. Set `SUPERADMIN_EMAIL` and `SUPERADMIN_PASSWORD` there, then run `make up` again so Compose supplies them to the backend container. Finally run:

```sh
make exec SERVICE=backend CMD='php artisan migrate --seed'
make exec SERVICE=backend CMD='php artisan users:provision-superadmin'
```

The command creates the configured superadmin once.

`migrate --seed` runs the built-in `BookSeeder`, which loads a deterministic offline catalogue of 25 books. It is idempotent by ISBN and leaves any existing book unchanged. To reset a local catalogue, run `make exec SERVICE=backend CMD='php artisan migrate:fresh --seed'`.

## Open Library import

For optional development data, import a subject from the [Open Library Search API](https://openlibrary.org/dev/docs/api/search):

```sh
make exec SERVICE=backend CMD='php artisan books:import-open-library --subject=science_fiction'
```

Use an Open Library subject slug. Useful options include:

| Subject | Focus |
| --- | --- |
| `science_fiction` | Science-fiction works |
| `fantasy` | Fantasy works |
| `history` | History works |
| `biography` | Biographical works |
| `mystery` | Mystery and detective works |
| `horror` | Horror works |
| `romance` | Romance works |
| `love` | Works tagged with love |

The command requests up to 10 results by default; `--limit` accepts 1 through 200. It imports only complete valid records, skips existing ISBNs without changing them, and performs no runtime synchronization. For example:

```sh
make exec SERVICE=backend CMD='php artisan books:import-open-library --subject=history --limit=50'
```
