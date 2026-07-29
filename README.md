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

Use your local `.env` values to configure a database manager. Connect with `MYSQL_BOOK_USER` to the `books` database or `MYSQL_AUDIT_USER` to the `audit` database. A Redis visualizer connects to `127.0.0.1:6379`.

Useful commands:

```sh
make ps       # service status and health
make logs     # follow service logs
make down     # stop services; preserve databases and dependencies
make check    # initialize the isolated test database, then run backend checks
make test-db-init # initialize the test database for an existing MySQL volume
```

`make check` runs Laravel Pint, Larastan/PHPStan (level 5), and the Laravel test suite in that order. It stops at the first failing check. Tests use the isolated `books_testing` MySQL database; Laravel may reset that schema, but never the local `books` or `audit` data.

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
make redis-cli
```

## Laravel database bootstrap

For the initial superadmin, first run `make up` once to create the ignored root `.env`. Set `SUPERADMIN_EMAIL` and `SUPERADMIN_PASSWORD` there, then run `make up` again so Compose supplies them to the backend container. Finally run:

```sh
make exec SERVICE=backend CMD='php artisan migrate'
make exec SERVICE=backend CMD='php artisan users:provision-superadmin'
```

The command creates the configured superadmin once. Re-running it is a no-op for that account; it refuses to promote an existing `admin`. Book and audit tables will arrive with their respective features.
