CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(16) NOT NULL CHECK (type IN ('parent', 'child')),
  username VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL DEFAULT '',
  parent_id BIGINT NULL REFERENCES users (id),
  CHECK (
    (type = 'parent' AND parent_id IS NULL)
    OR (type = 'child' AND parent_id IS NOT NULL)
  )
);

CREATE INDEX users_parent_id ON users (parent_id);

CREATE TABLE letters (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  mailbox VARCHAR(32) NOT NULL CHECK (mailbox IN ('suggestions', 'letters', 'problems')),
  body TEXT NOT NULL,
  in_reply_to_id BIGINT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX letters_user_id ON letters (user_id);
CREATE INDEX letters_in_reply_to_id ON letters (in_reply_to_id);
CREATE INDEX letters_mailbox_created_at ON letters (mailbox, created_at);
