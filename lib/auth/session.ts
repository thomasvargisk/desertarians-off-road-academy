import { cookies } from "next/headers";
import { getDb } from "@/lib/db/client";

const SESSION_COOKIE = "desertarians_session";
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export interface SessionUser {
  id: string;
  email: string;
  displayName: string;
  isAdmin: boolean;
  avatarPath: string | null;
  bio: string | null;
}

export async function createSession(userId: string): Promise<void> {
  const db = await getDb();
  const token = crypto.randomUUID() + crypto.randomUUID();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_DURATION_MS);
  await db
    .prepare("INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)")
    .bind(token, userId, now.toISOString(), expiresAt.toISOString())
    .run();
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    const db = await getDb();
    await db.prepare("DELETE FROM sessions WHERE token = ?").bind(token).run();
  }
  cookieStore.delete(SESSION_COOKIE);
}

/** Invalidates every session for a user. Call on password change/reset so a stolen session token doesn't survive a credential rotation. */
export async function destroyAllUserSessions(userId: string): Promise<void> {
  const db = await getDb();
  await db.prepare("DELETE FROM sessions WHERE user_id = ?").bind(userId).run();
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const db = await getDb();
  const row = await db
    .prepare(
      `SELECT users.id as id, users.email as email, users.display_name as displayName,
              users.is_admin as isAdmin, users.avatar_path as avatarPath, users.bio as bio,
              users.last_seen_at as lastSeenAt, sessions.expires_at as expiresAt
       FROM sessions JOIN users ON users.id = sessions.user_id
       WHERE sessions.token = ?`
    )
    .bind(token)
    .first<{
      id: string;
      email: string;
      displayName: string;
      isAdmin: number;
      avatarPath: string | null;
      bio: string | null;
      lastSeenAt: string | null;
      expiresAt: string;
    }>();

  if (!row) return null;
  if (Date.parse(row.expiresAt) <= Date.now()) {
    await db.prepare("DELETE FROM sessions WHERE token = ?").bind(token).run();
    return null;
  }

  const PRESENCE_THROTTLE_MS = 60 * 1000;
  if (!row.lastSeenAt || Date.now() - Date.parse(row.lastSeenAt) > PRESENCE_THROTTLE_MS) {
    await db.prepare("UPDATE users SET last_seen_at = ? WHERE id = ?").bind(new Date().toISOString(), row.id).run();
  }

  return {
    id: row.id,
    email: row.email,
    displayName: row.displayName,
    isAdmin: Boolean(row.isAdmin),
    avatarPath: row.avatarPath,
    bio: row.bio,
  };
}
