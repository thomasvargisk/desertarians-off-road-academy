import { getDb } from "@/lib/db/client";

export interface AdminUserRow {
  id: string;
  displayName: string;
  email: string;
  isAdmin: boolean;
  createdAt: string;
}

export async function listAllUsers(): Promise<AdminUserRow[]> {
  const db = await getDb();
  const { results } = await db
    .prepare(
      `SELECT id, display_name as displayName, email, is_admin as isAdmin, created_at as createdAt
       FROM users ORDER BY created_at DESC`
    )
    .all<{ id: string; displayName: string; email: string; isAdmin: number; createdAt: string }>();
  return results.map((row) => ({ ...row, isAdmin: Boolean(row.isAdmin) }));
}
