CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  avatar_path TEXT,
  bio TEXT,
  is_admin INTEGER NOT NULL DEFAULT 0,
  password_reset_token TEXT,
  password_reset_expires_at TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE TABLE forum_posts (
  id TEXT PRIMARY KEY,
  author_id TEXT NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  edited_at TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE forum_replies (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL REFERENCES forum_posts(id),
  author_id TEXT NOT NULL REFERENCES users(id),
  body TEXT NOT NULL,
  edited_at TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE drives (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  drive_date TEXT NOT NULL,
  public_area TEXT NOT NULL,
  capacity INTEGER NOT NULL
);

CREATE TABLE drive_rsvps (
  id TEXT PRIMARY KEY,
  drive_id TEXT NOT NULL REFERENCES drives(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL,
  UNIQUE(drive_id, user_id)
);

CREATE TABLE academy_courses (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  level TEXT NOT NULL,
  capacity INTEGER NOT NULL
);

CREATE TABLE academy_enrollments (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL REFERENCES academy_courses(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL,
  UNIQUE(course_id, user_id)
);

CREATE TABLE camping_trips (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  tier TEXT NOT NULL,
  trip_date TEXT NOT NULL,
  public_area TEXT NOT NULL,
  capacity INTEGER NOT NULL
);

CREATE TABLE camping_rsvps (
  id TEXT PRIMARY KEY,
  trip_id TEXT NOT NULL REFERENCES camping_trips(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL,
  UNIQUE(trip_id, user_id)
);

CREATE TABLE comments (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  author_id TEXT NOT NULL REFERENCES users(id),
  body TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE marketplace_listings (
  id TEXT PRIMARY KEY,
  seller_id TEXT NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price_aed REAL NOT NULL,
  category TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL
);

CREATE TABLE login_rate_limits (
  email TEXT PRIMARY KEY,
  attempt_count INTEGER NOT NULL,
  window_start TEXT NOT NULL
);

INSERT INTO drives (id, title, description, difficulty, drive_date, public_area, capacity) VALUES
  ('drive-wadi-1', 'Wadi Exploration', 'A guided introductory wadi drive with marshal-led convoy and recovery briefing.', 'Beginner', '2026-11-14', 'Hatta area, Dubai', 12),
  ('drive-dune-1', 'Dune Challenge', 'Intermediate dune bashing with airing-down practice and staged recovery drills.', 'Intermediate', '2026-11-21', 'Al Awir desert, Dubai', 10),
  ('drive-mountain-1', 'Mountain Trail', 'Advanced rocky trail convoy with technical descents and winching practice.', 'Advanced', '2026-11-28', 'Hajar Mountains, Ras Al Khaimah', 8);

INSERT INTO academy_courses (id, title, description, level, capacity) VALUES
  ('academy-beginner-1', 'Beginner Fundamentals', 'Fundamentals of safe off-road driving, vehicle preparation, and basic recovery techniques.', 'Beginner', 15),
  ('academy-intermediate-1', 'Intermediate Trail Skills', 'Intermediate trail navigation, risk assessment, and group management skills.', 'Intermediate', 12),
  ('academy-advanced-1', 'Advanced Convoy Leadership', 'Advanced convoy operations, leadership, and marshal coordination for complex terrain.', 'Advanced', 8);

INSERT INTO camping_trips (id, title, description, tier, trip_date, public_area, capacity) VALUES
  ('camping-basic-1', 'Overnight Basic', 'Designated camping areas with basic amenities for overnight stays. Site assignments released upon confirmation.', 'Overnight Basic', '2026-11-20', 'Al Awir desert, Dubai', 20),
  ('camping-advanced-1', 'Advanced Site', 'More remote camping locations for experienced participants with proper equipment and preparation.', 'Advanced Site', '2026-11-27', 'Hajar Mountains foothills, Ras Al Khaimah', 12),
  ('camping-group-1', 'Group Campout', 'Organized group campout with briefings and go/no-go decisions by accountable marshals.', 'Group Campout', '2026-12-04', 'Hatta area, Dubai', 30);
