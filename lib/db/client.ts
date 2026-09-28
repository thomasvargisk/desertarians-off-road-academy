import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import path from "node:path";

const DB_PATH = path.join(process.cwd(), "data", "desertarians.db");

let db: DatabaseSync | null = null;

function ensureColumn(database: DatabaseSync, table: string, column: string, definition: string) {
  const cols = database.prepare(`PRAGMA table_info(${table})`).all() as unknown as { name: string }[];
  if (!cols.some((c) => c.name === column)) {
    database.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

function migrate(database: DatabaseSync) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      display_name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      password_salt TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS forum_posts (
      id TEXT PRIMARY KEY,
      author_id TEXT NOT NULL REFERENCES users(id),
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS forum_replies (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL REFERENCES forum_posts(id),
      author_id TEXT NOT NULL REFERENCES users(id),
      body TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS drives (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      drive_date TEXT NOT NULL,
      public_area TEXT NOT NULL,
      capacity INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS drive_rsvps (
      id TEXT PRIMARY KEY,
      drive_id TEXT NOT NULL REFERENCES drives(id),
      user_id TEXT NOT NULL REFERENCES users(id),
      created_at TEXT NOT NULL,
      UNIQUE(drive_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS academy_courses (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      level TEXT NOT NULL,
      capacity INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS academy_enrollments (
      id TEXT PRIMARY KEY,
      course_id TEXT NOT NULL REFERENCES academy_courses(id),
      user_id TEXT NOT NULL REFERENCES users(id),
      created_at TEXT NOT NULL,
      UNIQUE(course_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS camping_trips (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      tier TEXT NOT NULL,
      trip_date TEXT NOT NULL,
      public_area TEXT NOT NULL,
      capacity INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS camping_rsvps (
      id TEXT PRIMARY KEY,
      trip_id TEXT NOT NULL REFERENCES camping_trips(id),
      user_id TEXT NOT NULL REFERENCES users(id),
      created_at TEXT NOT NULL,
      UNIQUE(trip_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      author_id TEXT NOT NULL REFERENCES users(id),
      body TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS marketplace_listings (
      id TEXT PRIMARY KEY,
      seller_id TEXT NOT NULL REFERENCES users(id),
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      price_aed REAL NOT NULL,
      category TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL
    );
  `);

  ensureColumn(database, "users", "avatar_path", "TEXT");
  ensureColumn(database, "users", "bio", "TEXT");
  ensureColumn(database, "users", "is_admin", "INTEGER NOT NULL DEFAULT 0");
  ensureColumn(database, "users", "password_reset_token", "TEXT");
  ensureColumn(database, "users", "password_reset_expires_at", "TEXT");
  ensureColumn(database, "forum_posts", "edited_at", "TEXT");
  ensureColumn(database, "forum_replies", "edited_at", "TEXT");

  const driveCount = database.prepare("SELECT COUNT(*) as c FROM drives").get() as { c: number };
  if (driveCount.c === 0) {
    const insertDrive = database.prepare(
      "INSERT INTO drives (id, title, description, difficulty, drive_date, public_area, capacity) VALUES (?, ?, ?, ?, ?, ?, ?)"
    );
    insertDrive.run(
      "drive-wadi-1",
      "Wadi Exploration",
      "A guided introductory wadi drive with marshal-led convoy and recovery briefing.",
      "Beginner",
      "2026-11-14",
      "Hatta area, Dubai",
      12
    );
    insertDrive.run(
      "drive-dune-1",
      "Dune Challenge",
      "Intermediate dune bashing with airing-down practice and staged recovery drills.",
      "Intermediate",
      "2026-11-21",
      "Al Awir desert, Dubai",
      10
    );
    insertDrive.run(
      "drive-mountain-1",
      "Mountain Trail",
      "Advanced rocky trail convoy with technical descents and winching practice.",
      "Advanced",
      "2026-11-28",
      "Hajar Mountains, Ras Al Khaimah",
      8
    );
  }

  const courseCount = database.prepare("SELECT COUNT(*) as c FROM academy_courses").get() as { c: number };
  if (courseCount.c === 0) {
    const insertCourse = database.prepare(
      "INSERT INTO academy_courses (id, title, description, level, capacity) VALUES (?, ?, ?, ?, ?)"
    );
    insertCourse.run(
      "academy-beginner-1",
      "Beginner Fundamentals",
      "Fundamentals of safe off-road driving, vehicle preparation, and basic recovery techniques.",
      "Beginner",
      15
    );
    insertCourse.run(
      "academy-intermediate-1",
      "Intermediate Trail Skills",
      "Intermediate trail navigation, risk assessment, and group management skills.",
      "Intermediate",
      12
    );
    insertCourse.run(
      "academy-advanced-1",
      "Advanced Convoy Leadership",
      "Advanced convoy operations, leadership, and marshal coordination for complex terrain.",
      "Advanced",
      8
    );
  }

  const tripCount = database.prepare("SELECT COUNT(*) as c FROM camping_trips").get() as { c: number };
  if (tripCount.c === 0) {
    const insertTrip = database.prepare(
      "INSERT INTO camping_trips (id, title, description, tier, trip_date, public_area, capacity) VALUES (?, ?, ?, ?, ?, ?, ?)"
    );
    insertTrip.run(
      "camping-basic-1",
      "Overnight Basic",
      "Designated camping areas with basic amenities for overnight stays. Site assignments released upon confirmation.",
      "Overnight Basic",
      "2026-11-20",
      "Al Awir desert, Dubai",
      20
    );
    insertTrip.run(
      "camping-advanced-1",
      "Advanced Site",
      "More remote camping locations for experienced participants with proper equipment and preparation.",
      "Advanced Site",
      "2026-11-27",
      "Hajar Mountains foothills, Ras Al Khaimah",
      12
    );
    insertTrip.run(
      "camping-group-1",
      "Group Campout",
      "Organized group campout with briefings and go/no-go decisions by accountable marshals.",
      "Group Campout",
      "2026-12-04",
      "Hatta area, Dubai",
      30
    );
  }
}

/** Returns the shared SQLite connection, creating and migrating the database file on first use. */
export function getDb(): DatabaseSync {
  if (db) return db;
  mkdirSync(path.dirname(DB_PATH), { recursive: true });
  db = new DatabaseSync(DB_PATH);
  migrate(db);
  return db;
}
