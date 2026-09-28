import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db/client";
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
  const db = getDb();
  db.prepare("UPDATE users SET display_name = ?, bio = ? WHERE id = ?").run(displayName, bio, userId);
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

  const db = getDb();
  const row = db.prepare("SELECT password_hash, password_salt FROM users WHERE id = ?").get(userId) as unknown as
    | { password_hash: string; password_salt: string }
    | undefined;
  if (!row) return { ok: false, error: "Account not found." };

  const valid = verifyPassword(currentPassword, row.password_salt, row.password_hash);
  if (!valid) return { ok: false, error: "Current password is incorrect." };

  const { hash, salt } = hashPassword(newPassword);
  db.prepare("UPDATE users SET password_hash = ?, password_salt = ? WHERE id = ?").run(hash, salt, userId);
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
  const fileName = `${userId}.${extension}`;
  const uploadsDir = path.join(process.cwd(), "public", "uploads", "avatars");
  await mkdir(uploadsDir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadsDir, fileName), buffer);

  const db = getDb();
  db.prepare("UPDATE users SET avatar_path = ? WHERE id = ?").run(`/uploads/avatars/${fileName}`, userId);
  revalidatePath("/settings");
  revalidatePath(`/members/${userId}`);
  return { ok: true };
}
