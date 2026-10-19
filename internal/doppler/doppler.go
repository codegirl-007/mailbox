package doppler

import (
	"encoding/json"
	"fmt"
	"net"
	"net/url"
	"os"
	"strings"

	sdk "github.com/dilutedev/doppler"
)

// Load copies Doppler secrets into the process environment.
// Existing env vars are left as-is. If no Doppler token is set, Load is a no-op.
func Load() error {
	token := strings.Trim(os.Getenv("DOPPLER_TOKEN"), `"'`)
	if token == "" {
		token = strings.Trim(os.Getenv("DOPPLER_KEY"), `"'`)
	}
	if token == "" {
		return nil
	}

	client, err := sdk.New(token)
	if err != nil {
		return fmt.Errorf("doppler: %w", err)
	}

	body, err := client.DownloadSecret(sdk.DownloadSecretParams{
		Project:         strings.Trim(os.Getenv("DOPPLER_PROJECT"), `"'`),
		Config:          strings.Trim(os.Getenv("DOPPLER_CONFIG"), `"'`),
		Format:          "json",
		NameTransformer: "constant",
	})
	if err != nil {
		return fmt.Errorf("doppler: %w", err)
	}

	var secrets map[string]string
	if err := json.Unmarshal([]byte(body), &secrets); err != nil {
		return fmt.Errorf("doppler: %w", err)
	}

	for key, value := range secrets {
		if os.Getenv(key) == "" {
			if err := os.Setenv(key, value); err != nil {
				return err
			}
		}
	}

	return setDatabaseURL()
}

func setDatabaseURL() error {
	if os.Getenv("DATABASE_URL") != "" {
		return nil
	}

	user := os.Getenv("DB_USER")
	pass := os.Getenv("DB_PASS")
	host := os.Getenv("DB_HOST")
	if user == "" || pass == "" || host == "" {
		return nil
	}

	name := os.Getenv("DB_NAME")
	if name == "" {
		name = "postgres"
	}

	port := os.Getenv("DB_PORT")
	if port == "" {
		port = "5432"
	}
	if _, _, err := net.SplitHostPort(host); err != nil {
		host = net.JoinHostPort(host, port)
	}

	u := url.URL{
		Scheme:   "postgresql",
		User:     url.UserPassword(user, pass),
		Host:     host,
		Path:     "/" + name,
		RawQuery: "sslmode=verify-full&sslrootcert=system",
	}
	return os.Setenv("DATABASE_URL", u.String())
}
