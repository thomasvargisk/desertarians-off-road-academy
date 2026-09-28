"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db/client";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, destroySession } from "@/lib/auth/session";
import { isRateLimited, recordFailedAttempt, clearAttempts } from "@/lib/rateLimit";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

interface UserRow {
  id: string;
  email: string;
  display_name: string;
  password_hash: string;
  password_salt: string;
}

export async function signUp(formData: FormData): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const displayName = String(formData.get("displayName") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !displayName || !password) {
    return { ok: false, error: "Email, display name, and password are all required." };
  }
  if (password.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters." };
  }

  const db = getDb();
  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (existing) {
    return { ok: false, error: "An account with that email already exists." };
  }

  const { hash, salt } = hashPassword(password);
  const id = randomUUID();
  db.prepare(
    "INSERT INTO users (id, email, display_name, password_hash, password_salt, created_at) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(id, email, displayName, hash, salt, new Date().toISOString());

  return { ok: true };
}

/**
 * Verifies email/password against the real stored hash. Returns the user id on success so the
 * caller can establish a session -- this function itself never touches cookies.
 */
export async function verifyCredentials(
  email: string,
  password: string
): Promise<{ ok: true; userId: string } | { ok: false; error: string }> {
  const db = getDb();
  const row = db
    .prepare("SELECT id, email, display_name, password_hash, password_salt FROM users WHERE email = ?")
    .get(email.trim().toLowerCase()) as UserRow | undefined;

  if (!row) return { ok: false, error: "Invalid email or password." };
  const valid = verifyPassword(password, row.password_salt, row.password_hash);
  if (!valid) return { ok: false, error: "Invalid email or password." };
  return { ok: true, userId: row.id };
}

/** Form action for the signup page: creates the account, starts a real session, redirects home. */
export async function signUpFormAction(formData: FormData): Promise<void> {
  const result = await signUp(formData);
  if (!result.ok) {
    redirect(`/signup?error=${encodeURIComponent(result.error ?? "Sign up failed.")}`);
  }
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const verified = await verifyCredentials(email, password);
  if (!verified.ok) {
    redirect(`/login?error=${encodeURIComponent("Account created -- please log in.")}`);
  }
  await createSession(verified.userId);
  redirect("/community");
}

/** Form action for the login page: verifies credentials, starts a real session, redirects. */
export async function logInFormAction(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (isRateLimited(email)) {
    redirect(`/login?error=${encodeURIComponent("Too many failed attempts. Try again in a few minutes.")}`);
  }

  const verified = await verifyCredentials(email, password);
  if (!verified.ok) {
    recordFailedAttempt(email);
    redirect(`/login?error=${encodeURIComponent(verified.error)}`);
  }
  clearAttempts(email);
  await createSession(verified.userId);
  redirect("/community");
}

/** Form action for logout: destroys the real session and redirects home. */
export async function logOutFormAction(): Promise<void> {
  await destroySession();
  redirect("/");
}
