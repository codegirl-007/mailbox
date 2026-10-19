package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/codegirl-007/mailbox/internal/doppler"
)

func main() {
	if err := doppler.Load(); err != nil {
		log.Fatal(err)
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/login", serveLogin)
	mux.HandleFunc("/sign-up", serveLogin)
	mux.Handle("/", http.FileServer(http.Dir("static")))

	server := &http.Server{
		Addr:    ":8080",
		Handler: mux,
	}

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM, syscall.SIGHUP)
	defer stop()

	go func() {
		log.Println("mailbox at http://localhost:8080")
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatal(err)
		}
	}()

	<-ctx.Done()
	stop()

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := server.Shutdown(shutdownCtx); err != nil {
		log.Fatal(err)
	}
	log.Println("stopped")
}

func serveLogin(w http.ResponseWriter, r *http.Request) {
	http.ServeFile(w, r, "static/login.html")
}
