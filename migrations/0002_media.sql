CREATE TABLE media (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  r2_key TEXT NOT NULL,
  uploader_id TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL
);
