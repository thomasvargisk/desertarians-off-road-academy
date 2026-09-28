import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db/client";

export interface Comment {
  id: string;
  body: string;
  createdAt: string;
  authorId: string;
  authorName: string;
}

export function listComments(entityType: string, entityId: string): Comment[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT comments.id as id, comments.body as body, comments.created_at as createdAt,
              comments.author_id as authorId, users.display_name as authorName
       FROM comments JOIN users ON users.id = comments.author_id
       WHERE comments.entity_type = ? AND comments.entity_id = ?
       ORDER BY comments.created_at ASC`
    )
    .all(entityType, entityId) as unknown as Comment[];
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

  const db = getDb();
  db.prepare("INSERT INTO comments (id, entity_type, entity_id, author_id, body, created_at) VALUES (?, ?, ?, ?, ?, ?)").run(
    randomUUID(),
    entityType,
    entityId,
    userId,
    body,
    new Date().toISOString()
  );
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
  const db = getDb();
  const comment = db.prepare("SELECT author_id FROM comments WHERE id = ?").get(commentId) as
    | { author_id: string }
    | undefined;
  if (!comment) return { ok: false, error: "Comment not found." };
  if (comment.author_id !== userId && !isAdmin) {
    return { ok: false, error: "Not authorized." };
  }
  db.prepare("DELETE FROM comments WHERE id = ?").run(commentId);
  revalidatePath(revalidatePathValue);
  return { ok: true };
}
