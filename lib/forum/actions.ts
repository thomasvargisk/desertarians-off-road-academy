import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db/client";

export interface ForumPost {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  editedAt: string | null;
  authorId: string;
  authorName: string;
  replyCount: number;
}

export interface ForumReply {
  id: string;
  body: string;
  createdAt: string;
  editedAt: string | null;
  authorId: string;
  authorName: string;
}

const POSTS_PER_PAGE = 20;

export function listPosts(query?: string, page = 1): { posts: ForumPost[]; totalCount: number } {
  const db = getDb();
  const offset = (page - 1) * POSTS_PER_PAGE;

  if (query && query.trim()) {
    const like = `%${query.trim()}%`;
    const posts = db
      .prepare(
        `SELECT forum_posts.id as id, forum_posts.title as title, forum_posts.body as body,
                forum_posts.created_at as createdAt, forum_posts.edited_at as editedAt,
                forum_posts.author_id as authorId, users.display_name as authorName,
                (SELECT COUNT(*) FROM forum_replies WHERE forum_replies.post_id = forum_posts.id) as replyCount
         FROM forum_posts JOIN users ON users.id = forum_posts.author_id
         WHERE forum_posts.title LIKE ? OR forum_posts.body LIKE ?
         ORDER BY forum_posts.created_at DESC
         LIMIT ? OFFSET ?`
      )
      .all(like, like, POSTS_PER_PAGE, offset) as unknown as ForumPost[];
    const totalCount = (
      db
        .prepare("SELECT COUNT(*) as c FROM forum_posts WHERE title LIKE ? OR body LIKE ?")
        .get(like, like) as { c: number }
    ).c;
    return { posts, totalCount };
  }

  const posts = db
    .prepare(
      `SELECT forum_posts.id as id, forum_posts.title as title, forum_posts.body as body,
              forum_posts.created_at as createdAt, forum_posts.edited_at as editedAt,
              forum_posts.author_id as authorId, users.display_name as authorName,
              (SELECT COUNT(*) FROM forum_replies WHERE forum_replies.post_id = forum_posts.id) as replyCount
       FROM forum_posts JOIN users ON users.id = forum_posts.author_id
       ORDER BY forum_posts.created_at DESC
       LIMIT ? OFFSET ?`
    )
    .all(POSTS_PER_PAGE, offset) as unknown as ForumPost[];
  const totalCount = (db.prepare("SELECT COUNT(*) as c FROM forum_posts").get() as { c: number }).c;
  return { posts, totalCount };
}

export function getPost(postId: string): ForumPost | null {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT forum_posts.id as id, forum_posts.title as title, forum_posts.body as body,
              forum_posts.created_at as createdAt, forum_posts.edited_at as editedAt,
              forum_posts.author_id as authorId, users.display_name as authorName,
              (SELECT COUNT(*) FROM forum_replies WHERE forum_replies.post_id = forum_posts.id) as replyCount
       FROM forum_posts JOIN users ON users.id = forum_posts.author_id
       WHERE forum_posts.id = ?`
    )
    .get(postId) as unknown as ForumPost | undefined;
  return row ?? null;
}

export function listReplies(postId: string): ForumReply[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT forum_replies.id as id, forum_replies.body as body, forum_replies.created_at as createdAt,
              forum_replies.edited_at as editedAt, forum_replies.author_id as authorId,
              users.display_name as authorName
       FROM forum_replies JOIN users ON users.id = forum_replies.author_id
       WHERE forum_replies.post_id = ?
       ORDER BY forum_replies.created_at ASC`
    )
    .all(postId) as unknown as ForumReply[];
}

export async function createPost(
  authorId: string,
  formData: FormData
): Promise<{ ok: boolean; error?: string }> {
  "use server";
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!title || !body) {
    return { ok: false, error: "Title and body are both required." };
  }
  const db = getDb();
  db.prepare("INSERT INTO forum_posts (id, author_id, title, body, created_at) VALUES (?, ?, ?, ?, ?)").run(
    randomUUID(),
    authorId,
    title,
    body,
    new Date().toISOString()
  );
  revalidatePath("/community");
  return { ok: true };
}

export async function updatePost(
  userId: string,
  postId: string,
  formData: FormData
): Promise<{ ok: boolean; error?: string }> {
  "use server";
  const db = getDb();
  const post = db.prepare("SELECT author_id FROM forum_posts WHERE id = ?").get(postId) as
    | { author_id: string }
    | undefined;
  if (!post) return { ok: false, error: "Post not found." };
  if (post.author_id !== userId) return { ok: false, error: "Not authorized." };

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!title || !body) return { ok: false, error: "Title and body are both required." };

  db.prepare("UPDATE forum_posts SET title = ?, body = ?, edited_at = ? WHERE id = ?").run(
    title,
    body,
    new Date().toISOString(),
    postId
  );
  revalidatePath(`/community/${postId}`);
  revalidatePath("/community");
  return { ok: true };
}

export async function deletePost(
  userId: string,
  isAdmin: boolean,
  postId: string
): Promise<{ ok: boolean; error?: string }> {
  "use server";
  const db = getDb();
  const post = db.prepare("SELECT author_id FROM forum_posts WHERE id = ?").get(postId) as
    | { author_id: string }
    | undefined;
  if (!post) return { ok: false, error: "Post not found." };
  if (post.author_id !== userId && !isAdmin) return { ok: false, error: "Not authorized." };

  db.prepare("DELETE FROM forum_replies WHERE post_id = ?").run(postId);
  db.prepare("DELETE FROM forum_posts WHERE id = ?").run(postId);
  revalidatePath("/community");
  return { ok: true };
}

export async function createReply(
  authorId: string,
  postId: string,
  formData: FormData
): Promise<{ ok: boolean; error?: string }> {
  "use server";
  const body = String(formData.get("body") ?? "").trim();
  if (!body) {
    return { ok: false, error: "Reply cannot be empty." };
  }
  const db = getDb();
  db.prepare("INSERT INTO forum_replies (id, post_id, author_id, body, created_at) VALUES (?, ?, ?, ?, ?)").run(
    randomUUID(),
    postId,
    authorId,
    body,
    new Date().toISOString()
  );
  revalidatePath(`/community/${postId}`);
  return { ok: true };
}

export async function updateReply(
  userId: string,
  replyId: string,
  formData: FormData
): Promise<{ ok: boolean; error?: string }> {
  "use server";
  const db = getDb();
  const reply = db.prepare("SELECT author_id, post_id FROM forum_replies WHERE id = ?").get(replyId) as
    | { author_id: string; post_id: string }
    | undefined;
  if (!reply) return { ok: false, error: "Reply not found." };
  if (reply.author_id !== userId) return { ok: false, error: "Not authorized." };

  const body = String(formData.get("body") ?? "").trim();
  if (!body) return { ok: false, error: "Reply cannot be empty." };

  db.prepare("UPDATE forum_replies SET body = ?, edited_at = ? WHERE id = ?").run(
    body,
    new Date().toISOString(),
    replyId
  );
  revalidatePath(`/community/${reply.post_id}`);
  return { ok: true };
}

export async function deleteReply(
  userId: string,
  isAdmin: boolean,
  replyId: string
): Promise<{ ok: boolean; error?: string }> {
  "use server";
  const db = getDb();
  const reply = db.prepare("SELECT author_id, post_id FROM forum_replies WHERE id = ?").get(replyId) as
    | { author_id: string; post_id: string }
    | undefined;
  if (!reply) return { ok: false, error: "Reply not found." };
  if (reply.author_id !== userId && !isAdmin) return { ok: false, error: "Not authorized." };

  db.prepare("DELETE FROM forum_replies WHERE id = ?").run(replyId);
  revalidatePath(`/community/${reply.post_id}`);
  return { ok: true };
}
