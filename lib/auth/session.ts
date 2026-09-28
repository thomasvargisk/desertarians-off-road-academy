import { randomBytes } from "node:crypto";
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
  const db = getDb();
  const token = randomBytes(32).toString("hex");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_DURATION_MS);
  db.prepare("INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)").run(
    token,
    userId,
    now.toISOString(),
    expiresAt.toISOString()
  );
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
    const db = getDb();
    db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
  }
  cookieStore.delete(SESSION_COOKIE);
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const db = getDb();
  const row = db
    .prepare(
      `SELECT users.id as id, users.email as email, users.display_name as displayName,
              users.is_admin as isAdmin, users.avatar_path as avatarPath, users.bio as bio,
              sessions.expires_at as expiresAt
       FROM sessions JOIN users ON users.id = sessions.user_id
       WHERE sessions.token = ?`
    )
    .get(token) as unknown as
    | { id: string; email: string; displayName: string; isAdmin: number; avatarPath: string | null; bio: string | null; expiresAt: string }
    | undefined;

  if (!row) return null;
  if (Date.parse(row.expiresAt) <= Date.now()) {
    db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
    return null;
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
