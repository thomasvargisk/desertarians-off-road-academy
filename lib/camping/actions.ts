import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db/client";

export interface CampingTrip {
  id: string;
  title: string;
  description: string;
  tier: string;
  trip_date: string;
  public_area: string;
  capacity: number;
  rsvp_count: number;
}

export function listTrips(): CampingTrip[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT camping_trips.*,
              (SELECT COUNT(*) FROM camping_rsvps WHERE camping_rsvps.trip_id = camping_trips.id) as rsvp_count
       FROM camping_trips ORDER BY trip_date ASC`
    )
    .all() as unknown as CampingTrip[];
}

export function getTrip(tripId: string): CampingTrip | null {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT camping_trips.*,
              (SELECT COUNT(*) FROM camping_rsvps WHERE camping_rsvps.trip_id = camping_trips.id) as rsvp_count
       FROM camping_trips WHERE camping_trips.id = ?`
    )
    .get(tripId) as unknown as CampingTrip | undefined;
  return row ?? null;
}

export function hasUserRsvped(userId: string, tripId: string): boolean {
  const db = getDb();
  const row = db.prepare("SELECT id FROM camping_rsvps WHERE trip_id = ? AND user_id = ?").get(tripId, userId);
  return Boolean(row);
}

export async function rsvpToTrip(userId: string, tripId: string): Promise<{ ok: boolean; error?: string }> {
  "use server";
  const db = getDb();
  const trip = getTrip(tripId);
  if (!trip) return { ok: false, error: "Trip not found." };
  if (hasUserRsvped(userId, tripId)) return { ok: false, error: "You have already RSVP'd." };
  if (trip.rsvp_count >= trip.capacity) return { ok: false, error: "This trip is at capacity." };

  db.prepare("INSERT INTO camping_rsvps (id, trip_id, user_id, created_at) VALUES (?, ?, ?, ?)").run(
    randomUUID(),
    tripId,
    userId,
    new Date().toISOString()
  );
  revalidatePath(`/camping/${tripId}`);
  revalidatePath("/camping");
  return { ok: true };
}
