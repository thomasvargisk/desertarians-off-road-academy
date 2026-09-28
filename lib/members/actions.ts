import { getDb } from "@/lib/db/client";

export interface MemberProfile {
  id: string;
  displayName: string;
  bio: string | null;
  avatarPath: string | null;
  memberSince: string;
  drivesAttended: number;
  campingTripsAttended: number;
  coursesEnrolled: number;
  forumPostCount: number;
}

export async function getProfile(userId: string): Promise<MemberProfile | null> {
  const db = await getDb();
  const user = await db
    .prepare(
      "SELECT id, display_name as displayName, bio, avatar_path as avatarPath, created_at as memberSince FROM users WHERE id = ?"
    )
    .bind(userId)
    .first<{ id: string; displayName: string; bio: string | null; avatarPath: string | null; memberSince: string }>();
  if (!user) return null;

  const [drivesAttended, campingTripsAttended, coursesEnrolled, forumPostCount] = await Promise.all([
    db.prepare("SELECT COUNT(*) as c FROM drive_rsvps WHERE user_id = ?").bind(userId).first<{ c: number }>(),
    db.prepare("SELECT COUNT(*) as c FROM camping_rsvps WHERE user_id = ?").bind(userId).first<{ c: number }>(),
    db.prepare("SELECT COUNT(*) as c FROM academy_enrollments WHERE user_id = ?").bind(userId).first<{ c: number }>(),
    db.prepare("SELECT COUNT(*) as c FROM forum_posts WHERE author_id = ?").bind(userId).first<{ c: number }>(),
  ]);

  return {
    id: user.id,
    displayName: user.displayName,
    bio: user.bio,
    avatarPath: user.avatarPath,
    memberSince: user.memberSince,
    drivesAttended: drivesAttended?.c ?? 0,
    campingTripsAttended: campingTripsAttended?.c ?? 0,
    coursesEnrolled: coursesEnrolled?.c ?? 0,
    forumPostCount: forumPostCount?.c ?? 0,
  };
}
