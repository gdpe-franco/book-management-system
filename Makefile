COMPOSE := docker compose

.PHONY: up down logs ps check audit-check frontend-check test-db-init test-audit-db-init test-redis-init shell exec mysql-books mysql-audit redis-cli redis-test-cli

up:
	@test -f .env || cp .env.example .env
	$(COMPOSE) up --build --wait

down:
	$(COMPOSE) down

logs:
	$(COMPOSE) logs -f

ps:
	$(COMPOSE) ps

check: test-db-init test-redis-init
	$(COMPOSE) exec backend vendor/bin/pint --test
	$(COMPOSE) exec backend vendor/bin/phpstan analyse --memory-limit=512M
	$(COMPOSE) exec backend php artisan test

audit-check: test-audit-db-init test-redis-init
	$(COMPOSE) exec audit-service sh -c 'npm run lint && npm run typecheck && npm test'

frontend-check:
	$(COMPOSE) exec frontend npm run check

test-db-init:
	$(COMPOSE) exec mysql sh /docker-entrypoint-initdb.d/init-users.sh

test-audit-db-init:
	$(COMPOSE) exec mysql sh /docker-entrypoint-initdb.d/init-users.sh

test-redis-init:
	$(COMPOSE) exec redis redis-cli -n 2 FLUSHDB

shell:
	@test -n "$(SERVICE)" || (echo "Usage: make shell SERVICE=<service>"; exit 1)
	$(COMPOSE) exec $(SERVICE) sh

exec:
	@test -n "$(SERVICE)" || (echo "Usage: make exec SERVICE=<service> CMD='<command>'"; exit 1)
	@test -n "$(CMD)" || (echo "Usage: make exec SERVICE=<service> CMD='<command>'"; exit 1)
	$(COMPOSE) exec $(SERVICE) $(CMD)

mysql-books:
	$(COMPOSE) exec mysql sh -c 'MYSQL_PWD="$$MYSQL_BOOK_PASSWORD" mysql -u "$$MYSQL_BOOK_USER" books'

mysql-audit:
	$(COMPOSE) exec mysql sh -c 'MYSQL_PWD="$$MYSQL_AUDIT_PASSWORD" mysql -u "$$MYSQL_AUDIT_USER" audit'

redis-cli:
	$(COMPOSE) exec redis redis-cli

redis-test-cli:
	$(COMPOSE) exec redis redis-cli -n 2
