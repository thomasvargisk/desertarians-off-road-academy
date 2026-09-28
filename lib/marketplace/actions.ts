import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db/client";

export interface MarketplaceListing {
  id: string;
  title: string;
  description: string;
  price_aed: number;
  category: string;
  status: string;
  createdAt: string;
  sellerId: string;
  sellerName: string;
}

export function listListings(): MarketplaceListing[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT marketplace_listings.id as id, marketplace_listings.title as title,
              marketplace_listings.description as description, marketplace_listings.price_aed as price_aed,
              marketplace_listings.category as category, marketplace_listings.status as status,
              marketplace_listings.created_at as createdAt, marketplace_listings.seller_id as sellerId,
              users.display_name as sellerName
       FROM marketplace_listings JOIN users ON users.id = marketplace_listings.seller_id
       WHERE marketplace_listings.status = 'active'
       ORDER BY marketplace_listings.created_at DESC`
    )
    .all() as unknown as MarketplaceListing[];
}

export function getListing(listingId: string): MarketplaceListing | null {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT marketplace_listings.id as id, marketplace_listings.title as title,
              marketplace_listings.description as description, marketplace_listings.price_aed as price_aed,
              marketplace_listings.category as category, marketplace_listings.status as status,
              marketplace_listings.created_at as createdAt, marketplace_listings.seller_id as sellerId,
              users.display_name as sellerName
       FROM marketplace_listings JOIN users ON users.id = marketplace_listings.seller_id
       WHERE marketplace_listings.id = ?`
    )
    .get(listingId) as unknown as MarketplaceListing | undefined;
  return row ?? null;
}

export async function createListing(sellerId: string, formData: FormData): Promise<{ ok: boolean; error?: string }> {
  "use server";
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const priceRaw = String(formData.get("price") ?? "");
  const price = Number(priceRaw);

  if (!title || !description || !category) {
    return { ok: false, error: "Title, description, and category are required." };
  }
  if (!Number.isFinite(price) || price < 0) {
    return { ok: false, error: "Price must be a valid non-negative number." };
  }

  const db = getDb();
  db.prepare(
    "INSERT INTO marketplace_listings (id, seller_id, title, description, price_aed, category, status, created_at) VALUES (?, ?, ?, ?, ?, ?, 'active', ?)"
  ).run(randomUUID(), sellerId, title, description, price, category, new Date().toISOString());
  revalidatePath("/marketplace");
  return { ok: true };
}

export async function deleteListing(
  userId: string,
  isAdmin: boolean,
  listingId: string
): Promise<{ ok: boolean; error?: string }> {
  "use server";
  const db = getDb();
  const listing = db.prepare("SELECT seller_id FROM marketplace_listings WHERE id = ?").get(listingId) as
    | { seller_id: string }
    | undefined;
  if (!listing) return { ok: false, error: "Listing not found." };
  if (listing.seller_id !== userId && !isAdmin) {
    return { ok: false, error: "Not authorized." };
  }
  db.prepare("UPDATE marketplace_listings SET status = 'removed' WHERE id = ?").run(listingId);
  revalidatePath("/marketplace");
  revalidatePath(`/marketplace/${listingId}`);
  return { ok: true };
}
