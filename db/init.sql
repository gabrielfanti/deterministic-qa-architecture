DROP TABLE IF EXISTS tasks;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'user')),
  api_token TEXT UNIQUE NOT NULL
);

CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  title VARCHAR(120) NOT NULL,
  description VARCHAR(400),
  status TEXT NOT NULL CHECK (status IN ('todo', 'in_progress', 'done')),
  type TEXT NOT NULL CHECK (type IN ('feature', 'bug', 'chore')),
  external_ref VARCHAR(40) NOT NULL UNIQUE,
  owner_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  version INT NOT NULL DEFAULT 1,
  run_id VARCHAR(60) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO users (email, password, role, api_token)
VALUES
  ('qa-admin@example.com', 'password123', 'admin', 'token-admin-qa'),
  ('qa-user@example.com', 'password123', 'user', 'token-user-qa');

INSERT INTO tasks (title, description, status, type, external_ref, owner_id, version, run_id, created_at, updated_at)
SELECT
  'Seed Task 1',
  'Deterministic seed task for smoke checks',
  'todo',
  'feature',
  'seed_task_001',
  u.id,
  1,
  'seed',
  '2025-01-01T10:00:00Z',
  '2025-01-01T10:00:00Z'
FROM users u
WHERE u.email = 'qa-user@example.com';

INSERT INTO tasks (title, description, status, type, external_ref, owner_id, version, run_id, created_at, updated_at)
SELECT
  'Seed Task 2',
  'Second deterministic task for list/sort checks',
  'in_progress',
  'bug',
  'seed_task_002',
  u.id,
  1,
  'seed',
  '2025-01-02T10:00:00Z',
  '2025-01-02T10:00:00Z'
FROM users u
WHERE u.email = 'qa-user@example.com';
