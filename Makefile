ifneq ($(wildcard .env),)
include .env
export
endif

.PHONY: start migrate-up migrate-down migrate-new db-check

MIGRATE = go run github.com/golang-migrate/migrate/v4/cmd/migrate@v4.18.3

start:
	go run ./cmd/mailbox

db-check:
	go run ./cmd/dbcheck

migrate-up:
	@test -n "$(DATABASE_URL)" || (echo "DATABASE_URL is not set" && exit 1)
	$(MIGRATE) -path migrations -database "$(DATABASE_URL)" up

migrate-down:
	@test -n "$(DATABASE_URL)" || (echo "DATABASE_URL is not set" && exit 1)
	$(MIGRATE) -path migrations -database "$(DATABASE_URL)" down 1

migrate-new:
	@test -n "$(name)" || (echo "usage: make migrate-new name=create_letters" && exit 1)
	$(MIGRATE) create -ext sql -dir migrations -seq $(name)
