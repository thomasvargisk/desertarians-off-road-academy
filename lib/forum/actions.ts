import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db/client";

export const FORUM_CATEGORIES = [
  "Announcements",
  "General Discussions",
  "Off-road Advice",
  "Vehicle Garage",
  "Trip Reports",
] as const;

export interface ForumPost {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  editedAt: string | null;
  authorId: string;
  authorName: string;
  replyCount: number;
  category: string;
  viewCount: number;
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

export async function listPosts(
  query?: string,
  page = 1,
  category?: string
): Promise<{ posts: ForumPost[]; totalCount: number }> {
  const db = await getDb();
  const offset = (page - 1) * POSTS_PER_PAGE;

  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (query && query.trim()) {
    const like = `%${query.trim()}%`;
    conditions.push("(forum_posts.title LIKE ? OR forum_posts.body LIKE ?)");
    params.push(like, like);
  }
  if (category && category !== "All") {
    conditions.push("forum_posts.category = ?");
    params.push(category);
  }
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const { results: posts } = await db
    .prepare(
      `SELECT forum_posts.id as id, forum_posts.title as title, forum_posts.body as body,
              forum_posts.created_at as createdAt, forum_posts.edited_at as editedAt,
              forum_posts.category as category, forum_posts.view_count as viewCount,
              forum_posts.author_id as authorId, users.display_name as authorName,
              (SELECT COUNT(*) FROM forum_replies WHERE forum_replies.post_id = forum_posts.id) as replyCount
       FROM forum_posts JOIN users ON users.id = forum_posts.author_id
       ${whereClause}
       ORDER BY forum_posts.created_at DESC
       LIMIT ? OFFSET ?`
    )
    .bind(...params, POSTS_PER_PAGE, offset)
    .all<ForumPost>();
  const countRow = await db
    .prepare(`SELECT COUNT(*) as c FROM forum_posts ${whereClause}`)
    .bind(...params)
    .first<{ c: number }>();
  return { posts, totalCount: countRow?.c ?? 0 };
}

export async function getPost(postId: string): Promise<ForumPost | null> {
  const db = await getDb();
  const row = await db
    .prepare(
      `SELECT forum_posts.id as id, forum_posts.title as title, forum_posts.body as body,
              forum_posts.created_at as createdAt, forum_posts.edited_at as editedAt,
              forum_posts.category as category, forum_posts.view_count as viewCount,
              forum_posts.author_id as authorId, users.display_name as authorName,
              (SELECT COUNT(*) FROM forum_replies WHERE forum_replies.post_id = forum_posts.id) as replyCount
       FROM forum_posts JOIN users ON users.id = forum_posts.author_id
       WHERE forum_posts.id = ?`
    )
    .bind(postId)
    .first<ForumPost>();
  return row ?? null;
}

export async function listReplies(postId: string): Promise<ForumReply[]> {
  const db = await getDb();
  const { results } = await db
    .prepare(
      `SELECT forum_replies.id as id, forum_replies.body as body, forum_replies.created_at as createdAt,
              forum_replies.edited_at as editedAt, forum_replies.author_id as authorId,
              users.display_name as authorName
       FROM forum_replies JOIN users ON users.id = forum_replies.author_id
       WHERE forum_replies.post_id = ?
       ORDER BY forum_replies.created_at ASC`
    )
    .bind(postId)
    .all<ForumReply>();
  return results;
}

export async function createPost(
  authorId: string,
  formData: FormData
): Promise<{ ok: boolean; error?: string }> {
  "use server";
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim() || "General Discussions";
  if (!title || !body) {
    return { ok: false, error: "Title and body are both required." };
  }
  const db = await getDb();
  await db
    .prepare("INSERT INTO forum_posts (id, author_id, title, body, category, created_at) VALUES (?, ?, ?, ?, ?, ?)")
    .bind(crypto.randomUUID(), authorId, title, body, category, new Date().toISOString())
    .run();
  revalidatePath("/community");
  return { ok: true };
}

export async function incrementViewCount(postId: string): Promise<void> {
  "use server";
  const db = await getDb();
  await db.prepare("UPDATE forum_posts SET view_count = view_count + 1 WHERE id = ?").bind(postId).run();
}

export async function updatePost(
  userId: string,
  postId: string,
  formData: FormData
): Promise<{ ok: boolean; error?: string }> {
  "use server";
  const db = await getDb();
  const post = await db
    .prepare("SELECT author_id as authorId FROM forum_posts WHERE id = ?")
    .bind(postId)
    .first<{ authorId: string }>();
  if (!post) return { ok: false, error: "Post not found." };
  if (post.authorId !== userId) return { ok: false, error: "Not authorized." };

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim() || "General Discussions";
  if (!title || !body) return { ok: false, error: "Title and body are both required." };

  await db
    .prepare("UPDATE forum_posts SET title = ?, body = ?, category = ?, edited_at = ? WHERE id = ?")
    .bind(title, body, category, new Date().toISOString(), postId)
    .run();
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
  const db = await getDb();
  const post = await db
    .prepare("SELECT author_id as authorId FROM forum_posts WHERE id = ?")
    .bind(postId)
    .first<{ authorId: string }>();
  if (!post) return { ok: false, error: "Post not found." };
  if (post.authorId !== userId && !isAdmin) return { ok: false, error: "Not authorized." };

  await db.prepare("DELETE FROM forum_replies WHERE post_id = ?").bind(postId).run();
  await db.prepare("DELETE FROM forum_posts WHERE id = ?").bind(postId).run();
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
  const db = await getDb();
  await db
    .prepare("INSERT INTO forum_replies (id, post_id, author_id, body, created_at) VALUES (?, ?, ?, ?, ?)")
    .bind(crypto.randomUUID(), postId, authorId, body, new Date().toISOString())
    .run();
  revalidatePath(`/community/${postId}`);
  return { ok: true };
}

export async function updateReply(
  userId: string,
  replyId: string,
  formData: FormData
): Promise<{ ok: boolean; error?: string }> {
  "use server";
  const db = await getDb();
  const reply = await db
    .prepare("SELECT author_id as authorId, post_id as postId FROM forum_replies WHERE id = ?")
    .bind(replyId)
    .first<{ authorId: string; postId: string }>();
  if (!reply) return { ok: false, error: "Reply not found." };
  if (reply.authorId !== userId) return { ok: false, error: "Not authorized." };

  const body = String(formData.get("body") ?? "").trim();
  if (!body) return { ok: false, error: "Reply cannot be empty." };

  await db
    .prepare("UPDATE forum_replies SET body = ?, edited_at = ? WHERE id = ?")
    .bind(body, new Date().toISOString(), replyId)
    .run();
  revalidatePath(`/community/${reply.postId}`);
  return { ok: true };
}

export async function deleteReply(
  userId: string,
  isAdmin: boolean,
  replyId: string
): Promise<{ ok: boolean; error?: string }> {
  "use server";
  const db = await getDb();
  const reply = await db
    .prepare("SELECT author_id as authorId, post_id as postId FROM forum_replies WHERE id = ?")
    .bind(replyId)
    .first<{ authorId: string; postId: string }>();
  if (!reply) return { ok: false, error: "Reply not found." };
  if (reply.authorId !== userId && !isAdmin) return { ok: false, error: "Not authorized." };

  await db.prepare("DELETE FROM forum_replies WHERE id = ?").bind(replyId).run();
  revalidatePath(`/community/${reply.postId}`);
  return { ok: true };
}
