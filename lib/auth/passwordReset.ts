import { randomBytes } from "node:crypto";
import { getDb } from "@/lib/db/client";
import { hashPassword } from "@/lib/auth/password";

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
export function requestPasswordReset(email: string): RequestResetResult {
  const db = getDb();
  const normalized = email.trim().toLowerCase();
  const user = db.prepare("SELECT id FROM users WHERE email = ?").get(normalized) as { id: string } | undefined;
  if (!user) {
    // Do not reveal whether the account exists.
    return { ok: true };
  }

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + RESET_DURATION_MS).toISOString();
  db.prepare("UPDATE users SET password_reset_token = ?, password_reset_expires_at = ? WHERE id = ?").run(
    token,
    expiresAt,
    user.id
  );

  return { ok: true, resetLink: `/reset-password?token=${token}` };
}

export interface ResetPasswordResult {
  ok: boolean;
  error?: string;
}

export function resetPassword(token: string, newPassword: string): ResetPasswordResult {
  if (newPassword.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters." };
  }
  const db = getDb();
  const user = db
    .prepare("SELECT id, password_reset_expires_at as expiresAt FROM users WHERE password_reset_token = ?")
    .get(token) as unknown as { id: string; expiresAt: string | null } | undefined;

  if (!user || !user.expiresAt || Date.parse(user.expiresAt) <= Date.now()) {
    return { ok: false, error: "This reset link is invalid or has expired." };
  }

  const { hash, salt } = hashPassword(newPassword);
  db.prepare(
    "UPDATE users SET password_hash = ?, password_salt = ?, password_reset_token = NULL, password_reset_expires_at = NULL WHERE id = ?"
  ).run(hash, salt, user.id);

  return { ok: true };
}
