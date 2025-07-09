/*  OnlyFans Automation Manager
    File: schema.sql
    Purpose: Database schema
    Created: 2025‑07‑06 – v1.0
*/

CREATE TABLE IF NOT EXISTS fans (
  fan_id BIGINT PRIMARY KEY,
  name TEXT,
  display_name TEXT,
  username TEXT,
  subscription_status TEXT,
  msg_total INTEGER,
  spend_total NUMERIC,
  character_profile JSONB,
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
  msg_id BIGINT PRIMARY KEY,
  fan_id BIGINT REFERENCES fans(fan_id),
  direction TEXT,
  text TEXT,
  created_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transactions (
  txn_id BIGINT PRIMARY KEY,
  fan_id BIGINT REFERENCES fans(fan_id),
  type TEXT,
  amount NUMERIC,
  created_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS posts (
  post_id BIGINT PRIMARY KEY,
  caption TEXT,
  labels TEXT[],
  scheduled_at TIMESTAMP,
  is_archived BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS queue (
  queue_id BIGSERIAL PRIMARY KEY,
  type TEXT,
  payload JSONB,
  publish_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
);

CREATE TABLE IF NOT EXISTS experiments (
  id SERIAL PRIMARY KEY,
  variant_a_id BIGINT,
  variant_b_id BIGINT,
  a_text TEXT,
  b_text TEXT,
  a_opens INTEGER DEFAULT 0,
  b_opens INTEGER DEFAULT 0,
  winner TEXT
);

CREATE TABLE IF NOT EXISTS questionnaire_answers (
  id SERIAL PRIMARY KEY,
  fan_id BIGINT REFERENCES fans(fan_id),
  qa JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

/*  End of File – Last modified 2025‑07‑06 */
