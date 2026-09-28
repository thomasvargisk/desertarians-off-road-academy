import { revalidatePath } from "next/cache";
import { getDb, getAvatarBucket } from "@/lib/db/client";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

const ALLOWED_AVATAR_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

export async function updateProfile(userId: string, formData: FormData): Promise<ActionResult> {
  "use server";
  const displayName = String(formData.get("displayName") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  if (!displayName) {
    return { ok: false, error: "Display name cannot be empty." };
  }
  const db = await getDb();
  await db.prepare("UPDATE users SET display_name = ?, bio = ? WHERE id = ?").bind(displayName, bio, userId).run();
  revalidatePath("/settings");
  revalidatePath(`/members/${userId}`);
  return { ok: true };
}

export async function changePassword(userId: string, formData: FormData): Promise<ActionResult> {
  "use server";
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  if (newPassword.length < 8) {
    return { ok: false, error: "New password must be at least 8 characters." };
  }

  const db = await getDb();
  const row = await db
    .prepare("SELECT password_hash, password_salt FROM users WHERE id = ?")
    .bind(userId)
    .first<{ password_hash: string; password_salt: string }>();
  if (!row) return { ok: false, error: "Account not found." };

  const valid = await verifyPassword(currentPassword, row.password_salt, row.password_hash);
  if (!valid) return { ok: false, error: "Current password is incorrect." };

  const { hash, salt } = await hashPassword(newPassword);
  await db.prepare("UPDATE users SET password_hash = ?, password_salt = ? WHERE id = ?").bind(hash, salt, userId).run();
  revalidatePath("/settings");
  return { ok: true };
}

export async function updateAvatar(userId: string, formData: FormData): Promise<ActionResult> {
  "use server";
  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Please choose an image file." };
  }
  if (!ALLOWED_AVATAR_TYPES.has(file.type)) {
    return { ok: false, error: "Only PNG, JPEG, or WEBP images are allowed." };
  }
  if (file.size > MAX_AVATAR_BYTES) {
    return { ok: false, error: "Image must be smaller than 2MB." };
  }

  const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const key = `${userId}.${extension}`;
  const bucket = await getAvatarBucket();
  await bucket.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type } });

  const db = await getDb();
  await db.prepare("UPDATE users SET avatar_path = ? WHERE id = ?").bind(`/api/avatars/${key}`, userId).run();
  revalidatePath("/settings");
  revalidatePath(`/members/${userId}`);
  return { ok: true };
}
