import { getDb } from "@/lib/db/client";

export interface Contributor {
  userId: string;
  displayName: string;
  avatarPath: string | null;
  score: number;
}

const SCORE_QUERY = `
  SELECT
    users.id as userId,
    users.display_name as displayName,
    users.avatar_path as avatarPath,
    (
      (SELECT COUNT(*) FROM forum_posts WHERE forum_posts.author_id = users.id) * 3 +
      (SELECT COUNT(*) FROM forum_replies WHERE forum_replies.author_id = users.id) * 1 +
      (SELECT COUNT(*) FROM comments WHERE comments.author_id = users.id) * 1 +
      (SELECT COUNT(*) FROM drive_rsvps WHERE drive_rsvps.user_id = users.id) * 5 +
      (SELECT COUNT(*) FROM camping_rsvps WHERE camping_rsvps.user_id = users.id) * 5 +
      (SELECT COUNT(*) FROM academy_enrollments WHERE academy_enrollments.user_id = users.id) * 5
    ) as score
  FROM users
`;

export async function getTopContributors(limit = 5): Promise<Contributor[]> {
  const db = await getDb();
  const { results } = await db
    .prepare(`${SCORE_QUERY} ORDER BY score DESC LIMIT ?`)
    .bind(limit)
    .all<Contributor>();
  return results.filter((c) => c.score > 0);
}

export async function getUserReputationScore(userId: string): Promise<number> {
  const db = await getDb();
  const row = await db
    .prepare(`${SCORE_QUERY} WHERE users.id = ?`)
    .bind(userId)
    .first<{ score: number }>();
  return row?.score ?? 0;
}
