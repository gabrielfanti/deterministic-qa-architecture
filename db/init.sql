CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS todos (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  done BOOLEAN NOT NULL DEFAULT FALSE
);

INSERT INTO users (email, password)
VALUES ('qa@example.com', 'password123')
ON CONFLICT (email) DO NOTHING;

INSERT INTO todos (user_id, title, done)
SELECT id, 'Primeira tarefa', false FROM users WHERE email='qa@example.com'
ON CONFLICT DO NOTHING;
