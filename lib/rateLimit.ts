import { getDb } from "@/lib/db/client";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

export async function isRateLimited(email: string): Promise<boolean> {
  const db = await getDb();
  const row = await db
    .prepare("SELECT attempt_count as attemptCount, window_start as windowStart FROM login_rate_limits WHERE email = ?")
    .bind(email)
    .first<{ attemptCount: number; windowStart: string }>();
  if (!row) return false;
  if (Date.now() - Date.parse(row.windowStart) > WINDOW_MS) {
    await db.prepare("DELETE FROM login_rate_limits WHERE email = ?").bind(email).run();
    return false;
  }
  return row.attemptCount >= MAX_ATTEMPTS;
}

export async function recordFailedAttempt(email: string): Promise<void> {
  const db = await getDb();
  const row = await db
    .prepare("SELECT attempt_count as attemptCount, window_start as windowStart FROM login_rate_limits WHERE email = ?")
    .bind(email)
    .first<{ attemptCount: number; windowStart: string }>();
  const now = new Date().toISOString();

  if (!row || Date.now() - Date.parse(row.windowStart) > WINDOW_MS) {
    await db
      .prepare(
        "INSERT INTO login_rate_limits (email, attempt_count, window_start) VALUES (?, 1, ?) ON CONFLICT(email) DO UPDATE SET attempt_count = 1, window_start = excluded.window_start"
      )
      .bind(email, now)
      .run();
    return;
  }

  await db.prepare("UPDATE login_rate_limits SET attempt_count = attempt_count + 1 WHERE email = ?").bind(email).run();
}

export async function clearAttempts(email: string): Promise<void> {
  const db = await getDb();
  await db.prepare("DELETE FROM login_rate_limits WHERE email = ?").bind(email).run();
}
