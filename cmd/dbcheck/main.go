package main

import (
	"context"
	"log"
	"os"
	"strings"
	"time"

	"github.com/codegirl-007/mailbox/internal/doppler"
	"github.com/jackc/pgx/v5"
)

func main() {
	if err := doppler.Load(); err != nil {
		log.Fatal(err)
	}

	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		log.Fatal("DATABASE_URL is empty after loading Doppler")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 20*time.Second)
	defer cancel()

	conn, err := pgx.Connect(ctx, dsn)
	if err != nil {
		log.Fatalf("connect failed: %s", sanitize(err, dsn))
	}
	defer conn.Close(ctx)

	var one int
	if err := conn.QueryRow(ctx, "select 1").Scan(&one); err != nil {
		log.Fatalf("query failed: %s", sanitize(err, dsn))
	}

	var db, user string
	_ = conn.QueryRow(ctx, "select current_database(), current_user").Scan(&db, &user)
	log.Printf("ok: connected database=%s user=%s", db, user)
}

func sanitize(err error, dsn string) string {
	msg := err.Error()
	if dsn != "" {
		msg = strings.ReplaceAll(msg, dsn, "[DATABASE_URL]")
	}
	if pass := os.Getenv("DB_PASS"); pass != "" {
		msg = strings.ReplaceAll(msg, pass, "[redacted]")
	}
	return msg
}
