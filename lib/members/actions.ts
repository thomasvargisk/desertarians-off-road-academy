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

export function getProfile(userId: string): MemberProfile | null {
  const db = getDb();
  const user = db
    .prepare("SELECT id, display_name as displayName, bio, avatar_path as avatarPath, created_at as memberSince FROM users WHERE id = ?")
    .get(userId) as unknown as
    | { id: string; displayName: string; bio: string | null; avatarPath: string | null; memberSince: string }
    | undefined;
  if (!user) return null;

  const drivesAttended = (
    db.prepare("SELECT COUNT(*) as c FROM drive_rsvps WHERE user_id = ?").get(userId) as { c: number }
  ).c;
  const campingTripsAttended = (
    db.prepare("SELECT COUNT(*) as c FROM camping_rsvps WHERE user_id = ?").get(userId) as { c: number }
  ).c;
  const coursesEnrolled = (
    db.prepare("SELECT COUNT(*) as c FROM academy_enrollments WHERE user_id = ?").get(userId) as { c: number }
  ).c;
  const forumPostCount = (
    db.prepare("SELECT COUNT(*) as c FROM forum_posts WHERE author_id = ?").get(userId) as { c: number }
  ).c;

  return {
    id: user.id,
    displayName: user.displayName,
    bio: user.bio,
    avatarPath: user.avatarPath,
    memberSince: user.memberSince,
    drivesAttended,
    campingTripsAttended,
    coursesEnrolled,
    forumPostCount,
  };
}
