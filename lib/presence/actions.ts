import { getDb } from "@/lib/db/client";

export interface OnlineUser {
  id: string;
  displayName: string;
  avatarPath: string | null;
}

const ONLINE_THRESHOLD_MINUTES = 5;

export async function getOnlineUsers(limit = 10): Promise<{ users: OnlineUser[]; count: number }> {
  const db = await getDb();
  const cutoff = new Date(Date.now() - ONLINE_THRESHOLD_MINUTES * 60 * 1000).toISOString();

  const { results } = await db
    .prepare(
      `SELECT id, display_name as displayName, avatar_path as avatarPath
       FROM users WHERE last_seen_at IS NOT NULL AND last_seen_at > ?
       ORDER BY last_seen_at DESC LIMIT ?`
    )
    .bind(cutoff, limit)
    .all<OnlineUser>();

  const countRow = await db
    .prepare("SELECT COUNT(*) as c FROM users WHERE last_seen_at IS NOT NULL AND last_seen_at > ?")
    .bind(cutoff)
    .first<{ c: number }>();

  return { users: results, count: countRow?.c ?? 0 };
}
