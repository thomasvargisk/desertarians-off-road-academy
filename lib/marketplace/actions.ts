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

export async function listListings(): Promise<MarketplaceListing[]> {
  const db = await getDb();
  const { results } = await db
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
    .all<MarketplaceListing>();
  return results;
}

export async function getListing(listingId: string): Promise<MarketplaceListing | null> {
  const db = await getDb();
  const row = await db
    .prepare(
      `SELECT marketplace_listings.id as id, marketplace_listings.title as title,
              marketplace_listings.description as description, marketplace_listings.price_aed as price_aed,
              marketplace_listings.category as category, marketplace_listings.status as status,
              marketplace_listings.created_at as createdAt, marketplace_listings.seller_id as sellerId,
              users.display_name as sellerName
       FROM marketplace_listings JOIN users ON users.id = marketplace_listings.seller_id
       WHERE marketplace_listings.id = ?`
    )
    .bind(listingId)
    .first<MarketplaceListing>();
  return row ?? null;
}

export async function createListing(
  sellerId: string,
  formData: FormData
): Promise<{ ok: boolean; error?: string; id?: string }> {
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

  const id = crypto.randomUUID();
  const db = await getDb();
  await db
    .prepare(
      "INSERT INTO marketplace_listings (id, seller_id, title, description, price_aed, category, status, created_at) VALUES (?, ?, ?, ?, ?, ?, 'active', ?)"
    )
    .bind(id, sellerId, title, description, price, category, new Date().toISOString())
    .run();
  revalidatePath("/marketplace");
  return { ok: true, id };
}

export async function deleteListing(
  userId: string,
  isAdmin: boolean,
  listingId: string
): Promise<{ ok: boolean; error?: string }> {
  "use server";
  const db = await getDb();
  const listing = await db
    .prepare("SELECT seller_id as sellerId FROM marketplace_listings WHERE id = ?")
    .bind(listingId)
    .first<{ sellerId: string }>();
  if (!listing) return { ok: false, error: "Listing not found." };
  if (listing.sellerId !== userId && !isAdmin) {
    return { ok: false, error: "Not authorized." };
  }
  await db.prepare("UPDATE marketplace_listings SET status = 'removed' WHERE id = ?").bind(listingId).run();
  revalidatePath("/marketplace");
  revalidatePath(`/marketplace/${listingId}`);
  return { ok: true };
}
