import { getDb } from "@/lib/db/client";

export interface CommunityStats {
  totalMembers: number;
  totalDrives: number;
  totalForumPosts: number;
  totalMarketplaceListings: number;
}

export async function getCommunityStats(): Promise<CommunityStats> {
  const db = await getDb();
  const [members, drives, posts, listings] = await Promise.all([
    db.prepare("SELECT COUNT(*) as c FROM users").first<{ c: number }>(),
    db.prepare("SELECT COUNT(*) as c FROM drives").first<{ c: number }>(),
    db.prepare("SELECT COUNT(*) as c FROM forum_posts").first<{ c: number }>(),
    db.prepare("SELECT COUNT(*) as c FROM marketplace_listings WHERE status = 'active'").first<{ c: number }>(),
  ]);
  return {
    totalMembers: members?.c ?? 0,
    totalDrives: drives?.c ?? 0,
    totalForumPosts: posts?.c ?? 0,
    totalMarketplaceListings: listings?.c ?? 0,
  };
}
