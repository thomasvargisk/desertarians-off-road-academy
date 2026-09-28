import { getDb } from "@/lib/db/client";
import { hashPassword } from "@/lib/auth/password";
import { destroyAllUserSessions } from "@/lib/auth/session";

const RESET_DURATION_MS = 60 * 60 * 1000; // 1 hour

export interface RequestResetResult {
  ok: boolean;
  error?: string;
  resetLink?: string;
}

/**
 * Generates a reset token and stores it against the account. There is no email/SMTP provider
 * configured yet, so the link is returned directly to the caller instead of being emailed --
 * this is the same "no external provider chosen" boundary as the payment/subscription backend.
 */
export async function requestPasswordReset(email: string): Promise<RequestResetResult> {
  const db = await getDb();
  const normalized = email.trim().toLowerCase();
  const user = await db.prepare("SELECT id FROM users WHERE email = ?").bind(normalized).first<{ id: string }>();
  if (!user) {
    // Do not reveal whether the account exists.
    return { ok: true };
  }

  const token = crypto.randomUUID() + crypto.randomUUID();
  const expiresAt = new Date(Date.now() + RESET_DURATION_MS).toISOString();
  await db
    .prepare("UPDATE users SET password_reset_token = ?, password_reset_expires_at = ? WHERE id = ?")
    .bind(token, expiresAt, user.id)
    .run();

  return { ok: true, resetLink: `/reset-password?token=${token}` };
}

export interface ResetPasswordResult {
  ok: boolean;
  error?: string;
}

export async function resetPassword(token: string, newPassword: string): Promise<ResetPasswordResult> {
  if (newPassword.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters." };
  }
  const db = await getDb();
  const user = await db
    .prepare("SELECT id, password_reset_expires_at as expiresAt FROM users WHERE password_reset_token = ?")
    .bind(token)
    .first<{ id: string; expiresAt: string | null }>();

  if (!user || !user.expiresAt || Date.parse(user.expiresAt) <= Date.now()) {
    return { ok: false, error: "This reset link is invalid or has expired." };
  }

  const { hash, salt } = await hashPassword(newPassword);
  await db
    .prepare(
      "UPDATE users SET password_hash = ?, password_salt = ?, password_reset_token = NULL, password_reset_expires_at = NULL WHERE id = ?"
    )
    .bind(hash, salt, user.id)
    .run();
  await destroyAllUserSessions(user.id);

  return { ok: true };
}
