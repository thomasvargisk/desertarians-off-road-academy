import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db/client";

export interface Comment {
  id: string;
  body: string;
  createdAt: string;
  authorId: string;
  authorName: string;
}

export async function listComments(entityType: string, entityId: string): Promise<Comment[]> {
  const db = await getDb();
  const { results } = await db
    .prepare(
      `SELECT comments.id as id, comments.body as body, comments.created_at as createdAt,
              comments.author_id as authorId, users.display_name as authorName
       FROM comments JOIN users ON users.id = comments.author_id
       WHERE comments.entity_type = ? AND comments.entity_id = ?
       ORDER BY comments.created_at ASC`
    )
    .bind(entityType, entityId)
    .all<Comment>();
  return results;
}

export async function createComment(
  userId: string,
  entityType: string,
  entityId: string,
  formData: FormData,
  revalidatePathValue: string
): Promise<{ ok: boolean; error?: string }> {
  "use server";
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return { ok: false, error: "Comment cannot be empty." };

  const db = await getDb();
  await db
    .prepare("INSERT INTO comments (id, entity_type, entity_id, author_id, body, created_at) VALUES (?, ?, ?, ?, ?, ?)")
    .bind(crypto.randomUUID(), entityType, entityId, userId, body, new Date().toISOString())
    .run();
  revalidatePath(revalidatePathValue);
  return { ok: true };
}

export async function deleteComment(
  userId: string,
  isAdmin: boolean,
  commentId: string,
  revalidatePathValue: string
): Promise<{ ok: boolean; error?: string }> {
  "use server";
  const db = await getDb();
  const comment = await db
    .prepare("SELECT author_id as authorId FROM comments WHERE id = ?")
    .bind(commentId)
    .first<{ authorId: string }>();
  if (!comment) return { ok: false, error: "Comment not found." };
  if (comment.authorId !== userId && !isAdmin) {
    return { ok: false, error: "Not authorized." };
  }
  await db.prepare("DELETE FROM comments WHERE id = ?").bind(commentId).run();
  revalidatePath(revalidatePathValue);
  return { ok: true };
}
