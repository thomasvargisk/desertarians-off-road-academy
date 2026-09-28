import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db/client";

export async function rsvpToDrive(userId: string, driveId: string): Promise<{ ok: boolean; error?: string }> {
  "use server";
  const db = await getDb();
  const drive = await db
    .prepare("SELECT id, capacity FROM drives WHERE id = ?")
    .bind(driveId)
    .first<{ id: string; capacity: number }>();
  if (!drive) return { ok: false, error: "Drive not found." };

  const existing = await db
    .prepare("SELECT id FROM drive_rsvps WHERE drive_id = ? AND user_id = ?")
    .bind(driveId, userId)
    .first();
  if (existing) return { ok: false, error: "You have already RSVP'd to this drive." };

  const count = await db
    .prepare("SELECT COUNT(*) as c FROM drive_rsvps WHERE drive_id = ?")
    .bind(driveId)
    .first<{ c: number }>();
  if (!count || count.c >= drive.capacity) return { ok: false, error: "This drive is at capacity." };

  await db
    .prepare("INSERT INTO drive_rsvps (id, drive_id, user_id, created_at) VALUES (?, ?, ?, ?)")
    .bind(crypto.randomUUID(), driveId, userId, new Date().toISOString())
    .run();
  revalidatePath(`/drives/${driveId}`);
  revalidatePath("/drives");
  return { ok: true };
}

export async function hasUserRsvped(userId: string, driveId: string): Promise<boolean> {
  const db = await getDb();
  const row = await db
    .prepare("SELECT id FROM drive_rsvps WHERE drive_id = ? AND user_id = ?")
    .bind(driveId, userId)
    .first();
  return Boolean(row);
}

export async function listDrives(): Promise<DriveDetail[]> {
  const db = await getDb();
  const { results } = await db
    .prepare(
      `SELECT drives.*, (SELECT COUNT(*) FROM drive_rsvps WHERE drive_rsvps.drive_id = drives.id) as rsvp_count
       FROM drives ORDER BY drive_date ASC`
    )
    .all<DriveDetail>();
  return results;
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

export async function getDrive(driveId: string): Promise<DriveDetail | null> {
  const db = await getDb();
  const row = await db
    .prepare(
      `SELECT drives.*, (SELECT COUNT(*) FROM drive_rsvps WHERE drive_rsvps.drive_id = drives.id) as rsvp_count
       FROM drives WHERE drives.id = ?`
    )
    .bind(driveId)
    .first<DriveDetail>();
  return row ?? null;
}
