import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db/client";

export async function rsvpToDrive(userId: string, driveId: string): Promise<{ ok: boolean; error?: string }> {
  "use server";
  const db = getDb();
  const drive = db.prepare("SELECT id, capacity FROM drives WHERE id = ?").get(driveId) as
    | { id: string; capacity: number }
    | undefined;
  if (!drive) return { ok: false, error: "Drive not found." };

  const existing = db.prepare("SELECT id FROM drive_rsvps WHERE drive_id = ? AND user_id = ?").get(driveId, userId);
  if (existing) return { ok: false, error: "You have already RSVP'd to this drive." };

  const count = db.prepare("SELECT COUNT(*) as c FROM drive_rsvps WHERE drive_id = ?").get(driveId) as { c: number };
  if (count.c >= drive.capacity) return { ok: false, error: "This drive is at capacity." };

  db.prepare("INSERT INTO drive_rsvps (id, drive_id, user_id, created_at) VALUES (?, ?, ?, ?)").run(
    randomUUID(),
    driveId,
    userId,
    new Date().toISOString()
  );
  revalidatePath(`/drives/${driveId}`);
  revalidatePath("/drives");
  return { ok: true };
}

export function hasUserRsvped(userId: string, driveId: string): boolean {
  const db = getDb();
  const row = db.prepare("SELECT id FROM drive_rsvps WHERE drive_id = ? AND user_id = ?").get(driveId, userId);
  return Boolean(row);
}

export interface DriveDetail {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  drive_date: string;
  public_area: string;
  capacity: number;
  rsvp_count: number;
}

export function getDrive(driveId: string): DriveDetail | null {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT drives.*, (SELECT COUNT(*) FROM drive_rsvps WHERE drive_rsvps.drive_id = drives.id) as rsvp_count
       FROM drives WHERE drives.id = ?`
    )
    .get(driveId) as DriveDetail | undefined;
  return row ?? null;
}
