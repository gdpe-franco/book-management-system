COMPOSE := docker compose

.PHONY: up down logs ps check shell exec mysql-books mysql-audit redis-cli

up:
	@test -f .env || cp .env.example .env
	$(COMPOSE) up --build -d

down:
	$(COMPOSE) down

logs:
	$(COMPOSE) logs -f

ps:
	$(COMPOSE) ps

check:
	$(COMPOSE) exec backend vendor/bin/pint --test
	$(COMPOSE) exec backend vendor/bin/phpstan analyse
	$(COMPOSE) exec backend php artisan test

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
