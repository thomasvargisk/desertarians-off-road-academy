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

export async function listTrips(): Promise<CampingTrip[]> {
  const db = await getDb();
  const { results } = await db
    .prepare(
      `SELECT camping_trips.*,
              (SELECT COUNT(*) FROM camping_rsvps WHERE camping_rsvps.trip_id = camping_trips.id) as rsvp_count
       FROM camping_trips ORDER BY trip_date ASC`
    )
    .all<CampingTrip>();
  return results;
}

export async function getTrip(tripId: string): Promise<CampingTrip | null> {
  const db = await getDb();
  const row = await db
    .prepare(
      `SELECT camping_trips.*,
              (SELECT COUNT(*) FROM camping_rsvps WHERE camping_rsvps.trip_id = camping_trips.id) as rsvp_count
       FROM camping_trips WHERE camping_trips.id = ?`
    )
    .bind(tripId)
    .first<CampingTrip>();
  return row ?? null;
}

export async function hasUserRsvped(userId: string, tripId: string): Promise<boolean> {
  const db = await getDb();
  const row = await db
    .prepare("SELECT id FROM camping_rsvps WHERE trip_id = ? AND user_id = ?")
    .bind(tripId, userId)
    .first();
  return Boolean(row);
}

export async function rsvpToTrip(userId: string, tripId: string): Promise<{ ok: boolean; error?: string }> {
  "use server";
  const db = await getDb();
  const trip = await getTrip(tripId);
  if (!trip) return { ok: false, error: "Trip not found." };
  if (await hasUserRsvped(userId, tripId)) return { ok: false, error: "You have already RSVP'd." };
  if (trip.rsvp_count >= trip.capacity) return { ok: false, error: "This trip is at capacity." };

  await db
    .prepare("INSERT INTO camping_rsvps (id, trip_id, user_id, created_at) VALUES (?, ?, ?, ?)")
    .bind(crypto.randomUUID(), tripId, userId, new Date().toISOString())
    .run();
  revalidatePath(`/camping/${tripId}`);
  revalidatePath("/camping");
  return { ok: true };
}
