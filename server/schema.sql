-- Bizora application state store.
-- One row per localStorage key the frontend used to own; value holds the exact JSON payload.
CREATE TABLE IF NOT EXISTS app_state (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
