CREATE TABLE IF NOT EXISTS visitors (
  visitor_id TEXT PRIMARY KEY,
  first_seen TEXT NOT NULL,
  last_seen TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS visits (
  visitor_id TEXT NOT NULL,
  visit_date TEXT NOT NULL,
  PRIMARY KEY (visitor_id, visit_date),
  FOREIGN KEY (visitor_id) REFERENCES visitors(visitor_id)
);

CREATE INDEX IF NOT EXISTS idx_visits_date ON visits(visit_date);
